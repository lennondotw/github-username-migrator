import { describe, expect, it } from 'bun:test';

import { IGNORE_PATTERNS, shouldIgnorePath, shouldIgnoreSegment } from '../constants/ignore-patterns';

describe('ignore-patterns', () => {
  describe('IGNORE_PATTERNS', () => {
    it('should be a non-empty array', () => {
      expect(IGNORE_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should contain common patterns', () => {
      expect(IGNORE_PATTERNS).toContain('node_modules');
      expect(IGNORE_PATTERNS).toContain('.cache');
      expect(IGNORE_PATTERNS).toContain('dist');
      expect(IGNORE_PATTERNS).toContain('.Trash');
    });
  });

  describe('shouldIgnoreSegment', () => {
    it('should ignore exact matches', () => {
      expect(shouldIgnoreSegment('node_modules')).toBe(true);
      expect(shouldIgnoreSegment('.cache')).toBe(true);
      expect(shouldIgnoreSegment('dist')).toBe(true);
      expect(shouldIgnoreSegment('.Trash')).toBe(true);
    });

    it('should ignore partial matches', () => {
      // These contain ignore patterns as substrings
      expect(shouldIgnoreSegment('Library/Caches')).toBe(true);
      expect(shouldIgnoreSegment('.git/objects')).toBe(true);
    });

    it('should not ignore unrelated directories', () => {
      expect(shouldIgnoreSegment('src')).toBe(false);
      expect(shouldIgnoreSegment('projects')).toBe(false);
      expect(shouldIgnoreSegment('my-app')).toBe(false);
      expect(shouldIgnoreSegment('Workspace')).toBe(false);
    });

    it('should not ignore .git itself (only subdirectories)', () => {
      expect(shouldIgnoreSegment('.git')).toBe(false);
    });
  });

  describe('shouldIgnorePath', () => {
    it('should ignore paths containing node_modules', () => {
      expect(shouldIgnorePath('/home/user/project/node_modules/package')).toBe(true);
      expect(shouldIgnorePath('C:\\Users\\user\\project\\node_modules\\package')).toBe(true);
    });

    it('should ignore paths containing .cache', () => {
      expect(shouldIgnorePath('/home/user/.cache/something')).toBe(true);
    });

    it('should ignore macOS Library paths', () => {
      expect(shouldIgnorePath('/Users/user/Library/Caches/com.apple.something')).toBe(true);
      expect(shouldIgnorePath('/Users/user/Library/Application Support/App')).toBe(true);
    });

    it('should ignore .Trash paths', () => {
      expect(shouldIgnorePath('/Users/user/.Trash/deleted-repo')).toBe(true);
    });

    it('should ignore git object paths', () => {
      expect(shouldIgnorePath('/home/user/repo/.git/objects/pack')).toBe(true);
      expect(shouldIgnorePath('/home/user/repo/.git/lfs/objects')).toBe(true);
    });

    it('should not ignore normal project paths', () => {
      expect(shouldIgnorePath('/home/user/projects/my-app/src')).toBe(false);
      expect(shouldIgnorePath('/Users/user/Workspace/repo/.git/config')).toBe(false);
    });

    it('should handle Windows paths', () => {
      expect(shouldIgnorePath('C:\\Users\\user\\AppData\\Local\\Temp\\file')).toBe(true);
      expect(shouldIgnorePath('D:\\Projects\\my-app\\src')).toBe(false);
    });
  });
});
