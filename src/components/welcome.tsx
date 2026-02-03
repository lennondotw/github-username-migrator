/**
 * Welcome screen component
 */

import { Box, Text } from 'ink';

export const Welcome: React.FC = () => {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          GitHub Username Migrator
        </Text>
      </Box>
      <Text dimColor>
        This tool will scan your home directory for git repositories and update GitHub remote URLs from one username to
        another.
      </Text>
      <Box marginTop={1}>
        <Text dimColor>Press Enter to continue...</Text>
      </Box>
    </Box>
  );
};
