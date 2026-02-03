/**
 * Core type definitions for GitHub Username Migrator
 */

/**
 * Represents a Git remote configuration
 */
export interface GitRemote {
  /** Remote name (e.g., "origin", "upstream") */
  name: string;
  /** Remote URL (SSH or HTTPS format) */
  url: string;
}

/**
 * Represents a discovered Git repository
 */
export interface Repository {
  /** Absolute path to the repository root (directory containing .git) */
  path: string;
  /** List of remotes configured in this repository */
  remotes: GitRemote[];
}

/**
 * Represents a repository that matches the migration criteria
 */
export interface MatchedRepository extends Repository {
  /** Remotes that contain the old username and will be migrated */
  matchedRemotes: {
    remote: GitRemote;
    /** The new URL after migration */
    newUrl: string;
  }[];
}

/**
 * Result of scanning a directory for repositories
 */
export interface ScanResult {
  /** Total number of directories scanned */
  directoriesScanned: number;
  /** Total number of .git repositories found */
  repositoriesFound: number;
  /** Repositories that match the migration criteria */
  matchedRepositories: MatchedRepository[];
  /** Time taken to scan in milliseconds */
  elapsedMs: number;
  /** Directories that were skipped due to errors */
  errors: ScanError[];
}

/**
 * Error encountered during scanning
 */
export interface ScanError {
  /** Path where the error occurred */
  path: string;
  /** Error message */
  message: string;
}

/**
 * Progress information during scanning
 */
export interface ScanProgress {
  /** Current directory being scanned */
  currentPath: string;
  /** Number of directories scanned so far */
  directoriesScanned: number;
  /** Number of directories skipped (ignored patterns) */
  skippedDirectories: number;
  /** Number of repositories found so far */
  repositoriesFound: number;
  /** Number of matched repositories found so far */
  matchedCount: number;
}

/**
 * Single migration operation log entry
 */
export interface MigrationLogEntry {
  /** Timestamp of the operation */
  timestamp: Date;
  /** Repository path */
  repositoryPath: string;
  /** Remote name that was modified */
  remoteName: string;
  /** Original URL before migration */
  oldUrl: string;
  /** New URL after migration */
  newUrl: string;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Result of a single migration operation
 */
export interface MigrationResult {
  /** Repository that was migrated */
  repository: MatchedRepository;
  /** Results for each remote that was migrated */
  results: {
    remoteName: string;
    oldUrl: string;
    newUrl: string;
    success: boolean;
    error?: string;
  }[];
}

/**
 * Overall migration session log
 */
export interface MigrationLog {
  /** Session start timestamp */
  startedAt: Date;
  /** Session end timestamp */
  endedAt?: Date;
  /** Old GitHub username */
  oldUsername: string;
  /** New GitHub username */
  newUsername: string;
  /** Root directory that was scanned */
  scanRoot: string;
  /** Individual migration entries */
  entries: MigrationLogEntry[];
  /** Summary statistics */
  summary: {
    totalRepositories: number;
    successfulMigrations: number;
    failedMigrations: number;
  };
}

/**
 * Application state for the TUI
 */
export type AppState =
  | { phase: 'welcome' }
  | { phase: 'input'; oldUsername: string; newUsername: string }
  | { phase: 'scanning'; oldUsername: string; newUsername: string; progress: ScanProgress }
  | { phase: 'review'; oldUsername: string; newUsername: string; scanResult: ScanResult }
  | { phase: 'confirm'; oldUsername: string; newUsername: string; scanResult: ScanResult }
  | { phase: 'migrating'; oldUsername: string; newUsername: string; progress: MigrationProgress }
  | { phase: 'complete'; oldUsername: string; newUsername: string; log: MigrationLog };

/**
 * Progress information during migration
 */
export interface MigrationProgress {
  /** Total number of repositories to migrate */
  total: number;
  /** Number of repositories migrated so far */
  completed: number;
  /** Current repository being migrated */
  currentRepository?: string;
  /** Results so far */
  results: MigrationResult[];
}
