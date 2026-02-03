# GitHub Username Migrator

CLI tool to scan all git repositories in your home directory and migrate GitHub username in remote URLs.

## Features

- Scans all `.git` repositories recursively from home directory
- Smart ignore patterns (node_modules, caches, etc.)
- Interactive TUI with progress display
- Dry-run mode for safety
- Detailed migration logs
- Cross-platform support (Windows, macOS, Linux)

## Installation

### Download Binary

Download the pre-built binary for your platform from [Releases](https://github.com/lennondotw/github-username-migrator/releases).

### From Source

```bash
# Clone the repository
git clone https://github.com/lennondotw/github-username-migrator.git
cd github-username-migrator

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build
```

## Usage

```bash
# Run the CLI
github-username-migrator

# Or run directly with bun
bun run src/index.tsx
```

The tool will:
1. Ask for your old GitHub username
2. Ask for your new GitHub username
3. Scan all git repositories in your home directory
4. Display all repositories with matching remote URLs
5. Ask for confirmation before making changes
6. Migrate remote URLs and log all changes

## Development

```bash
# Install dependencies
pnpm install

# Run in development
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint

# Type check
pnpm typecheck
```

## Tech Stack

- **Runtime**: Bun
- **Package Manager**: pnpm
- **Language**: TypeScript
- **TUI**: Ink (React for CLI)
- **Linting**: ESLint + Prettier
- **Testing**: Bun Test

## License

MIT
