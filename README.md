# GitHub Username Migrator

A cross-platform CLI tool to scan all git repositories and migrate GitHub username in remote URLs.

Perfect for when you change your GitHub username and need to update all your local repositories.

## Features

- **Recursive Scanning**: Scans all `.git` repositories from your home directory
- **Smart Ignore**: Automatically skips `node_modules`, caches, and other non-essential directories
- **Interactive TUI**: Beautiful terminal interface with real-time progress
- **Safety First**: Review all changes before applying, with detailed confirmation
- **Comprehensive Logging**: All changes are logged to `~/.github-username-migrator/logs/`
- **Cross-Platform**: Works on Windows (x64), macOS (x64/arm64), and Linux (x64/arm64)

## Installation

### Download Binary

Download the pre-built binary for your platform from [Releases](https://github.com/lennondotw/github-username-migrator/releases):

| Platform | Architecture | Download |
|----------|--------------|----------|
| Linux | x64 | `github-username-migrator-linux-x64` |
| Linux | arm64 | `github-username-migrator-linux-arm64` |
| macOS | x64 | `github-username-migrator-darwin-x64` |
| macOS | arm64 (Apple Silicon) | `github-username-migrator-darwin-arm64` |
| Windows | x64 | `github-username-migrator-windows-x64.exe` |

### From Source

```bash
# Clone the repository
git clone https://github.com/lennondotw/github-username-migrator.git
cd github-username-migrator

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build standalone binary
pnpm build:compile
```

## Usage

```bash
# Run the CLI
./github-username-migrator

# Or run directly with bun (development)
bun run src/index.tsx
```

### Workflow

1. **Enter old username**: Your previous GitHub username
2. **Enter new username**: Your new GitHub username
3. **Scanning**: The tool scans your home directory for git repositories
4. **Review**: View all repositories that will be updated
5. **Confirm**: Approve the changes (or cancel)
6. **Migration**: URLs are updated with detailed progress
7. **Complete**: Summary and log file location

### Supported URL Formats

The tool handles both SSH and HTTPS remote URLs:

```
git@github.com:olduser/repo.git     → git@github.com:newuser/repo.git
https://github.com/olduser/repo.git → https://github.com/newuser/repo.git
```

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

# Build for all platforms
pnpm build:all
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Package Manager**: pnpm
- **Language**: TypeScript
- **TUI Framework**: [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **Linting**: ESLint + Prettier
- **Testing**: Bun Test

## License

MIT
