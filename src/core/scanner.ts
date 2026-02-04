/**
 * Directory scanner for finding Git repositories.
 *
 * Uses async iteration for memory efficiency and supports
 * progress callbacks for UI updates.
 */

import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { shouldIgnoreSegment } from '../constants/ignore-patterns';
import type { MatchedRepository, ScanError, ScanProgress, ScanResult } from '../types';
import { findMatchingRemotes, findMatchingRemotesWithPattern, getRemoteUrls } from './git-remote';

/**
 * Simple glob pattern matcher
 * Supports: * (any chars except /), ** (any chars including /), ? (single char)
 */
function matchGlob(pattern: string, name: string): boolean {
  // Convert glob pattern to regex
  let regexStr = '^';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        // ** matches anything
        regexStr += '.*';
        i++; // Skip next *
      } else {
        // * matches anything except /
        regexStr += '[^/]*';
      }
    } else if (char === '?') {
      regexStr += '.';
    } else if (char !== undefined && '.+^${}|()[]\\'.includes(char)) {
      regexStr += '\\' + char;
    } else if (char !== undefined) {
      regexStr += char;
    }
  }
  regexStr += '$';

  return new RegExp(regexStr, 'i').test(name);
}

/**
 * Check if a directory name matches any exclude pattern
 */
function matchesExcludePattern(name: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchGlob(pattern, name));
}

/** Custom pattern for matching and replacing remote URLs */
export interface CustomPattern {
  /** Regex pattern to match remote URLs */
  from: string;
  /** Replacement string (supports $1, $2, etc. for capture groups) */
  to: string;
}

/**
 * Options for the scanner
 */
export interface ScanOptions {
  /** Callback for progress updates */
  onProgress?: (progress: ScanProgress) => void;
  /** Maximum depth to scan (default: 20) */
  maxDepth?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Glob patterns to exclude directories */
  excludePatterns?: string[];
  /** Custom regex pattern for matching/replacing URLs */
  customPattern?: CustomPattern;
}

/**
 * Check if a path is a git repository (contains .git directory)
 */
export async function isGitRepository(dirPath: string): Promise<boolean> {
  try {
    const gitPath = join(dirPath, '.git');
    const stats = await stat(gitPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively scan a directory for git repositories
 */
async function* scanDirectory(
  dirPath: string,
  depth: number,
  maxDepth: number,
  signal?: AbortSignal,
  excludePatterns: string[] = []
): AsyncGenerator<
  { type: 'dir' } | { type: 'skip' } | { type: 'repo'; path: string } | { type: 'error'; path: string; message: string }
> {
  if (signal?.aborted) {
    return;
  }

  if (depth > maxDepth) {
    return;
  }

  // Yield directory count
  yield { type: 'dir' };

  // Check if this is a git repository
  if (await isGitRepository(dirPath)) {
    yield { type: 'repo', path: dirPath };
    // Don't scan inside .git directories
    return;
  }

  // Try to read directory contents
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    yield {
      type: 'error',
      path: dirPath,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return;
  }

  for (const entry of entries) {
    if (signal?.aborted) {
      break;
    }

    // Skip non-directories
    if (!entry.isDirectory()) {
      continue;
    }

    const name = entry.name;

    // Skip hidden directories except .git (which we handle specially)
    if (name.startsWith('.') && name !== '.git') {
      yield { type: 'skip' };
      continue;
    }

    // Skip ignored directories
    if (shouldIgnoreSegment(name)) {
      yield { type: 'skip' };
      continue;
    }

    // Skip directories matching exclude patterns (glob)
    if (matchesExcludePattern(name, excludePatterns)) {
      yield { type: 'skip' };
      continue;
    }

    const fullPath = join(dirPath, name);

    // Recursively scan subdirectory
    yield* scanDirectory(fullPath, depth + 1, maxDepth, signal, excludePatterns);
  }
}

/**
 * Scan for git repositories and find those matching the username
 */
export async function scanForRepositories(
  rootDir: string,
  oldUsername: string,
  newUsername: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const { onProgress, maxDepth = 20, signal, excludePatterns = [], customPattern } = options;

  const startTime = Date.now();
  const matchedRepositories: MatchedRepository[] = [];
  const errors: ScanError[] = [];
  let directoriesScanned = 0;
  let skippedDirectories = 0;
  let repositoriesFound = 0;

  // Progress throttling - update at most every 100ms
  let lastProgressUpdate = 0;
  const progressThrottleMs = 100;

  const updateProgress = (currentPath: string) => {
    const now = Date.now();
    if (onProgress && now - lastProgressUpdate >= progressThrottleMs) {
      lastProgressUpdate = now;
      onProgress({
        currentPath,
        directoriesScanned,
        skippedDirectories,
        repositoriesFound,
        matchedCount: matchedRepositories.length,
      });
    }
  };

  // Scan directories
  for await (const event of scanDirectory(rootDir, 0, maxDepth, signal, excludePatterns)) {
    if (signal?.aborted) {
      break;
    }

    if (event.type === 'dir') {
      directoriesScanned++;
      continue;
    }

    if (event.type === 'skip') {
      skippedDirectories++;
      continue;
    }

    if (event.type === 'error') {
      errors.push({ path: event.path, message: event.message });
      continue;
    }

    // event.type === 'repo'
    repositoriesFound++;
    updateProgress(event.path);

    try {
      const remotes = await getRemoteUrls(event.path);

      // Use custom pattern if provided, otherwise use username-based matching
      const matchedRemotes = customPattern
        ? await findMatchingRemotesWithPattern(event.path, customPattern.from, customPattern.to)
        : await findMatchingRemotes(event.path, oldUsername, newUsername);

      if (matchedRemotes.length > 0) {
        matchedRepositories.push({
          path: event.path,
          remotes,
          matchedRemotes,
        });
      }
    } catch (error) {
      errors.push({
        path: event.path,
        message: error instanceof Error ? error.message : 'Failed to read repository',
      });
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      currentPath: '',
      directoriesScanned,
      skippedDirectories,
      repositoriesFound,
      matchedCount: matchedRepositories.length,
    });
  }

  return {
    directoriesScanned,
    repositoriesFound,
    matchedRepositories,
    elapsedMs: Date.now() - startTime,
    errors,
  };
}

/**
 * Quick scan to estimate the number of repositories
 * (useful for showing a progress bar)
 */
export async function countRepositories(rootDir: string = homedir(), maxDepth = 20): Promise<number> {
  let count = 0;

  for await (const event of scanDirectory(rootDir, 0, maxDepth)) {
    if (event.type === 'repo') {
      count++;
    }
  }

  return count;
}
