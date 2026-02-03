import { describe, expect, it } from 'bun:test';

import type {
  AppState,
  GitRemote,
  MatchedRepository,
  MigrationLog,
  MigrationLogEntry,
  MigrationProgress,
  MigrationResult,
  Repository,
  ScanError,
  ScanProgress,
  ScanResult,
} from '../types';

describe('types', () => {
  it('should allow creating a GitRemote', () => {
    const remote: GitRemote = {
      name: 'origin',
      url: 'git@github.com:user/repo.git',
    };
    expect(remote.name).toBe('origin');
    expect(remote.url).toBe('git@github.com:user/repo.git');
  });

  it('should allow creating a Repository', () => {
    const repo: Repository = {
      path: '/home/user/projects/my-repo',
      remotes: [{ name: 'origin', url: 'git@github.com:user/repo.git' }],
    };
    expect(repo.path).toBe('/home/user/projects/my-repo');
    expect(repo.remotes).toHaveLength(1);
  });

  it('should allow creating a MatchedRepository', () => {
    const matched: MatchedRepository = {
      path: '/home/user/projects/my-repo',
      remotes: [{ name: 'origin', url: 'git@github.com:olduser/repo.git' }],
      matchedRemotes: [
        {
          remote: { name: 'origin', url: 'git@github.com:olduser/repo.git' },
          newUrl: 'git@github.com:newuser/repo.git',
        },
      ],
    };
    expect(matched.matchedRemotes).toHaveLength(1);
    expect(matched.matchedRemotes[0]?.newUrl).toBe('git@github.com:newuser/repo.git');
  });

  it('should allow creating a ScanResult', () => {
    const result: ScanResult = {
      directoriesScanned: 1000,
      repositoriesFound: 50,
      matchedRepositories: [],
      elapsedMs: 5000,
      errors: [],
    };
    expect(result.directoriesScanned).toBe(1000);
  });

  it('should allow creating a ScanError', () => {
    const error: ScanError = {
      path: '/some/path',
      message: 'Permission denied',
    };
    expect(error.message).toBe('Permission denied');
  });

  it('should allow creating a ScanProgress', () => {
    const progress: ScanProgress = {
      currentPath: '/home/user/projects',
      directoriesScanned: 100,
      repositoriesFound: 5,
      matchedCount: 2,
    };
    expect(progress.matchedCount).toBe(2);
  });

  it('should allow creating a MigrationLogEntry', () => {
    const entry: MigrationLogEntry = {
      timestamp: new Date(),
      repositoryPath: '/home/user/repo',
      remoteName: 'origin',
      oldUrl: 'git@github.com:old/repo.git',
      newUrl: 'git@github.com:new/repo.git',
      success: true,
    };
    expect(entry.success).toBe(true);
  });

  it('should allow creating a MigrationResult', () => {
    const result: MigrationResult = {
      repository: {
        path: '/home/user/repo',
        remotes: [{ name: 'origin', url: 'git@github.com:old/repo.git' }],
        matchedRemotes: [
          {
            remote: { name: 'origin', url: 'git@github.com:old/repo.git' },
            newUrl: 'git@github.com:new/repo.git',
          },
        ],
      },
      results: [
        {
          remoteName: 'origin',
          oldUrl: 'git@github.com:old/repo.git',
          newUrl: 'git@github.com:new/repo.git',
          success: true,
        },
      ],
    };
    expect(result.results).toHaveLength(1);
  });

  it('should allow creating a MigrationLog', () => {
    const log: MigrationLog = {
      startedAt: new Date(),
      oldUsername: 'olduser',
      newUsername: 'newuser',
      scanRoot: '/home/user',
      entries: [],
      summary: {
        totalRepositories: 10,
        successfulMigrations: 9,
        failedMigrations: 1,
      },
    };
    expect(log.summary.totalRepositories).toBe(10);
  });

  it('should allow creating AppState for each phase', () => {
    const welcome: AppState = { phase: 'welcome' };
    expect(welcome.phase).toBe('welcome');

    const input: AppState = { phase: 'input', oldUsername: '', newUsername: '' };
    expect(input.phase).toBe('input');

    const scanning: AppState = {
      phase: 'scanning',
      oldUsername: 'old',
      newUsername: 'new',
      progress: { currentPath: '', directoriesScanned: 0, repositoriesFound: 0, matchedCount: 0 },
    };
    expect(scanning.phase).toBe('scanning');
  });

  it('should allow creating a MigrationProgress', () => {
    const progress: MigrationProgress = {
      total: 10,
      completed: 5,
      currentRepository: '/home/user/repo',
      results: [],
    };
    expect(progress.completed).toBe(5);
  });
});
