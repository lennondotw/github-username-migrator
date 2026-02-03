#!/usr/bin/env bun
/**
 * GitHub Username Migrator
 *
 * CLI tool to scan all git repositories and migrate GitHub username in remote URLs.
 *
 * Usage:
 *   github-username-migrator [command] [options]
 *
 * Commands:
 *   run            Start the interactive migration wizard
 *
 * Options:
 *   -h, --help     Show help information
 *   -v, --version  Show version number
 *
 * The tool will interactively prompt for:
 * - Old GitHub username (to find)
 * - New GitHub username (to replace with)
 *
 * Then it will:
 * 1. Scan your home directory for git repositories
 * 2. Show matching repositories for review
 * 3. Ask for confirmation before making changes
 * 4. Migrate remote URLs and log all changes
 */

import { render } from 'ink';

import { App } from './app';
import { Help, Version } from './components';

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help, version, or run flags
const showHelp = args.includes('-h') || args.includes('--help') || args.length === 0;
const showVersion = args.includes('-v') || args.includes('--version');
const runApp = args.includes('run') || args.includes('--run');

// Handle graceful exit
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Render based on arguments
if (runApp) {
  // Run the main application
  render(<App />);
} else if (showVersion && !showHelp) {
  const { unmount } = render(<Version />);
  // Exit after rendering version
  setTimeout(() => {
    unmount();
    process.exit(0);
  }, 100);
} else {
  // Default: show help
  const { unmount } = render(<Help />);
  // Exit after rendering help
  setTimeout(() => {
    unmount();
    process.exit(0);
  }, 100);
}
