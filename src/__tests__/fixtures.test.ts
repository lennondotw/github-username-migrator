import { afterEach, describe, expect, it } from 'bun:test';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  createBareRepo,
  createCorruptedRepo,
  createTempRepo,
  createTestDirectory,
  type TempRepoResult,
  type TestDirectoryResult,
} from '../test-utils/fixtures';

/**
 * Helper to check if a path exists (access returns void on success)
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('fixtures', () => {
  describe('createTempRepo', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should create a temporary repository', async () => {
      repo = await createTempRepo();
      expect(await pathExists(repo.path)).toBe(true);
      expect(await pathExists(repo.gitDir)).toBe(true);
    });

    it('should create a .git/config file', async () => {
      repo = await createTempRepo();
      const configPath = join(repo.gitDir, 'config');
      expect(await pathExists(configPath)).toBe(true);
    });

    it('should create a .git/HEAD file', async () => {
      repo = await createTempRepo();
      const headPath = join(repo.gitDir, 'HEAD');
      const content = await readFile(headPath, 'utf-8');
      expect(content).toBe('ref: refs/heads/main\n');
    });

    it('should create remotes in config', async () => {
      repo = await createTempRepo({
        remotes: {
          origin: 'git@github.com:user/repo.git',
          upstream: 'https://github.com/org/repo.git',
        },
      });

      const configPath = join(repo.gitDir, 'config');
      const content = await readFile(configPath, 'utf-8');

      expect(content).toContain('[remote "origin"]');
      expect(content).toContain('url = git@github.com:user/repo.git');
      expect(content).toContain('[remote "upstream"]');
      expect(content).toContain('url = https://github.com/org/repo.git');
    });

    it('should create nested directory structure when nested=true', async () => {
      repo = await createTempRepo({ nested: true });
      expect(repo.path).toContain('projects');
      expect(repo.path).toContain('my-repo');
    });

    it('should use custom subdir when provided', async () => {
      repo = await createTempRepo({ subdir: 'custom/path/repo' });
      expect(repo.path).toContain('custom');
      expect(repo.path).toContain('repo');
    });

    it('should cleanup properly', async () => {
      repo = await createTempRepo();
      const path = repo.path;
      await repo.cleanup();
      repo = null;
      expect(await pathExists(path)).toBe(false);
    });
  });

  describe('createTestDirectory', () => {
    let testDir: TestDirectoryResult | null = null;

    afterEach(async () => {
      if (testDir) {
        await testDir.cleanup();
        testDir = null;
      }
    });

    it('should create multiple repositories', async () => {
      testDir = await createTestDirectory([
        { path: 'repo-a', remotes: { origin: 'git@github.com:user/a.git' } },
        { path: 'repo-b', remotes: { origin: 'git@github.com:user/b.git' } },
        { path: 'nested/repo-c', remotes: { origin: 'git@github.com:user/c.git' } },
      ]);

      expect(testDir.repoPaths).toHaveLength(3);

      for (const repoPath of testDir.repoPaths) {
        expect(await pathExists(repoPath)).toBe(true);
        expect(await pathExists(join(repoPath, '.git', 'config'))).toBe(true);
      }
    });

    it('should create repos with correct remotes', async () => {
      testDir = await createTestDirectory([{ path: 'repo-x', remotes: { origin: 'git@github.com:testuser/x.git' } }]);

      const repoPath = testDir.repoPaths[0];
      if (!repoPath) throw new Error('No repo path');
      const configPath = join(repoPath, '.git', 'config');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('url = git@github.com:testuser/x.git');
    });
  });

  describe('createCorruptedRepo', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should create a repo with invalid config', async () => {
      repo = await createCorruptedRepo();
      const configPath = join(repo.gitDir, 'config');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('this is not a valid git config');
    });
  });

  describe('createBareRepo', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should create a bare repository', async () => {
      repo = await createBareRepo({ origin: 'git@github.com:user/repo.git' });

      // In bare repos, the git dir is the repo path itself
      expect(repo.path).toBe(repo.gitDir);

      const configPath = join(repo.path, 'config');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('url = git@github.com:user/repo.git');
    });
  });
});
