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
 *   run            Start the interactive migration wizard (dry run by default)
 *
 * Options:
 *   -h, --help            Show help information
 *   -v, --version         Show version number
 *   -a, --apply           Actually apply changes (without this flag, runs in dry run mode)
 *   -r, --root <path>     Custom scan root directory (default: home directory)
 *   -e, --exclude <dirs>  Additional directories to exclude (comma-separated)
 *   -p, --pattern <regex> Custom regex pattern for matching (advanced)
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

/**
 * Get argument value for a flag
 */
function getArgValue(args: string[], flags: string[]): string | undefined {
  for (const flag of flags) {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    // Also check for --flag=value format
    const prefixMatch = args.find((arg) => arg.startsWith(`${flag}=`));
    if (prefixMatch) {
      return prefixMatch.slice(flag.length + 1);
    }
  }
  return undefined;
}

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help, version, or run flags
const showHelp = args.includes('-h') || args.includes('--help') || args.length === 0;
const showVersion = args.includes('-v') || args.includes('--version');
const runApp = args.includes('run') || args.includes('--run');
const applyChanges = args.includes('--apply') || args.includes('-a');

// Parse additional options
const customRoot = getArgValue(args, ['-r', '--root']);
const excludeDirs = getArgValue(args, ['-e', '--exclude']);
const customPattern = getArgValue(args, ['-p', '--pattern']);

// Parse exclude directories into array
const extraExcludes = excludeDirs ? excludeDirs.split(',').map((d) => d.trim()) : [];

// Handle graceful exit
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Render based on arguments
if (runApp) {
  // Run the main application (dry run by default, use --apply to actually make changes)
  render(
    <App dryRun={!applyChanges} scanRoot={customRoot} extraExcludes={extraExcludes} customPattern={customPattern} />
  );
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
