/**
 * Directory patterns to ignore during scanning.
 * These are common directories that either:
 * - Contain cached/downloaded content (not user's own repositories)
 * - Are known to be very large and slow to scan
 * - Contain system/application data
 */
export const IGNORE_PATTERNS: readonly string[] = [
  // Package manager caches and dependencies
  'node_modules',
  '.pnpm-store',
  '.npm',
  '.yarn',
  '.bun',
  'vendor', // PHP, Go
  '.cargo',
  '.rustup',
  'go/pkg',
  '.gradle',
  '.m2', // Maven
  '.ivy2',
  '.sbt',
  'Pods', // CocoaPods
  '.pub-cache', // Dart/Flutter
  '.nuget',

  // Python
  '.venv',
  'venv',
  '__pycache__',
  '.conda',
  '.virtualenvs',

  // Build outputs
  'dist',
  'build',
  'out',
  'target',
  '.next',
  '.nuxt',
  '.output',

  // IDE and editor
  '.idea',
  '.vs',
  '.fleet',

  // System caches (macOS)
  'Library/Caches',
  'Library/Application Support',
  'Library/Developer',
  'Library/Containers',
  'Library/Group Containers',
  '.Trash',

  // System caches (Linux)
  '.cache',
  '.local/share/Trash',
  'snap',

  // System caches (Windows)
  'AppData/Local/Temp',
  'AppData/Local/npm-cache',
  'AppData/Roaming/npm-cache',

  // Git internals (we only need .git/config, not objects)
  '.git/objects',
  '.git/lfs',

  // Version control (other than git)
  '.svn',
  '.hg',

  // Virtual machines and containers
  '.docker',
  '.vagrant',
  'VirtualBox VMs',

  // Cloud storage
  'Dropbox',
  'Google Drive',
  'OneDrive',
  'iCloud Drive',

  // Misc
  'Downloads',
  '.Spotlight-V100',
  '.fseventsd',
  '.DocumentRevisions-V100',
  '.TemporaryItems',
] as const;

/**
 * Check if a path segment matches any ignore pattern.
 * This is a simple substring match for performance.
 *
 * @param segment - A single path segment (directory name)
 * @returns true if the segment should be ignored
 */
export function shouldIgnoreSegment(segment: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => segment === pattern || segment.includes(pattern));
}

/**
 * Check if a full path contains any ignored directory.
 * Handles multi-segment patterns like "Library/Caches" or ".git/objects".
 *
 * @param fullPath - The full path to check
 * @returns true if the path contains an ignored directory
 */
export function shouldIgnorePath(fullPath: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = fullPath.replace(/\\/g, '/');

  // Check for multi-segment patterns (e.g., "Library/Caches", ".git/objects")
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes('/') && normalizedPath.includes(pattern)) {
      return true;
    }
  }

  // Check individual segments
  const segments = normalizedPath.split('/');
  return segments.some(shouldIgnoreSegment);
}
