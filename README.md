# GitHub Username Migrator

A cross-platform CLI tool to scan all git repositories and migrate GitHub username in remote URLs.

Perfect for when you change your GitHub username and need to update all your local repositories.

<img width="3246" height="2536" alt="image" src="https://github.com/user-attachments/assets/109d2153-3fa2-48bb-8640-9ec0b9b48cee" />

<img width="3242" height="2468" alt="image" src="https://github.com/user-attachments/assets/dfe25a8c-a4a3-4b4c-976b-efc7997934ee" />

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
| Linux | x64 | [`github-username-migrator-linux-x64`](https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-linux-x64) |
| Linux | arm64 | [`github-username-migrator-linux-arm64`](https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-linux-arm64) |
| macOS | x64 (Intel) | [`github-username-migrator-darwin-x64`](https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-darwin-x64) |
| macOS | arm64 (Apple Silicon) | [`github-username-migrator-darwin-arm64`](https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-darwin-arm64) |
| Windows | x64 | [`github-username-migrator-windows-x64.exe`](https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-windows-x64.exe) |

#### macOS / Linux

```bash
# Download (example for macOS Apple Silicon)
curl -L -o github-username-migrator \
  https://github.com/lennondotw/github-username-migrator/releases/latest/download/github-username-migrator-darwin-arm64

# Make executable
chmod +x github-username-migrator

# macOS only: Remove quarantine attribute
xattr -cr github-username-migrator

# Run
./github-username-migrator
```

#### Windows

Download `github-username-migrator-windows-x64.exe` from releases and run:

```powershell
.\github-username-migrator-windows-x64.exe
```

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
# Show help
./github-username-migrator

# Start interactive wizard (dry run by default)
./github-username-migrator run

# Apply changes (actually modify git remotes)
./github-username-migrator run --apply

# Scan a specific directory
./github-username-migrator run --root ~/Projects

# Exclude directories (glob patterns, repeatable)
./github-username-migrator run -e "backup*" -e "archive"

# Custom regex pattern matching (advanced)
./github-username-migrator run --pattern-from "github.com/olduser" --pattern-to "github.com/newuser"
```

### Workflow

1. **Enter old username**: Your previous GitHub username
2. **Enter new username**: Your new GitHub username
3. **Scanning**: The tool scans your home directory for git repositories
4. **Review**: View all repositories that will be updated (↑↓ scroll, J/K page)
5. **Confirm**: Approve the changes (or cancel)
6. **Migration**: URLs are updated with detailed progress
7. **Complete**: Summary and log file location

### Supported URL Formats

The tool handles both SSH and HTTPS remote URLs:

```
git@github.com:olduser/repo.git     → git@github.com:newuser/repo.git
https://github.com/olduser/repo.git → https://github.com/newuser/repo.git
```

### Options

| Option | Description |
|--------|-------------|
| `-a, --apply` | Actually apply changes (default: dry run) |
| `-r, --root <path>` | Custom scan root directory |
| `-e, --exclude <glob>` | Exclude directories matching glob (repeatable) |
| `--pattern-from <regex>` | Custom regex to match URLs |
| `--pattern-to <string>` | Replacement string ($1, $2 for capture groups) |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

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
