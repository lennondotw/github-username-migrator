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

/** Number of repositories to show per page */
const PAGE_SIZE = 10;

export const RepoList: React.FC<RepoListProps> = ({ repositories, oldUsername, newUsername, onConfirm, onCancel }) => {
  const [selectedAction, setSelectedAction] = useState<'confirm' | 'cancel'>('confirm');
  const [scrollOffset, setScrollOffset] = useState(0);

  const totalPages = Math.ceil(repositories.length / PAGE_SIZE);
  const currentPage = Math.floor(scrollOffset / PAGE_SIZE) + 1;

  useInput((input, key) => {
    // Navigation
    if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset((prev) => Math.min(repositories.length - PAGE_SIZE, prev + 1));
    }
    // Page up/down with j/k
    if (input === 'k' || input === 'K') {
      setScrollOffset((prev) => Math.max(0, prev - PAGE_SIZE));
    }
    if (input === 'j' || input === 'J') {
      setScrollOffset((prev) => Math.min(Math.max(0, repositories.length - PAGE_SIZE), prev + PAGE_SIZE));
    }

    // Action selection
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

  // Get visible repositories
  const visibleRepos = repositories.slice(scrollOffset, scrollOffset + PAGE_SIZE);

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
        {visibleRepos.map((repo, index) => (
          <Box key={scrollOffset + index} flexDirection="column" marginBottom={1}>
            <Text color="yellow">{repo.path}</Text>
            {repo.matchedRemotes.map((matched, remoteIndex) => {
              // Calculate padding to align the arrow with the URL start (name length only, no ": ")
              const remoteLabelWidth = matched.remote.name.length;
              return (
                <Box key={remoteIndex} marginLeft={2} flexDirection="column">
                  <Text>
                    <Text color="cyan">{matched.remote.name}</Text>
                    <Text dimColor>: </Text>
                    <Text color="red" strikethrough>
                      {matched.remote.url}
                    </Text>
                  </Text>
                  <Text>
                    <Text>{' '.repeat(remoteLabelWidth)}</Text>
                    <Text dimColor>→ </Text>
                    <Text color="green">{matched.newUrl}</Text>
                  </Text>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Scroll indicator */}
      {repositories.length > PAGE_SIZE && (
        <Box marginBottom={1}>
          <Text dimColor>
            Showing {scrollOffset + 1}-{Math.min(scrollOffset + PAGE_SIZE, repositories.length)} of{' '}
            {repositories.length} (Page {currentPage}/{totalPages}) | ↑↓ scroll, J/K page
          </Text>
        </Box>
      )}

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
        <Text dimColor>← → to select, Enter to confirm</Text>
      </Box>
    </Box>
  );
};
