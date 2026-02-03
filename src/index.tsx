#!/usr/bin/env bun
/**
 * GitHub Username Migrator
 *
 * CLI tool to scan all git repositories and migrate GitHub username in remote URLs.
 *
 * Usage:
 *   github-username-migrator
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

// Handle graceful exit
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Render the application
render(<App />);
