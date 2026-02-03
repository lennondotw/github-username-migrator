/**
 * Git remote URL parsing and modification utilities.
 *
 * Supports both SSH and HTTPS formats:
 * - SSH: git@github.com:username/repo.git
 * - HTTPS: https://github.com/username/repo.git
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { GitRemote } from '../types';

/**
 * Regular expressions for parsing GitHub URLs
 */
const GITHUB_SSH_REGEX = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/;
const GITHUB_HTTPS_REGEX = /^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/;

/**
 * Parse a git config file content and extract remote URLs
 *
 * @param configContent - The content of a .git/config file
 * @returns Array of GitRemote objects
 */
export function parseGitConfig(configContent: string): GitRemote[] {
  const remotes: GitRemote[] = [];
  const lines = configContent.split('\n');

  let currentRemote: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for remote section header: [remote "origin"]
    const remoteMatch = /^\[remote\s+"([^"]+)"\]$/.exec(trimmedLine);
    if (remoteMatch) {
      currentRemote = remoteMatch[1] ?? null;
      continue;
    }

    // Check for other section headers (exits remote context)
    if (trimmedLine.startsWith('[')) {
      currentRemote = null;
      continue;
    }

    // Check for url within remote section
    if (currentRemote !== null) {
      const urlMatch = /^url\s*=\s*(.+)$/.exec(trimmedLine);
      if (urlMatch?.[1]) {
        remotes.push({
          name: currentRemote,
          url: urlMatch[1].trim(),
        });
      }
    }
  }

  return remotes;
}

/**
 * Read and parse remotes from a repository's .git/config
 *
 * @param repoPath - Path to the repository root (containing .git directory)
 * @returns Array of GitRemote objects
 * @throws If the config file cannot be read or parsed
 */
export async function getRemoteUrls(repoPath: string): Promise<GitRemote[]> {
  const configPath = join(repoPath, '.git', 'config');
  const content = await readFile(configPath, 'utf-8');
  return parseGitConfig(content);
}

/**
 * Check if a URL is a GitHub URL (SSH or HTTPS)
 */
export function isGitHubUrl(url: string): boolean {
  return GITHUB_SSH_REGEX.test(url) || GITHUB_HTTPS_REGEX.test(url);
}

/**
 * Extract the username from a GitHub URL
 *
 * @param url - GitHub URL (SSH or HTTPS format)
 * @returns The username or null if not a valid GitHub URL
 */
export function extractGitHubUsername(url: string): string | null {
  const sshMatch = GITHUB_SSH_REGEX.exec(url);
  if (sshMatch) {
    return sshMatch[1] ?? null;
  }

  const httpsMatch = GITHUB_HTTPS_REGEX.exec(url);
  if (httpsMatch) {
    return httpsMatch[1] ?? null;
  }

  return null;
}

/**
 * Replace the username in a GitHub URL
 *
 * @param url - Original GitHub URL
 * @param oldUsername - Username to replace (case-insensitive)
 * @param newUsername - New username
 * @returns New URL with username replaced, or original URL if no match
 */
export function replaceGitHubUsername(url: string, oldUsername: string, newUsername: string): string {
  // SSH format: git@github.com:username/repo.git
  const sshMatch = GITHUB_SSH_REGEX.exec(url);
  if (sshMatch && sshMatch[1]?.toLowerCase() === oldUsername.toLowerCase()) {
    const repo = sshMatch[2];
    const hasGitSuffix = url.endsWith('.git');
    return `git@github.com:${newUsername}/${repo}${hasGitSuffix ? '.git' : ''}`;
  }

  // HTTPS format: https://github.com/username/repo.git
  const httpsMatch = GITHUB_HTTPS_REGEX.exec(url);
  if (httpsMatch && httpsMatch[1]?.toLowerCase() === oldUsername.toLowerCase()) {
    const repo = httpsMatch[2];
    const hasGitSuffix = url.endsWith('.git');
    return `https://github.com/${newUsername}/${repo}${hasGitSuffix ? '.git' : ''}`;
  }

  return url;
}

/**
 * Check if a URL contains the specified GitHub username
 *
 * @param url - GitHub URL to check
 * @param username - Username to look for (case-insensitive)
 * @returns true if the URL contains the username
 */
export function urlContainsUsername(url: string, username: string): boolean {
  const extractedUsername = extractGitHubUsername(url);
  return extractedUsername !== null && extractedUsername.toLowerCase() === username.toLowerCase();
}

/**
 * Update a remote URL in a git config file
 *
 * @param configContent - Original config file content
 * @param remoteName - Name of the remote to update
 * @param newUrl - New URL to set
 * @returns Updated config file content
 */
export function updateRemoteInConfig(configContent: string, remoteName: string, newUrl: string): string {
  const lines = configContent.split('\n');
  const result: string[] = [];

  let inTargetRemote = false;
  let urlUpdated = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for remote section header
    const remoteMatch = /^\[remote\s+"([^"]+)"\]$/.exec(trimmedLine);
    if (remoteMatch) {
      inTargetRemote = remoteMatch[1] === remoteName;
      result.push(line);
      continue;
    }

    // Check for other section headers
    if (trimmedLine.startsWith('[')) {
      inTargetRemote = false;
      result.push(line);
      continue;
    }

    // Update URL if in target remote section
    if (inTargetRemote && !urlUpdated) {
      const urlMatch = /^(\s*)url\s*=\s*(.+)$/.exec(line);
      if (urlMatch) {
        const indent = urlMatch[1] ?? '';
        result.push(`${indent}url = ${newUrl}`);
        urlUpdated = true;
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Set a remote URL in a repository using direct config file modification
 *
 * @param repoPath - Path to the repository root
 * @param remoteName - Name of the remote to update
 * @param newUrl - New URL to set
 * @throws If the operation fails
 */
export async function setRemoteUrl(repoPath: string, remoteName: string, newUrl: string): Promise<void> {
  const configPath = join(repoPath, '.git', 'config');
  const content = await readFile(configPath, 'utf-8');
  const updatedContent = updateRemoteInConfig(content, remoteName, newUrl);
  await writeFile(configPath, updatedContent, 'utf-8');
}

/**
 * Get information about which remotes in a repository match a username
 *
 * @param repoPath - Path to the repository root
 * @param username - GitHub username to look for
 * @returns Object with matched remotes and their proposed new URLs
 */
export async function findMatchingRemotes(
  repoPath: string,
  oldUsername: string,
  newUsername: string
): Promise<
  {
    remote: GitRemote;
    newUrl: string;
  }[]
> {
  const remotes = await getRemoteUrls(repoPath);
  const matches: { remote: GitRemote; newUrl: string }[] = [];

  for (const remote of remotes) {
    if (urlContainsUsername(remote.url, oldUsername)) {
      matches.push({
        remote,
        newUrl: replaceGitHubUsername(remote.url, oldUsername, newUsername),
      });
    }
  }

  return matches;
}
