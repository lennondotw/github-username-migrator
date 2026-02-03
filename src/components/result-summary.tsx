/**
 * Result summary component showing migration completion
 */

import { Box, Text } from 'ink';

import type { MigrationResult } from '../types';

export interface MigrationSummary {
  totalRepositories: number;
  totalRemotes: number;
  successful: number;
  failed: number;
  errors: { path: string; remote: string; error: string }[];
}

export interface ResultSummaryProps {
  results: MigrationResult[];
  logPath?: string;
}

/**
 * Compute summary from migration results
 */
export function computeSummary(results: MigrationResult[]): MigrationSummary {
  let totalRemotes = 0;
  let successful = 0;
  let failed = 0;
  const errors: { path: string; remote: string; error: string }[] = [];

  for (const result of results) {
    for (const r of result.results) {
      totalRemotes++;
      if (r.success) {
        successful++;
      } else {
        failed++;
        errors.push({
          path: result.repository.path,
          remote: r.remoteName,
          error: r.error ?? 'Unknown error',
        });
      }
    }
  }

  return {
    totalRepositories: results.length,
    totalRemotes,
    successful,
    failed,
    errors,
  };
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({ results, logPath }) => {
  const summary = computeSummary(results);
  const allSuccessful = summary.failed === 0;

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color={allSuccessful ? 'green' : 'yellow'}>
          {allSuccessful ? 'Migration Complete!' : 'Migration Completed with Errors'}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text dimColor>Total repositories: </Text>
          <Text>{summary.totalRepositories}</Text>
        </Text>
        <Text>
          <Text dimColor>Total remotes: </Text>
          <Text>{summary.totalRemotes}</Text>
        </Text>
        <Text>
          <Text dimColor>Successful: </Text>
          <Text color="green">{summary.successful}</Text>
        </Text>
        {summary.failed > 0 && (
          <Text>
            <Text dimColor>Failed: </Text>
            <Text color="red">{summary.failed}</Text>
          </Text>
        )}
      </Box>

      {summary.errors.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="red" bold>
            Errors:
          </Text>
          {summary.errors.slice(0, 5).map((error, index) => {
            const displayPath = error.path.length > 40 ? '...' + error.path.slice(-37) : error.path;
            return (
              <Box key={index} marginLeft={2}>
                <Text color="red">
                  {displayPath} ({error.remote}): {error.error}
                </Text>
              </Box>
            );
          })}
          {summary.errors.length > 5 && <Text dimColor>... and {summary.errors.length - 5} more errors</Text>}
        </Box>
      )}

      {logPath && (
        <Box marginTop={1}>
          <Text dimColor>
            Log saved to: <Text color="cyan">{logPath}</Text>
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press any key to exit...</Text>
      </Box>
    </Box>
  );
};
