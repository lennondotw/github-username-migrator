/**
 * Main Application Component
 *
 * Orchestrates the entire migration flow through different phases.
 */

import { Box, Static, Text, useApp, useInput } from 'ink';
import { homedir } from 'node:os';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Confirmation,
  DryRunSummary,
  MigrationProgress,
  RepoList,
  ResultSummary,
  ScanProgress,
  UsernameInput,
  Welcome,
} from './components';
import { migrate } from './core/migrator';
import { scanForRepositories } from './core/scanner';
import type {
  MatchedRepository,
  MigrationProgress as MigrationProgressType,
  ScanProgress as ScanProgressType,
} from './types';

/** Represents a completed step in the workflow */
interface CompletedStep {
  id: string;
  content: React.ReactNode;
}

type AppPhase =
  | 'welcome'
  | 'input'
  | 'scanning'
  | 'review'
  | 'migrating'
  | 'complete'
  | 'cancelled'
  | 'no-matches'
  | 'dry-run-complete';

/** Custom pattern for matching and replacing remote URLs */
export interface CustomPattern {
  /** Regex pattern to match remote URLs */
  from: string;
  /** Replacement string (supports $1, $2, etc. for capture groups) */
  to: string;
}

interface AppProps {
  /** Override the scan root directory (default: home directory) */
  scanRoot?: string;
  /** If true, only show what would be changed without applying (default: true) */
  dryRun?: boolean;
  /** Glob patterns to exclude directories from scanning */
  excludePatterns?: string[];
  /** Custom regex pattern for matching/replacing URLs (advanced) */
  customPattern?: CustomPattern;
}

export const App: React.FC<AppProps> = ({ scanRoot, dryRun = true, excludePatterns = [], customPattern }) => {
  const { exit } = useApp();
  const [phase, setPhase] = useState<AppPhase>('welcome');
  const [oldUsername, setOldUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [scanProgress, setScanProgress] = useState<ScanProgressType>({
    currentPath: '',
    directoriesScanned: 0,
    skippedDirectories: 0,
    repositoriesFound: 0,
    matchedCount: 0,
  });
  const [matchedRepos, setMatchedRepos] = useState<MatchedRepository[]>([]);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgressType>({
    total: 0,
    completed: 0,
    results: [],
  });
  const [logPath, setLogPath] = useState<string | undefined>();
  const [completedSteps, setCompletedSteps] = useState<CompletedStep[]>([]);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add a completed step to the history
  const addCompletedStep = useCallback((id: string, content: React.ReactNode) => {
    setCompletedSteps((prev) => [...prev, { id, content }]);
  }, []);

  // Handle welcome screen
  useInput(
    (input, key) => {
      if (phase === 'welcome' && key.return) {
        setPhase('input');
      }
      if (phase === 'no-matches' && (key.return || input === 'q')) {
        exit();
      }
      if (phase === 'complete' || phase === 'cancelled' || phase === 'dry-run-complete') {
        exit();
      }
    },
    {
      isActive:
        phase === 'welcome' ||
        phase === 'no-matches' ||
        phase === 'complete' ||
        phase === 'cancelled' ||
        phase === 'dry-run-complete',
    }
  );

  // Handle username submission
  const handleUsernameSubmit = useCallback(
    (oldUser: string, newUser: string) => {
      setOldUsername(oldUser);
      setNewUsername(newUser);
      addCompletedStep(
        'usernames',
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> Old username: <Text color="red">{oldUser}</Text>
          </Text>
          <Text>
            <Text color="green">✓</Text> New username: <Text color="green">{newUser}</Text>
          </Text>
        </Box>
      );
      setPhase('scanning');
    },
    [addCompletedStep]
  );

  // Start scanning when phase changes to scanning
  useEffect(() => {
    if (phase !== 'scanning') return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const runScan = async () => {
      try {
        const root = scanRoot ?? homedir();
        const result = await scanForRepositories(root, oldUsername, newUsername, {
          signal: controller.signal,
          excludePatterns,
          customPattern,
          onProgress: (progress: ScanProgressType) => {
            setScanProgress(progress);
          },
        });

        if (controller.signal.aborted) return;

        setMatchedRepos(result.matchedRepositories);

        // Add scan completion to history
        const totalRemotes = result.matchedRepositories.reduce((sum, repo) => sum + repo.matchedRemotes.length, 0);
        addCompletedStep(
          'scan',
          <Box flexDirection="column">
            <Text>
              <Text color="green">✓</Text> Scan complete: {result.directoriesScanned.toLocaleString()} directories (
              {result.repositoriesFound} repos, <Text color="cyan">{result.matchedRepositories.length}</Text> matched,{' '}
              {totalRemotes} remotes)
            </Text>
          </Box>
        );

        if (result.matchedRepositories.length === 0) {
          setPhase('no-matches');
        } else {
          setPhase('review');
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        // Handle error - show in UI
        console.error('Scan error:', error);
        setPhase('cancelled');
      }
    };

    void runScan();

    return () => {
      controller.abort();
    };
  }, [phase, oldUsername, newUsername, scanRoot, excludePatterns, customPattern, addCompletedStep]);

  // Handle migration confirmation
  const handleConfirmMigration = useCallback(() => {
    if (dryRun) {
      // In dry run mode, show summary without applying changes
      setPhase('dry-run-complete');
    } else {
      // Actually perform migration
      setPhase('migrating');
    }
  }, [dryRun]);

  // Handle migration cancellation
  const handleCancelMigration = useCallback(() => {
    setPhase('cancelled');
  }, []);

  // Start migration when phase changes to migrating
  useEffect(() => {
    if (phase !== 'migrating') return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const runMigration = async () => {
      try {
        const result = await migrate(matchedRepos, oldUsername, newUsername, {
          signal: controller.signal,
          onProgress: (progress: MigrationProgressType) => {
            setMigrationProgress(progress);
          },
        });

        if (controller.signal.aborted) return;

        setMigrationProgress({
          total: matchedRepos.length,
          completed: matchedRepos.length,
          results: result.results,
        });
        setLogPath(result.logPath);
        setPhase('complete');
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Migration error:', error);
        setPhase('complete');
      }
    };

    void runMigration();

    return () => {
      controller.abort();
    };
  }, [phase, matchedRepos, oldUsername, newUsername]);

  // Render the current phase content
  const renderPhase = () => {
    switch (phase) {
      case 'welcome':
        return <Welcome />;

      case 'input':
        return <UsernameInput onSubmit={handleUsernameSubmit} />;

      case 'scanning':
        return <ScanProgress progress={scanProgress} />;

      case 'review':
        return (
          <RepoList
            repositories={matchedRepos}
            oldUsername={oldUsername}
            newUsername={newUsername}
            onConfirm={handleConfirmMigration}
            onCancel={handleCancelMigration}
          />
        );

      case 'migrating':
        return <MigrationProgress progress={migrationProgress} />;

      case 'complete':
        return <ResultSummary results={migrationProgress.results} logPath={logPath} />;

      case 'dry-run-complete':
        return (
          <DryRunSummary
            repositories={matchedRepos}
            oldUsername={oldUsername}
            newUsername={newUsername}
            onExit={() => {
              exit();
            }}
          />
        );

      case 'cancelled':
        return (
          <Box flexDirection="column" paddingY={1}>
            <Text color="yellow">Migration cancelled.</Text>
            <Text dimColor>Press any key to exit...</Text>
          </Box>
        );

      case 'no-matches':
        return (
          <Box flexDirection="column" paddingY={1}>
            <Text color="yellow">No repositories found with username &quot;{oldUsername}&quot;.</Text>
            <Text dimColor>Scanned {scanProgress.directoriesScanned.toLocaleString()} directories.</Text>
            <Text dimColor>Found {scanProgress.repositoriesFound} repositories total.</Text>
            <Box marginTop={1}>
              <Text dimColor>Press Enter or Q to exit...</Text>
            </Box>
          </Box>
        );

      default:
        return (
          <Confirmation
            message="Unknown state"
            onConfirm={() => {
              exit();
            }}
            onCancel={() => {
              exit();
            }}
          />
        );
    }
  };

  return (
    <>
      {/* Render completed steps as static content */}
      {completedSteps.length > 0 && (
        <Static items={completedSteps}>
          {(step) => (
            <Box key={step.id} marginBottom={0}>
              {step.content}
            </Box>
          )}
        </Static>
      )}

      {/* Render current phase */}
      {renderPhase()}
    </>
  );
};
