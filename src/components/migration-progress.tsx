/**
 * Migration progress component showing real-time updates
 */

import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

import type { MigrationProgress as MigrationProgressType } from '../types';

export interface MigrationProgressProps {
  progress: MigrationProgressType;
}

export const MigrationProgress: React.FC<MigrationProgressProps> = ({ progress }) => {
  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const barWidth = 30;
  const filledWidth = Math.round((percent / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  // Count successful and failed migrations
  const successful = progress.results.filter((r) => r.results.every((rr) => rr.success)).length;
  const failed = progress.completed - successful;

  // Truncate current repo path for display
  const currentRepo = progress.currentRepository ?? '';
  const displayPath = currentRepo.length > 50 ? '...' + currentRepo.slice(-47) : currentRepo;

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Migrating Repositories
        </Text>
      </Box>

      <Box>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text> Processing...</Text>
      </Box>

      {/* Progress bar */}
      <Box marginTop={1}>
        <Text>[</Text>
        <Text color="green">{'█'.repeat(filledWidth)}</Text>
        <Text dimColor>{'░'.repeat(emptyWidth)}</Text>
        <Text>] </Text>
        <Text bold>{percent}%</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text dimColor>Progress: </Text>
          <Text color="yellow">
            {progress.completed}/{progress.total}
          </Text>
        </Text>
        <Text>
          <Text dimColor>Successful: </Text>
          <Text color="green">{successful}</Text>
        </Text>
        <Text>
          <Text dimColor>Failed: </Text>
          <Text color={failed > 0 ? 'red' : 'white'}>{failed}</Text>
        </Text>
      </Box>

      {displayPath && (
        <Box marginTop={1}>
          <Text dimColor>{displayPath}</Text>
        </Box>
      )}
    </Box>
  );
};
