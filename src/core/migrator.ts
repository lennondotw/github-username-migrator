/**
 * Migration executor for applying username changes to repositories.
 *
 * This module handles the actual modification of git remote URLs,
 * with full logging and progress tracking.
 */

import type { MatchedRepository, MigrationLog, MigrationProgress, MigrationResult } from '../types';
import { setRemoteUrl } from './git-remote';
import { createLogger, type MigrationLogger } from './logger';

/**
 * Options for migration execution
 */
export interface MigrateOptions {
  /** Repositories to migrate */
  repositories: MatchedRepository[];
  /** Old GitHub username */
  oldUsername: string;
  /** New GitHub username */
  newUsername: string;
  /** Root directory that was scanned (for logging) */
  scanRoot: string;
  /** Callback for progress updates */
  onProgress?: (progress: MigrationProgress) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of migration execution
 */
export interface MigrateResult {
  /** All migration results */
  results: MigrationResult[];
  /** The migration log */
  log: MigrationLog;
  /** Path to the log file */
  logPath: string;
}

/**
 * Execute migration for a single repository
 */
async function migrateRepository(repository: MatchedRepository, logger: MigrationLogger): Promise<MigrationResult> {
  const results: MigrationResult['results'] = [];

  for (const { remote, newUrl } of repository.matchedRemotes) {
    try {
      await setRemoteUrl(repository.path, remote.name, newUrl);

      await logger.logSuccess(repository.path, remote.name, remote.url, newUrl);

      results.push({
        remoteName: remote.name,
        oldUrl: remote.url,
        newUrl,
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await logger.logFailure(repository.path, remote.name, remote.url, newUrl, errorMessage);

      results.push({
        remoteName: remote.name,
        oldUrl: remote.url,
        newUrl,
        success: false,
        error: errorMessage,
      });
    }
  }

  return {
    repository,
    results,
  };
}

/**
 * Execute migration for all matched repositories
 */
export async function migrate(options: MigrateOptions): Promise<MigrateResult> {
  const { repositories, oldUsername, newUsername, scanRoot, onProgress, signal } = options;

  const logger = createLogger(oldUsername, newUsername, scanRoot);
  await logger.initialize();

  const results: MigrationResult[] = [];
  let completed = 0;

  // Initial progress update
  if (onProgress) {
    onProgress({
      total: repositories.length,
      completed: 0,
      results: [],
    });
  }

  for (const repository of repositories) {
    // Check for cancellation
    if (signal?.aborted) {
      break;
    }

    // Update progress with current repository
    if (onProgress) {
      onProgress({
        total: repositories.length,
        completed,
        currentRepository: repository.path,
        results: [...results],
      });
    }

    // Migrate this repository
    const result = await migrateRepository(repository, logger);
    results.push(result);
    completed++;

    // Update progress after completion
    if (onProgress) {
      onProgress({
        total: repositories.length,
        completed,
        results: [...results],
      });
    }
  }

  // Finalize the log
  const log = await logger.finalize();

  return {
    results,
    log,
    logPath: logger.getLogPath(),
  };
}

/**
 * Perform a dry run of migration (no actual changes)
 *
 * This validates all operations without modifying any files.
 */
export async function dryRun(repositories: MatchedRepository[]): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];

  for (const repository of repositories) {
    // Check if repository path exists and is accessible
    try {
      const { stat } = await import('node:fs/promises');
      await stat(repository.path);
    } catch {
      issues.push(`Repository not accessible: ${repository.path}`);
      continue;
    }

    // Validate each remote
    for (const { remote, newUrl } of repository.matchedRemotes) {
      if (!newUrl) {
        issues.push(`Invalid new URL for ${repository.path}:${remote.name}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get a summary of what will be migrated
 */
export function getMigrationSummary(repositories: MatchedRepository[]): {
  totalRepositories: number;
  totalRemotes: number;
  repositories: {
    path: string;
    remotes: {
      name: string;
      oldUrl: string;
      newUrl: string;
    }[];
  }[];
} {
  let totalRemotes = 0;

  const repoSummaries = repositories.map((repo) => {
    totalRemotes += repo.matchedRemotes.length;

    return {
      path: repo.path,
      remotes: repo.matchedRemotes.map(({ remote, newUrl }) => ({
        name: remote.name,
        oldUrl: remote.url,
        newUrl,
      })),
    };
  });

  return {
    totalRepositories: repositories.length,
    totalRemotes,
    repositories: repoSummaries,
  };
}
