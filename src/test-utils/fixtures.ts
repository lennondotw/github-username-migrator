/**
 * Test utilities for creating temporary Git repositories and directory structures.
 * All fixtures are created in os.tmpdir() and cleaned up after tests.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Generate a unique temporary directory path
 */
function getTempPath(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return join(tmpdir(), `${prefix}-${timestamp}-${random}`);
}

/**
 * Options for creating a temporary Git repository
 */
export interface CreateTempRepoOptions {
  /** Remote configurations to add (name -> url mapping) */
  remotes?: Record<string, string>;
  /** Whether to create a nested directory structure */
  nested?: boolean;
  /** Custom subdirectory path within the temp directory */
  subdir?: string;
}

/**
 * Result of creating a temporary repository
 */
export interface TempRepoResult {
  /** Absolute path to the repository root */
  path: string;
  /** Absolute path to the .git directory */
  gitDir: string;
  /** Cleanup function to remove the temporary directory */
  cleanup: () => Promise<void>;
}

const TAB = '\t';

/**
 * Create a minimal .git/config file content
 */
function createGitConfig(remotes: Record<string, string>): string {
  const lines = ['[core]', `${TAB}repositoryformatversion = 0`, `${TAB}filemode = true`, `${TAB}bare = false`];

  for (const [name, url] of Object.entries(remotes)) {
    lines.push(`[remote "${name}"]`, `${TAB}url = ${url}`, `${TAB}fetch = +refs/heads/*:refs/remotes/${name}/*`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Create a temporary Git repository with specified remotes.
 *
 * This creates a minimal .git directory structure with only the config file,
 * sufficient for testing remote URL parsing and modification.
 *
 * @example
 * ```ts
 * const repo = await createTempRepo({
 *   remotes: {
 *     origin: 'git@github.com:olduser/repo.git',
 *     upstream: 'https://github.com/someorg/repo.git'
 *   }
 * });
 *
 * // ... run tests ...
 *
 * await repo.cleanup();
 * ```
 */
export async function createTempRepo(options: CreateTempRepoOptions = {}): Promise<TempRepoResult> {
  const { remotes = {}, nested = false, subdir } = options;

  const basePath = getTempPath('git-migrator-test');
  const repoPath = subdir ? join(basePath, subdir) : nested ? join(basePath, 'projects', 'my-repo') : basePath;
  const gitDir = join(repoPath, '.git');

  // Create directory structure
  await mkdir(gitDir, { recursive: true });

  // Create minimal git files
  await writeFile(join(gitDir, 'config'), createGitConfig(remotes));
  await writeFile(join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');

  // Create refs directory
  await mkdir(join(gitDir, 'refs', 'heads'), { recursive: true });

  const cleanup = async () => {
    await rm(basePath, { recursive: true, force: true });
  };

  return { path: repoPath, gitDir, cleanup };
}

/**
 * Repository definition for creating a test directory structure
 */
export interface TestRepoDefinition {
  /** Relative path from the base directory */
  path: string;
  /** Remote configurations */
  remotes: Record<string, string>;
}

/**
 * Result of creating a test directory structure
 */
export interface TestDirectoryResult {
  /** Absolute path to the base directory */
  basePath: string;
  /** Absolute paths to all created repositories */
  repoPaths: string[];
  /** Cleanup function to remove the entire structure */
  cleanup: () => Promise<void>;
}

/**
 * Create a directory structure with multiple Git repositories.
 *
 * This is useful for testing the scanner's ability to find repositories
 * in nested directory structures.
 *
 * @example
 * ```ts
 * const testDir = await createTestDirectory([
 *   { path: 'project-a', remotes: { origin: 'git@github.com:olduser/a.git' } },
 *   { path: 'work/project-b', remotes: { origin: 'git@github.com:olduser/b.git' } },
 *   { path: 'other/project-c', remotes: { origin: 'git@github.com:other/c.git' } },
 * ]);
 *
 * // ... run tests ...
 *
 * await testDir.cleanup();
 * ```
 */
export async function createTestDirectory(repos: TestRepoDefinition[]): Promise<TestDirectoryResult> {
  const basePath = getTempPath('git-migrator-test-dir');
  const repoPaths: string[] = [];

  await mkdir(basePath, { recursive: true });

  for (const repo of repos) {
    const repoPath = join(basePath, repo.path);
    const gitDir = join(repoPath, '.git');

    await mkdir(gitDir, { recursive: true });
    await writeFile(join(gitDir, 'config'), createGitConfig(repo.remotes));
    await writeFile(join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');
    await mkdir(join(gitDir, 'refs', 'heads'), { recursive: true });

    repoPaths.push(repoPath);
  }

  const cleanup = async () => {
    await rm(basePath, { recursive: true, force: true });
  };

  return { basePath, repoPaths, cleanup };
}

/**
 * Create a directory with a corrupted/invalid .git structure.
 * Useful for testing error handling.
 */
export async function createCorruptedRepo(): Promise<TempRepoResult> {
  const basePath = getTempPath('git-migrator-corrupted');
  const gitDir = join(basePath, '.git');

  await mkdir(gitDir, { recursive: true });
  // Create an invalid config file
  await writeFile(join(gitDir, 'config'), 'this is not a valid git config\n[invalid');

  const cleanup = async () => {
    await rm(basePath, { recursive: true, force: true });
  };

  return { path: basePath, gitDir, cleanup };
}

/**
 * Create a bare Git repository (no working directory).
 */
export async function createBareRepo(remotes: Record<string, string> = {}): Promise<TempRepoResult> {
  const basePath = getTempPath('git-migrator-bare');

  await mkdir(basePath, { recursive: true });
  await writeFile(join(basePath, 'config'), createGitConfig(remotes));
  await writeFile(join(basePath, 'HEAD'), 'ref: refs/heads/main\n');
  await mkdir(join(basePath, 'refs', 'heads'), { recursive: true });

  const cleanup = async () => {
    await rm(basePath, { recursive: true, force: true });
  };

  return { path: basePath, gitDir: basePath, cleanup };
}
