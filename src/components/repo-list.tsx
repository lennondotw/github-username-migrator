/**
 * Repository list component showing matched repositories
 */

import { Box, Text, useInput } from 'ink';
import { useState } from 'react';

import type { MatchedRepository } from '../types';

export interface RepoListProps {
  repositories: MatchedRepository[];
  oldUsername: string;
  newUsername: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RepoList: React.FC<RepoListProps> = ({ repositories, oldUsername, newUsername, onConfirm, onCancel }) => {
  const [selectedAction, setSelectedAction] = useState<'confirm' | 'cancel'>('confirm');

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      setSelectedAction((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'));
    }
    if (key.return) {
      if (selectedAction === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    }
    if (input === 'y' || input === 'Y') {
      onConfirm();
    }
    if (input === 'n' || input === 'N') {
      onCancel();
    }
  });

  // Group remotes by repository
  const totalRemotes = repositories.reduce((sum, repo) => sum + repo.matchedRemotes.length, 0);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Found {repositories.length} {repositories.length === 1 ? 'Repository' : 'Repositories'} ({totalRemotes}{' '}
          {totalRemotes === 1 ? 'remote' : 'remotes'})
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Changing username from <Text color="red">{oldUsername}</Text> to <Text color="green">{newUsername}</Text>
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {repositories.slice(0, 10).map((repo, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text color="yellow">{repo.path}</Text>
            {repo.matchedRemotes.map((matched, remoteIndex) => (
              <Box key={remoteIndex} marginLeft={2} flexDirection="column">
                <Text>
                  <Text color="cyan">{matched.remote.name}</Text>
                  <Text dimColor>: </Text>
                  <Text color="red" strikethrough>
                    {matched.remote.url}
                  </Text>
                </Text>
                <Text marginLeft={2}>
                  <Text dimColor>→ </Text>
                  <Text color="green">{matched.newUrl}</Text>
                </Text>
              </Box>
            ))}
          </Box>
        ))}
        {repositories.length > 10 && <Text dimColor>... and {repositories.length - 10} more repositories</Text>}
      </Box>

      <Box marginTop={1}>
        <Text>Proceed with migration? </Text>
        <Text color={selectedAction === 'confirm' ? 'green' : 'white'} bold={selectedAction === 'confirm'}>
          [Y]es
        </Text>
        <Text> / </Text>
        <Text color={selectedAction === 'cancel' ? 'red' : 'white'} bold={selectedAction === 'cancel'}>
          [N]o
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to select, Enter to confirm</Text>
      </Box>
    </Box>
  );
};
