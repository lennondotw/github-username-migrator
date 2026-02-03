/**
 * Core modules
 */

export {
  extractGitHubUsername,
  findMatchingRemotes,
  getRemoteUrls,
  isGitHubUrl,
  parseGitConfig,
  replaceGitHubUsername,
  setRemoteUrl,
  updateRemoteInConfig,
  urlContainsUsername,
} from './git-remote';
export { MigrationLogger, createLogger, generateLogFilename, getAppDataDir, getLogsDir } from './logger';
export { dryRun, getMigrationSummary, migrate } from './migrator';
export { countRepositories, isGitRepository, scanForRepositories } from './scanner';
