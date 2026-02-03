/**
 * Dry run summary component showing what would be changed
 */

import { Box, Text, useInput } from 'ink';

import type { MatchedRepository } from '../types';

export interface DryRunSummaryProps {
  repositories: MatchedRepository[];
  oldUsername: string;
  newUsername: string;
  onExit: () => void;
}

export const DryRunSummary: React.FC<DryRunSummaryProps> = ({ repositories, oldUsername, newUsername, onExit }) => {
  useInput(() => {
    onExit();
  });

  // Count total remotes
  const totalRemotes = repositories.reduce((sum, repo) => sum + repo.matchedRemotes.length, 0);

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={4} marginBottom={1} alignSelf="flex-start">
        <Box flexDirection="column">
          <Text bold color="yellow">
            DRY RUN MODE
          </Text>
          <Text dimColor>No changes were made</Text>
        </Box>
      </Box>

      {/* Summary */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          SUMMARY
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            <Text dimColor>Repositories found: </Text>
            <Text color="green" bold>
              {repositories.length}
            </Text>
          </Text>
          <Text>
            <Text dimColor>Remotes to update: </Text>
            <Text color="green" bold>
              {totalRemotes}
            </Text>
          </Text>
          <Text>
            <Text dimColor>Username change: </Text>
            <Text color="red">{oldUsername}</Text>
            <Text> → </Text>
            <Text color="green">{newUsername}</Text>
          </Text>
        </Box>
      </Box>

      {/* Changes preview */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          CHANGES PREVIEW
        </Text>
        <Box marginLeft={2} flexDirection="column">
          {repositories.slice(0, 8).map((repo, index) => {
            const displayPath = repo.path.length > 45 ? '...' + repo.path.slice(-42) : repo.path;
            return (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Text color="yellow">{displayPath}</Text>
                {repo.matchedRemotes.map((match, matchIndex) => (
                  <Box key={matchIndex} marginLeft={2} flexDirection="column">
                    <Text>
                      <Text dimColor>{match.remote.name}: </Text>
                      <Text color="red" strikethrough>
                        {match.remote.url}
                      </Text>
                    </Text>
                    <Text>
                      <Text dimColor>{''.padEnd(match.remote.name.length + 2)}</Text>
                      <Text color="green">{match.newUrl}</Text>
                    </Text>
                  </Box>
                ))}
              </Box>
            );
          })}
          {repositories.length > 8 && <Text dimColor>... and {repositories.length - 8} more repositories</Text>}
        </Box>
      </Box>

      {/* Instructions */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">
          TO APPLY CHANGES
        </Text>
        <Box marginLeft={2}>
          <Text>Run with </Text>
          <Text color="green" bold>
            --apply
          </Text>
          <Text> flag:</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text color="green">$ </Text>
          <Text color="cyan">github-username-migrator run --apply</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press any key to exit...</Text>
      </Box>
    </Box>
  );
};
