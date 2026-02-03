# Agent Instructions

## Development Workflow

1. Make changes
2. Run `pnpm lint && pnpm typecheck && pnpm test`
3. Commit with conventional commits (feat/fix/refactor/chore)
4. Push and wait for CI to pass

## Release Workflow

1. Update version in `package.json` and `src/components/help.tsx`
2. Update `CHANGELOG.md`
3. Commit: `chore: bump version to X.Y.Z`
4. Create tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`
6. Release workflow builds binaries automatically

## Key Files

- `src/index.tsx` - CLI entry point, argument parsing
- `src/app.tsx` - Main TUI application component
- `src/core/scanner.ts` - Directory scanning logic
- `src/core/git-remote.ts` - Git remote URL parsing/modification
- `src/components/help.tsx` - Help screen (update VERSION constant)

## Testing

- Unit tests in `src/**/__tests__/`
- Test fixtures in `src/test-utils/fixtures.ts`
- Run specific test: `bun test <pattern>`

## Build Targets

5 platforms: `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows-x64`

Note: `windows-arm64` not supported by Bun.
