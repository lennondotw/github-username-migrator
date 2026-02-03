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
 *   -h, --help                Show help information
 *   -v, --version             Show version number
 *   -a, --apply               Actually apply changes (without this flag, runs in dry run mode)
 *   -r, --root <path>         Custom scan root directory (default: home directory)
 *   -e, --exclude <glob>      Exclude directories matching glob (can be specified multiple times)
 *   --pattern-from <regex>    Custom regex to match remote URLs (advanced)
 *   --pattern-to <string>     Replacement string for matched URLs (use $1, $2 for capture groups)
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

import { Box, render, Static } from 'ink';

import { App } from './app';
import { Help, Version } from './components';

/**
 * Static output wrapper - renders content once and exits immediately
 */
const StaticOutput: React.FC<{ content: 'help' | 'version' }> = ({ content }) => {
  return (
    <Static items={[content]}>{(item) => <Box key={item}>{item === 'help' ? <Help /> : <Version />}</Box>}</Static>
  );
};

/**
 * Get argument value for a flag (single value)
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

/**
 * Get all values for a flag (can be specified multiple times)
 */
function getAllArgValues(args: string[], flags: string[]): string[] {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;

    for (const flag of flags) {
      // Check --flag value format
      if (arg === flag && i + 1 < args.length) {
        const nextArg = args[i + 1];
        if (nextArg !== undefined) {
          values.push(nextArg);
          i++; // Skip next arg
        }
        break;
      }
      // Check --flag=value format
      if (arg.startsWith(`${flag}=`)) {
        values.push(arg.slice(flag.length + 1));
        break;
      }
    }
  }
  return values;
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
const patternFrom = getArgValue(args, ['--pattern-from']);
const patternTo = getArgValue(args, ['--pattern-to']);

// Parse exclude patterns (can be specified multiple times)
const excludePatterns = getAllArgValues(args, ['-e', '--exclude']);

// Handle graceful exit
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Build custom pattern config if both from and to are provided
const customPattern = patternFrom && patternTo ? { from: patternFrom, to: patternTo } : undefined;

// Render based on arguments
if (runApp) {
  // Run the main application (dry run by default, use --apply to actually make changes)
  render(
    <App dryRun={!applyChanges} scanRoot={customRoot} excludePatterns={excludePatterns} customPattern={customPattern} />
  );
} else if (showVersion && !showHelp) {
  // Show version using Static for immediate output
  render(<StaticOutput content="version" />);
} else {
  // Default: show help using Static for immediate output
  render(<StaticOutput content="help" />);
}
