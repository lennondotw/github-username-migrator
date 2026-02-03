import { afterEach, describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createTempRepo, type TempRepoResult } from '../../test-utils/fixtures';
import {
  extractGitHubUsername,
  findMatchingRemotes,
  getRemoteUrls,
  isGitHubUrl,
  parseGitConfig,
  replaceGitHubUsername,
  setRemoteUrl,
  updateRemoteInConfig,
  urlContainsUsername,
} from '../git-remote';

// Read static fixtures
const fixturesDir = join(import.meta.dir, 'fixtures');

describe('git-remote', () => {
  describe('parseGitConfig', () => {
    it('should parse SSH remote', async () => {
      const content = await readFile(join(fixturesDir, 'config-ssh.txt'), 'utf-8');
      const remotes = parseGitConfig(content);

      expect(remotes).toHaveLength(1);
      expect(remotes[0]?.name).toBe('origin');
      expect(remotes[0]?.url).toBe('git@github.com:reekystive/my-project.git');
    });

    it('should parse HTTPS remote', async () => {
      const content = await readFile(join(fixturesDir, 'config-https.txt'), 'utf-8');
      const remotes = parseGitConfig(content);

      expect(remotes).toHaveLength(1);
      expect(remotes[0]?.name).toBe('origin');
      expect(remotes[0]?.url).toBe('https://github.com/reekystive/another-project.git');
    });

    it('should parse multiple remotes', async () => {
      const content = await readFile(join(fixturesDir, 'config-multi.txt'), 'utf-8');
      const remotes = parseGitConfig(content);

      expect(remotes).toHaveLength(3);
      expect(remotes.map((r) => r.name)).toEqual(['origin', 'upstream', 'work']);
    });

    it('should return empty array for config without remotes', async () => {
      const content = await readFile(join(fixturesDir, 'config-empty.txt'), 'utf-8');
      const remotes = parseGitConfig(content);

      expect(remotes).toHaveLength(0);
    });

    it('should handle malformed config gracefully', () => {
      const content = 'this is not a valid config\n[invalid';
      const remotes = parseGitConfig(content);

      expect(remotes).toHaveLength(0);
    });
  });

  describe('isGitHubUrl', () => {
    it('should return true for SSH URLs', () => {
      expect(isGitHubUrl('git@github.com:user/repo.git')).toBe(true);
      expect(isGitHubUrl('git@github.com:user/repo')).toBe(true);
      expect(isGitHubUrl('git@github.com:org-name/repo-name.git')).toBe(true);
    });

    it('should return true for HTTPS URLs', () => {
      expect(isGitHubUrl('https://github.com/user/repo.git')).toBe(true);
      expect(isGitHubUrl('https://github.com/user/repo')).toBe(true);
      expect(isGitHubUrl('https://github.com/org-name/repo-name.git')).toBe(true);
    });

    it('should return false for non-GitHub URLs', () => {
      expect(isGitHubUrl('git@gitlab.com:user/repo.git')).toBe(false);
      expect(isGitHubUrl('https://gitlab.com/user/repo.git')).toBe(false);
      expect(isGitHubUrl('git@bitbucket.org:user/repo.git')).toBe(false);
      expect(isGitHubUrl('/path/to/local/repo')).toBe(false);
    });
  });

  describe('extractGitHubUsername', () => {
    it('should extract username from SSH URL', () => {
      expect(extractGitHubUsername('git@github.com:myuser/repo.git')).toBe('myuser');
      expect(extractGitHubUsername('git@github.com:org-name/repo.git')).toBe('org-name');
    });

    it('should extract username from HTTPS URL', () => {
      expect(extractGitHubUsername('https://github.com/myuser/repo.git')).toBe('myuser');
      expect(extractGitHubUsername('https://github.com/org-name/repo.git')).toBe('org-name');
    });

    it('should return null for non-GitHub URLs', () => {
      expect(extractGitHubUsername('git@gitlab.com:user/repo.git')).toBeNull();
      expect(extractGitHubUsername('https://gitlab.com/user/repo.git')).toBeNull();
    });
  });

  describe('replaceGitHubUsername', () => {
    it('should replace username in SSH URL', () => {
      const result = replaceGitHubUsername('git@github.com:olduser/repo.git', 'olduser', 'newuser');
      expect(result).toBe('git@github.com:newuser/repo.git');
    });

    it('should replace username in HTTPS URL', () => {
      const result = replaceGitHubUsername('https://github.com/olduser/repo.git', 'olduser', 'newuser');
      expect(result).toBe('https://github.com/newuser/repo.git');
    });

    it('should be case-insensitive when matching username', () => {
      const result = replaceGitHubUsername('git@github.com:OldUser/repo.git', 'olduser', 'newuser');
      expect(result).toBe('git@github.com:newuser/repo.git');
    });

    it('should not modify URL if username does not match', () => {
      const url = 'git@github.com:other/repo.git';
      const result = replaceGitHubUsername(url, 'olduser', 'newuser');
      expect(result).toBe(url);
    });

    it('should handle URLs without .git suffix', () => {
      const result = replaceGitHubUsername('git@github.com:olduser/repo', 'olduser', 'newuser');
      expect(result).toBe('git@github.com:newuser/repo');
    });
  });

  describe('urlContainsUsername', () => {
    it('should return true when username matches', () => {
      expect(urlContainsUsername('git@github.com:myuser/repo.git', 'myuser')).toBe(true);
      expect(urlContainsUsername('https://github.com/myuser/repo.git', 'myuser')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(urlContainsUsername('git@github.com:MyUser/repo.git', 'myuser')).toBe(true);
      expect(urlContainsUsername('git@github.com:myuser/repo.git', 'MYUSER')).toBe(true);
    });

    it('should return false when username does not match', () => {
      expect(urlContainsUsername('git@github.com:other/repo.git', 'myuser')).toBe(false);
    });
  });

  describe('updateRemoteInConfig', () => {
    it('should update the URL for a specific remote', async () => {
      const content = await readFile(join(fixturesDir, 'config-ssh.txt'), 'utf-8');
      const updated = updateRemoteInConfig(content, 'origin', 'git@github.com:newuser/my-project.git');

      expect(updated).toContain('url = git@github.com:newuser/my-project.git');
      expect(updated).not.toContain('url = git@github.com:reekystive/my-project.git');
    });

    it('should only update the specified remote', async () => {
      const content = await readFile(join(fixturesDir, 'config-multi.txt'), 'utf-8');
      const updated = updateRemoteInConfig(content, 'origin', 'git@github.com:newuser/forked-project.git');

      // Origin should be updated
      expect(updated).toContain('url = git@github.com:newuser/forked-project.git');
      // Upstream should remain unchanged
      expect(updated).toContain('url = https://github.com/original-author/forked-project.git');
      // Work should remain unchanged
      expect(updated).toContain('url = git@github.com:reekystive/work-fork.git');
    });

    it('should preserve indentation', async () => {
      const content = await readFile(join(fixturesDir, 'config-ssh.txt'), 'utf-8');
      const updated = updateRemoteInConfig(content, 'origin', 'git@github.com:newuser/repo.git');

      // The original has tab indentation, it should be preserved
      expect(updated).toContain('\turl = git@github.com:newuser/repo.git');
    });
  });

  describe('getRemoteUrls', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should read remotes from a repository', async () => {
      repo = await createTempRepo({
        remotes: {
          origin: 'git@github.com:testuser/repo.git',
          upstream: 'https://github.com/org/repo.git',
        },
      });

      const remotes = await getRemoteUrls(repo.path);

      expect(remotes).toHaveLength(2);
      expect(remotes.find((r) => r.name === 'origin')?.url).toBe('git@github.com:testuser/repo.git');
      expect(remotes.find((r) => r.name === 'upstream')?.url).toBe('https://github.com/org/repo.git');
    });

    it('should throw for non-existent repository', async () => {
      let threw = false;
      try {
        await getRemoteUrls('/non/existent/path');
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });

  describe('setRemoteUrl', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should update remote URL in repository', async () => {
      repo = await createTempRepo({
        remotes: { origin: 'git@github.com:olduser/repo.git' },
      });

      await setRemoteUrl(repo.path, 'origin', 'git@github.com:newuser/repo.git');

      const remotes = await getRemoteUrls(repo.path);
      expect(remotes[0]?.url).toBe('git@github.com:newuser/repo.git');
    });
  });

  describe('findMatchingRemotes', () => {
    let repo: TempRepoResult | null = null;

    afterEach(async () => {
      if (repo) {
        await repo.cleanup();
        repo = null;
      }
    });

    it('should find remotes matching the username', async () => {
      repo = await createTempRepo({
        remotes: {
          origin: 'git@github.com:targetuser/repo.git',
          upstream: 'https://github.com/other/repo.git',
        },
      });

      const matches = await findMatchingRemotes(repo.path, 'targetuser', 'newuser');

      expect(matches).toHaveLength(1);
      expect(matches[0]?.remote.name).toBe('origin');
      expect(matches[0]?.newUrl).toBe('git@github.com:newuser/repo.git');
    });

    it('should find multiple matching remotes', async () => {
      repo = await createTempRepo({
        remotes: {
          origin: 'git@github.com:targetuser/repo1.git',
          work: 'https://github.com/targetuser/repo2.git',
          upstream: 'https://github.com/other/repo.git',
        },
      });

      const matches = await findMatchingRemotes(repo.path, 'targetuser', 'newuser');

      expect(matches).toHaveLength(2);
      expect(matches.map((m) => m.remote.name).sort()).toEqual(['origin', 'work']);
    });

    it('should return empty array when no matches', async () => {
      repo = await createTempRepo({
        remotes: { origin: 'git@github.com:other/repo.git' },
      });

      const matches = await findMatchingRemotes(repo.path, 'targetuser', 'newuser');

      expect(matches).toHaveLength(0);
    });
  });
});
