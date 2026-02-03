/**
 * Migration logger for recording all changes made during migration.
 *
 * Logs are stored in ~/.github-username-migrator/logs/
 */

import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { MigrationLog, MigrationLogEntry } from '../types';

/**
 * Get the base directory for storing application data
 */
export function getAppDataDir(): string {
  return join(homedir(), '.github-username-migrator');
}

/**
 * Get the directory for storing log files
 */
export function getLogsDir(): string {
  return join(getAppDataDir(), 'logs');
}

/**
 * Generate a timestamped log filename
 */
export function generateLogFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  return `migration-${timestamp}.log`;
}

/**
 * Format a date for log output
 */
function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format a single log entry as a string
 */
export function formatLogEntry(entry: MigrationLogEntry): string {
  const status = entry.success ? 'SUCCESS' : 'FAILED';
  const lines = [
    `[${formatDate(entry.timestamp)}] ${status}`,
    `  Repository: ${entry.repositoryPath}`,
    `  Remote: ${entry.remoteName}`,
    `  Old URL: ${entry.oldUrl}`,
    `  New URL: ${entry.newUrl}`,
  ];

  if (entry.error) {
    lines.push(`  Error: ${entry.error}`);
  }

  return lines.join('\n');
}

/**
 * Format the migration log header
 */
function formatLogHeader(log: MigrationLog): string {
  const lines = [
    '='.repeat(60),
    'GitHub Username Migration Log',
    '='.repeat(60),
    '',
    `Started: ${formatDate(log.startedAt)}`,
    `Old Username: ${log.oldUsername}`,
    `New Username: ${log.newUsername}`,
    `Scan Root: ${log.scanRoot}`,
    '',
    '-'.repeat(60),
    '',
  ];

  return lines.join('\n');
}

/**
 * Format the migration log footer/summary
 */
function formatLogFooter(log: MigrationLog): string {
  const lines = [
    '',
    '-'.repeat(60),
    '',
    'Summary',
    '-------',
    `Ended: ${log.endedAt ? formatDate(log.endedAt) : 'In Progress'}`,
    `Total Repositories: ${log.summary.totalRepositories}`,
    `Successful Migrations: ${log.summary.successfulMigrations}`,
    `Failed Migrations: ${log.summary.failedMigrations}`,
    '',
    '='.repeat(60),
  ];

  return lines.join('\n');
}

/**
 * Logger class for managing migration logs
 */
export class MigrationLogger {
  private logPath: string;
  private initialized = false;
  private log: MigrationLog;

  constructor(oldUsername: string, newUsername: string, scanRoot: string) {
    this.log = {
      startedAt: new Date(),
      oldUsername,
      newUsername,
      scanRoot,
      entries: [],
      summary: {
        totalRepositories: 0,
        successfulMigrations: 0,
        failedMigrations: 0,
      },
    };
    this.logPath = join(getLogsDir(), generateLogFilename());
  }

  /**
   * Get the path to the log file
   */
  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Initialize the logger (create directories and write header)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create logs directory if it doesn't exist
    await mkdir(getLogsDir(), { recursive: true });

    // Write header
    await writeFile(this.logPath, formatLogHeader(this.log), 'utf-8');
    this.initialized = true;
  }

  /**
   * Log a successful migration
   */
  async logSuccess(repositoryPath: string, remoteName: string, oldUrl: string, newUrl: string): Promise<void> {
    const entry: MigrationLogEntry = {
      timestamp: new Date(),
      repositoryPath,
      remoteName,
      oldUrl,
      newUrl,
      success: true,
    };

    await this.appendEntry(entry);
    this.log.summary.successfulMigrations++;
    this.log.summary.totalRepositories++;
  }

  /**
   * Log a failed migration
   */
  async logFailure(
    repositoryPath: string,
    remoteName: string,
    oldUrl: string,
    newUrl: string,
    error: string
  ): Promise<void> {
    const entry: MigrationLogEntry = {
      timestamp: new Date(),
      repositoryPath,
      remoteName,
      oldUrl,
      newUrl,
      success: false,
      error,
    };

    await this.appendEntry(entry);
    this.log.summary.failedMigrations++;
    this.log.summary.totalRepositories++;
  }

  /**
   * Append an entry to the log file
   */
  private async appendEntry(entry: MigrationLogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log.entries.push(entry);
    await appendFile(this.logPath, formatLogEntry(entry) + '\n\n', 'utf-8');
  }

  /**
   * Finalize the log (write summary footer)
   */
  async finalize(): Promise<MigrationLog> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log.endedAt = new Date();
    await appendFile(this.logPath, formatLogFooter(this.log), 'utf-8');

    return this.log;
  }

  /**
   * Get the current log state
   */
  getLog(): MigrationLog {
    return { ...this.log };
  }
}

/**
 * Create a new migration logger
 */
export function createLogger(oldUsername: string, newUsername: string, scanRoot: string): MigrationLogger {
  return new MigrationLogger(oldUsername, newUsername, scanRoot);
}
