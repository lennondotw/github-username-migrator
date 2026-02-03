/**
 * Scanning progress component
 */

import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

import type { ScanProgress as ScanProgressType } from '../types';

export interface ScanProgressProps {
  progress: ScanProgressType;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ progress }) => {
  // Truncate path for display
  const displayPath =
    progress.currentPath.length > 60
      ? '...' + progress.currentPath.slice(-57)
      : progress.currentPath || 'Starting scan...';

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Scanning for Repositories
        </Text>
      </Box>

      <Box>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text> Scanning...</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text dimColor>Directories scanned: </Text>
          <Text color="yellow">{progress.directoriesScanned.toLocaleString()}</Text>
          <Text dimColor> (</Text>
          <Text color="gray">{progress.skippedDirectories.toLocaleString()}</Text>
          <Text dimColor> skipped)</Text>
        </Text>
        <Text>
          <Text dimColor>Repositories found: </Text>
          <Text color="yellow">{progress.repositoriesFound}</Text>
        </Text>
        <Text>
          <Text dimColor>Matching repos: </Text>
          <Text color="green" bold>
            {progress.matchedCount}
          </Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor wrap="truncate">
          {displayPath}
        </Text>
      </Box>
    </Box>
  );
};
