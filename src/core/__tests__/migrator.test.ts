import { afterEach, describe, expect, it } from 'bun:test';
import { rm } from 'node:fs/promises';

import { createTestDirectory, type TestDirectoryResult } from '../../test-utils/fixtures';
import type { MatchedRepository, MigrationProgress } from '../../types';
import { getRemoteUrls } from '../git-remote';
import { getLogsDir } from '../logger';
import { dryRun, getMigrationSummary, migrate } from '../migrator';

/**
 * Get first repo path or throw
 */
function getFirstRepoPath(testDir: TestDirectoryResult): string {
  const path = testDir.repoPaths[0];
  if (!path) throw new Error('No repo path');
  return path;
}

describe('migrator', () => {
  let testDir: TestDirectoryResult | null = null;

  afterEach(async () => {
    if (testDir) {
      await testDir.cleanup();
      testDir = null;
    }
    // Clean up any created log files
    try {
      await rm(getLogsDir(), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('migrate', () => {
    it('should migrate repository remotes', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:olduser/repo.git' } },
      ]);

      const repoPath = getFirstRepoPath(testDir);
      const repositories: MatchedRepository[] = [
        {
          path: repoPath,
          remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
          ],
        },
      ];

      const result = await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
      });

      // Check migration result
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.results[0]?.success).toBe(true);

      // Verify the actual change was made
      const remotes = await getRemoteUrls(repoPath);
      expect(remotes[0]?.url).toBe('git@github.com:newuser/repo.git');

      // Check log
      expect(result.log.summary.successfulMigrations).toBe(1);
      expect(result.log.summary.failedMigrations).toBe(0);
    });

    it('should migrate multiple repositories', async () => {
      testDir = await createTestDirectory([
        { path: 'project-a', remotes: { origin: 'git@github.com:olduser/a.git' } },
        { path: 'project-b', remotes: { origin: 'git@github.com:olduser/b.git' } },
      ]);

      const repositories: MatchedRepository[] = testDir.repoPaths.map((path, i) => ({
        path,
        remotes: [{ name: 'origin', url: `git@github.com:olduser/${i === 0 ? 'a' : 'b'}.git` }],
        matchedRemotes: [
          {
            remote: { name: 'origin', url: `git@github.com:olduser/${i === 0 ? 'a' : 'b'}.git` },
            newUrl: `git@github.com:newuser/${i === 0 ? 'a' : 'b'}.git`,
          },
        ],
      }));

      const result = await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
      });

      expect(result.results).toHaveLength(2);
      expect(result.log.summary.successfulMigrations).toBe(2);
    });

    it('should migrate multiple remotes in one repository', async () => {
      testDir = await createTestDirectory([
        {
          path: 'project',
          remotes: {
            origin: 'git@github.com:olduser/repo.git',
            work: 'https://github.com/olduser/work.git',
          },
        },
      ]);

      const repoPath = getFirstRepoPath(testDir);
      const repositories: MatchedRepository[] = [
        {
          path: repoPath,
          remotes: [
            { name: 'origin', url: 'git@github.com:olduser/repo.git' },
            { name: 'work', url: 'https://github.com/olduser/work.git' },
          ],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
            {
              remote: { name: 'work', url: 'https://github.com/olduser/work.git' },
              newUrl: 'https://github.com/newuser/work.git',
            },
          ],
        },
      ];

      const result = await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
      });

      expect(result.results[0]?.results).toHaveLength(2);
      expect(result.log.summary.successfulMigrations).toBe(2);

      // Verify both remotes were updated
      const remotes = await getRemoteUrls(repoPath);
      const originRemote = remotes.find((r) => r.name === 'origin');
      const workRemote = remotes.find((r) => r.name === 'work');
      expect(originRemote?.url).toBe('git@github.com:newuser/repo.git');
      expect(workRemote?.url).toBe('https://github.com/newuser/work.git');
    });

    it('should call onProgress callback', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:olduser/repo.git' } },
      ]);

      const repoPath = getFirstRepoPath(testDir);
      const repositories: MatchedRepository[] = [
        {
          path: repoPath,
          remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
          ],
        },
      ];

      const progressUpdates: MigrationProgress[] = [];

      await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      // Should have initial (0) and final (1) progress
      expect(progressUpdates[0]?.completed).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1]?.completed).toBe(1);
    });

    it('should support abort signal', async () => {
      testDir = await createTestDirectory([
        { path: 'project-1', remotes: { origin: 'git@github.com:olduser/a.git' } },
        { path: 'project-2', remotes: { origin: 'git@github.com:olduser/b.git' } },
        { path: 'project-3', remotes: { origin: 'git@github.com:olduser/c.git' } },
      ]);

      const repositories: MatchedRepository[] = testDir.repoPaths.map((path, i) => ({
        path,
        remotes: [{ name: 'origin', url: `git@github.com:olduser/${['a', 'b', 'c'][i]}.git` }],
        matchedRemotes: [
          {
            remote: { name: 'origin', url: `git@github.com:olduser/${['a', 'b', 'c'][i]}.git` },
            newUrl: `git@github.com:newuser/${['a', 'b', 'c'][i]}.git`,
          },
        ],
      }));

      const controller = new AbortController();
      // Abort immediately
      controller.abort();

      const result = await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
        signal: controller.signal,
      });

      // Should have stopped early
      expect(result.results.length).toBeLessThanOrEqual(3);
    });

    it('should create log file', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:olduser/repo.git' } },
      ]);

      const repoPath = getFirstRepoPath(testDir);
      const repositories: MatchedRepository[] = [
        {
          path: repoPath,
          remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
          ],
        },
      ];

      const result = await migrate({
        repositories,
        oldUsername: 'olduser',
        newUsername: 'newuser',
        scanRoot: testDir.basePath,
      });

      expect(result.logPath).toContain('migration-');
      expect(result.logPath).toContain('.log');
    });
  });

  describe('dryRun', () => {
    it('should return valid for accessible repositories', async () => {
      testDir = await createTestDirectory([
        { path: 'project', remotes: { origin: 'git@github.com:olduser/repo.git' } },
      ]);

      const repoPath = getFirstRepoPath(testDir);
      const repositories: MatchedRepository[] = [
        {
          path: repoPath,
          remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
          ],
        },
      ];

      const result = await dryRun(repositories);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should report issues for inaccessible repositories', async () => {
      const repositories: MatchedRepository[] = [
        {
          path: '/non/existent/path',
          remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
              newUrl: 'git@github.com:newuser/repo.git',
            },
          ],
        },
      ];

      const result = await dryRun(repositories);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('not accessible');
    });
  });

  describe('getMigrationSummary', () => {
    it('should return correct summary', () => {
      const repositories: MatchedRepository[] = [
        {
          path: '/path/to/repo1',
          remotes: [{ name: 'origin', url: 'git@github.com:old/repo1.git' }],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:old/repo1.git' },
              newUrl: 'git@github.com:new/repo1.git',
            },
          ],
        },
        {
          path: '/path/to/repo2',
          remotes: [
            { name: 'origin', url: 'git@github.com:old/repo2.git' },
            { name: 'work', url: 'git@github.com:old/work.git' },
          ],
          matchedRemotes: [
            {
              remote: { name: 'origin', url: 'git@github.com:old/repo2.git' },
              newUrl: 'git@github.com:new/repo2.git',
            },
            {
              remote: { name: 'work', url: 'git@github.com:old/work.git' },
              newUrl: 'git@github.com:new/work.git',
            },
          ],
        },
      ];

      const summary = getMigrationSummary(repositories);

      expect(summary.totalRepositories).toBe(2);
      expect(summary.totalRemotes).toBe(3);
      expect(summary.repositories).toHaveLength(2);
      expect(summary.repositories[1]?.remotes).toHaveLength(2);
    });
  });
});
