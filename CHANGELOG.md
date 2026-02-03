# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-03

### Added

- Glob pattern support for `-e, --exclude` option (can be specified multiple times)
- Custom regex matching with `--pattern-from` and `--pattern-to` for advanced URL transformations
- Display skipped directories count during scanning
- Full path and URL change preview in repository list (old URL → new URL)

### Changed

- Use Ink `<Static>` component for immediate help/version output
- Improved help screen with advanced usage examples

## [0.1.0] - 2026-02-03

### Added

- Initial release
- Interactive TUI for username migration workflow
- Recursive directory scanning with smart ignore patterns
- Support for SSH and HTTPS GitHub remote URLs
- Real-time progress display during scanning and migration
- Confirmation step before applying changes
- Comprehensive logging to `~/.github-username-migrator/logs/`
- Cross-platform binaries for:
  - Linux x64/arm64
  - macOS x64/arm64
  - Windows x64
- GitHub Actions CI/CD pipeline with:
  - Lint, typecheck, and test jobs
  - Matrix testing across operating systems
  - Automated binary builds for releases
  - Artifact uploads for all platforms
