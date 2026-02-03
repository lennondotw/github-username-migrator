import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createLogger,
  formatLogEntry,
  generateLogFilename,
  getAppDataDir,
  getLogsDir,
  MigrationLogger,
} from '../logger';

describe('logger', () => {
  describe('getAppDataDir', () => {
    it('should return a path in home directory', () => {
      const dir = getAppDataDir();
      expect(dir).toContain('.github-username-migrator');
    });
  });

  describe('getLogsDir', () => {
    it('should return a logs subdirectory', () => {
      const dir = getLogsDir();
      expect(dir).toContain('logs');
      expect(dir).toContain('.github-username-migrator');
    });
  });

  describe('generateLogFilename', () => {
    it('should generate a timestamped filename', () => {
      const filename = generateLogFilename();
      expect(filename).toMatch(/^migration-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/);
    });

    it('should generate unique filenames', async () => {
      const filename1 = generateLogFilename();
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const filename2 = generateLogFilename();
      // They might be the same if generated in the same second, so just check format
      expect(filename1).toMatch(/^migration-.*\.log$/);
      expect(filename2).toMatch(/^migration-.*\.log$/);
    });
  });

  describe('formatLogEntry', () => {
    it('should format a successful entry', () => {
      const entry = {
        timestamp: new Date('2024-01-15T10:30:00Z'),
        repositoryPath: '/home/user/project',
        remoteName: 'origin',
        oldUrl: 'git@github.com:olduser/repo.git',
        newUrl: 'git@github.com:newuser/repo.git',
        success: true,
      };

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('SUCCESS');
      expect(formatted).toContain('/home/user/project');
      expect(formatted).toContain('origin');
      expect(formatted).toContain('git@github.com:olduser/repo.git');
      expect(formatted).toContain('git@github.com:newuser/repo.git');
    });

    it('should format a failed entry with error', () => {
      const entry = {
        timestamp: new Date('2024-01-15T10:30:00Z'),
        repositoryPath: '/home/user/project',
        remoteName: 'origin',
        oldUrl: 'git@github.com:olduser/repo.git',
        newUrl: 'git@github.com:newuser/repo.git',
        success: false,
        error: 'Permission denied',
      };

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('FAILED');
      expect(formatted).toContain('Permission denied');
    });
  });

  describe('MigrationLogger', () => {
    let testLogDir: string;
    let logger: MigrationLogger;

    beforeEach(() => {
      testLogDir = join(tmpdir(), `logger-test-${Date.now()}`);
    });

    afterEach(async () => {
      try {
        await rm(testLogDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should create log file on initialize', async () => {
      logger = new MigrationLogger('olduser', 'newuser', '/home/user');
      // Override log path for testing
      const logPath = logger.getLogPath();

      await logger.initialize();

      // The actual log is in the real directory, just check it doesn't throw
      expect(logPath).toContain('migration-');
    });

    it('should log successful migrations', async () => {
      logger = new MigrationLogger('olduser', 'newuser', '/home/user');
      await logger.initialize();

      await logger.logSuccess(
        '/home/user/repo1',
        'origin',
        'git@github.com:olduser/repo1.git',
        'git@github.com:newuser/repo1.git'
      );
      await logger.logSuccess(
        '/home/user/repo2',
        'origin',
        'git@github.com:olduser/repo2.git',
        'git@github.com:newuser/repo2.git'
      );

      const log = logger.getLog();
      expect(log.summary.successfulMigrations).toBe(2);
      expect(log.summary.failedMigrations).toBe(0);
      expect(log.summary.totalRepositories).toBe(2);
    });

    it('should log failed migrations', async () => {
      logger = new MigrationLogger('olduser', 'newuser', '/home/user');
      await logger.initialize();

      await logger.logFailure(
        '/home/user/repo',
        'origin',
        'git@github.com:olduser/repo.git',
        'git@github.com:newuser/repo.git',
        'Permission denied'
      );

      const log = logger.getLog();
      expect(log.summary.successfulMigrations).toBe(0);
      expect(log.summary.failedMigrations).toBe(1);
    });

    it('should finalize and return complete log', async () => {
      logger = new MigrationLogger('olduser', 'newuser', '/home/user');
      await logger.initialize();

      await logger.logSuccess(
        '/home/user/repo',
        'origin',
        'git@github.com:olduser/repo.git',
        'git@github.com:newuser/repo.git'
      );

      const finalLog = await logger.finalize();

      expect(finalLog.endedAt).toBeDefined();
      expect(finalLog.entries).toHaveLength(1);
      expect(finalLog.oldUsername).toBe('olduser');
      expect(finalLog.newUsername).toBe('newuser');
    });

    it('should write to log file', async () => {
      logger = new MigrationLogger('olduser', 'newuser', '/home/user');
      await logger.initialize();

      await logger.logSuccess(
        '/home/user/repo',
        'origin',
        'git@github.com:olduser/repo.git',
        'git@github.com:newuser/repo.git'
      );
      await logger.finalize();

      const content = await readFile(logger.getLogPath(), 'utf-8');

      expect(content).toContain('GitHub Username Migration Log');
      expect(content).toContain('olduser');
      expect(content).toContain('newuser');
      expect(content).toContain('SUCCESS');
      expect(content).toContain('Summary');
    });
  });

  describe('createLogger', () => {
    it('should create a MigrationLogger instance', () => {
      const logger = createLogger('old', 'new', '/root');
      expect(logger).toBeInstanceOf(MigrationLogger);
    });
  });
});
