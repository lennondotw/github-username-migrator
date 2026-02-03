#!/bin/bash
# Build script for github-username-migrator
# Usage: ./scripts/build.sh [target]
# Targets: compile, linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64, all

set -e

VERSION=$(node -p "require('./package.json').version")
GIT_HASH=$(git rev-parse --short HEAD)
GIT_DIRTY=$(test -n "$(git status --porcelain)" && echo true || echo false)

DEFINES="--define __DEV__=false --define __VERSION__='\"$VERSION\"' --define __GIT_HASH__='\"$GIT_HASH\"' --define __GIT_DIRTY__=$GIT_DIRTY"

build_target() {
  local target=$1
  local outfile=$2
  local bun_target=$3

  echo "Building $target..."
  if [ -n "$bun_target" ]; then
    eval "bun build src/index.tsx --compile --target=$bun_target --outfile $outfile $DEFINES"
  else
    eval "bun build src/index.tsx --compile --outfile $outfile $DEFINES"
  fi
}

case "${1:-compile}" in
  compile)
    build_target "local" "dist/github-username-migrator"
    ;;
  linux-x64)
    build_target "linux-x64" "dist/github-username-migrator-linux-x64" "bun-linux-x64"
    ;;
  linux-arm64)
    build_target "linux-arm64" "dist/github-username-migrator-linux-arm64" "bun-linux-arm64"
    ;;
  darwin-x64)
    build_target "darwin-x64" "dist/github-username-migrator-darwin-x64" "bun-darwin-x64"
    ;;
  darwin-arm64)
    build_target "darwin-arm64" "dist/github-username-migrator-darwin-arm64" "bun-darwin-arm64"
    ;;
  windows-x64)
    build_target "windows-x64" "dist/github-username-migrator-windows-x64.exe" "bun-windows-x64"
    ;;
  all)
    build_target "linux-x64" "dist/github-username-migrator-linux-x64" "bun-linux-x64"
    build_target "linux-arm64" "dist/github-username-migrator-linux-arm64" "bun-linux-arm64"
    build_target "darwin-x64" "dist/github-username-migrator-darwin-x64" "bun-darwin-x64"
    build_target "darwin-arm64" "dist/github-username-migrator-darwin-arm64" "bun-darwin-arm64"
    build_target "windows-x64" "dist/github-username-migrator-windows-x64.exe" "bun-windows-x64"
    ;;
  *)
    echo "Unknown target: $1"
    echo "Usage: $0 [compile|linux-x64|linux-arm64|darwin-x64|darwin-arm64|windows-x64|all]"
    exit 1
    ;;
esac

echo "Done!"
