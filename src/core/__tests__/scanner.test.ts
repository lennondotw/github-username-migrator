import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createTestDirectory, type TestDirectoryResult } from '../../test-utils/fixtures';
import { countRepositories, scanForRepositories } from '../scanner';

describe('scanner', () => {
  let testDir: TestDirectoryResult | null = null;

  afterEach(async () => {
    if (testDir) {
      await testDir.cleanup();
      testDir = null;
    }
  });

  describe('scanForRepositories', () => {
    it('should find repositories with matching username', async () => {
      testDir = await createTestDirectory([
        { path: 'project-a', remotes: { origin: 'git@github.com:targetuser/a.git' } },
        { path: 'project-b', remotes: { origin: 'git@github.com:targetuser/b.git' } },
        { path: 'project-c', remotes: { origin: 'git@github.com:other/c.git' } },
      ]);

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
      });

      expect(result.repositoriesFound).toBe(3);
      expect(result.matchedRepositories).toHaveLength(2);
      expect(result.matchedRepositories.map((r) => r.path).sort()).toEqual(
        [join(testDir.basePath, 'project-a'), join(testDir.basePath, 'project-b')].sort()
      );
    });

    it('should find repositories in nested directories', async () => {
      testDir = await createTestDirectory([
        { path: 'level1/level2/project', remotes: { origin: 'git@github.com:targetuser/nested.git' } },
      ]);

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
      });

      expect(result.matchedRepositories).toHaveLength(1);
      expect(result.matchedRepositories[0]?.path).toBe(join(testDir.basePath, 'level1/level2/project'));
    });

    it('should return empty array when no matches found', async () => {
      testDir = await createTestDirectory([{ path: 'project', remotes: { origin: 'git@github.com:other/repo.git' } }]);

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
      });

      expect(result.repositoriesFound).toBe(1);
      expect(result.matchedRepositories).toHaveLength(0);
    });

    it('should skip ignored directories', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:targetuser/repo.git' } },
      ]);

      // Create a node_modules directory with a fake repo inside
      const nodeModulesPath = join(testDir.basePath, 'node_modules', 'some-package');
      await mkdir(join(nodeModulesPath, '.git'), { recursive: true });
      await writeFile(
        join(nodeModulesPath, '.git', 'config'),
        '[remote "origin"]\n\turl = git@github.com:targetuser/ignored.git\n'
      );

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
      });

      // Should only find the main project, not the one in node_modules
      expect(result.matchedRepositories).toHaveLength(1);
      expect(result.matchedRepositories[0]?.path).toBe(join(testDir.basePath, 'project'));
    });

    it('should call onProgress callback', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:targetuser/repo.git' } },
      ]);

      const progressCalls: number[] = [];

      await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
        onProgress: (progress) => {
          progressCalls.push(progress.repositoriesFound);
        },
      });

      // At least one progress update should have been made
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should respect maxDepth option', async () => {
      testDir = await createTestDirectory([
        { path: 'level1/level2/level3/level4/project', remotes: { origin: 'git@github.com:targetuser/deep.git' } },
      ]);

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
        maxDepth: 2,
      });

      // Should not find the deeply nested repo
      expect(result.matchedRepositories).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const result = await scanForRepositories({
        rootDir: '/non/existent/path',
        oldUsername: 'targetuser',
        newUsername: 'newuser',
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.matchedRepositories).toHaveLength(0);
    });

    it('should include new URL in matched remotes', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:olduser/repo.git' } },
      ]);

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'olduser',
        newUsername: 'newuser',
      });

      expect(result.matchedRepositories).toHaveLength(1);
      expect(result.matchedRepositories[0]?.matchedRemotes[0]?.newUrl).toBe('git@github.com:newuser/repo.git');
    });

    it('should support abort signal', async () => {
      testDir = await createTestDirectory([
        { path: 'project-1', remotes: { origin: 'git@github.com:targetuser/a.git' } },
        { path: 'project-2', remotes: { origin: 'git@github.com:targetuser/b.git' } },
        { path: 'project-3', remotes: { origin: 'git@github.com:targetuser/c.git' } },
      ]);

      const controller = new AbortController();
      // Abort immediately
      controller.abort();

      const result = await scanForRepositories({
        rootDir: testDir.basePath,
        oldUsername: 'targetuser',
        newUsername: 'newuser',
        signal: controller.signal,
      });

      // Should stop early due to abort
      expect(result.matchedRepositories.length).toBeLessThanOrEqual(3);
    });
  });

  describe('countRepositories', () => {
    it('should count all repositories', async () => {
      testDir = await createTestDirectory([
        { path: 'project-a', remotes: { origin: 'git@github.com:user/a.git' } },
        { path: 'project-b', remotes: { origin: 'git@github.com:user/b.git' } },
        { path: 'nested/project-c', remotes: { origin: 'git@github.com:user/c.git' } },
      ]);

      const count = await countRepositories(testDir.basePath);

      expect(count).toBe(3);
    });
  });
});
