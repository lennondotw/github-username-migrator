/**
 * Help screen component with colorful CLI help information
 */

import { Box, Text } from 'ink';

// Build info: injected at build time via --define
declare const __DEV__: boolean | undefined;
declare const __VERSION__: string | undefined;
declare const __GIT_HASH__: string | undefined;
declare const __GIT_DIRTY__: boolean | undefined;

// Dev mode if __DEV__ is not defined or is true
const IS_DEV = typeof __DEV__ === 'undefined' || __DEV__;

// Version: use injected value, or fallback to hardcoded (keep in sync with package.json)
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.4.0';

function formatBuildInfo(): string {
  if (IS_DEV) {
    return 'dev';
  }
  if (typeof __GIT_HASH__ !== 'undefined' && __GIT_HASH__) {
    const isDirty = typeof __GIT_DIRTY__ !== 'undefined' ? __GIT_DIRTY__ : false;
    return isDirty ? `${__GIT_HASH__}, dirty` : __GIT_HASH__;
  }
  return 'unknown';
}

const BUILD_INFO = formatBuildInfo();

export const Help: React.FC = () => {
  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Logo / Title */}
      <Box borderStyle="round" borderColor="cyan" paddingX={4} marginBottom={1} alignSelf="flex-start">
        <Box flexDirection="column">
          <Text bold color="magenta">
            GitHub Username Migrator
          </Text>
          <Text dimColor>Migrate GitHub usernames in git remotes</Text>
        </Box>
      </Box>

      {/* Version */}
      <Box marginBottom={1}>
        <Text dimColor>Version: </Text>
        <Text color="yellow">{VERSION}</Text>
      </Box>

      {/* Description */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          DESCRIPTION
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>Scan all git repositories in your home directory and update</Text>
          <Text>GitHub remote URLs from one username to another.</Text>
        </Box>
      </Box>

      {/* Usage */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          USAGE
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Box>
            <Text color="green">$ </Text>
            <Text color="cyan">github-username-migrator</Text>
            <Text dimColor> [command] [options]</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="green">$ </Text>
            <Text color="cyan">github-username-migrator run</Text>
            <Text dimColor>{'          '}# Dry run (preview only)</Text>
          </Box>
          <Box>
            <Text color="green">$ </Text>
            <Text color="cyan">github-username-migrator run --apply</Text>
            <Text dimColor>{'  '}# Apply changes</Text>
          </Box>
        </Box>
      </Box>

      {/* Commands */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          COMMANDS
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Box>
            <Text color="green">run{'             '}</Text>
            <Text>Start migration wizard </Text>
            <Text color="yellow">(dry run by default)</Text>
          </Box>
        </Box>
      </Box>

      {/* Options */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          OPTIONS
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Box>
            <Text color="yellow">-a, --apply{'            '}</Text>
            <Text>Actually apply changes </Text>
            <Text color="red">(required to modify)</Text>
          </Box>
          <Box>
            <Text color="yellow">-r, --root </Text>
            <Text color="cyan">&lt;path&gt;</Text>
            <Text>{'      '}</Text>
            <Text>Custom scan root directory</Text>
          </Box>
          <Box>
            <Text color="yellow">-e, --exclude </Text>
            <Text color="cyan">&lt;glob&gt;</Text>
            <Text>{'   '}</Text>
            <Text>Exclude dirs matching glob (repeatable)</Text>
          </Box>
          <Box>
            <Text color="yellow">--pattern-from </Text>
            <Text color="cyan">&lt;regex&gt;</Text>
            <Text>{'  '}</Text>
            <Text>Custom regex to match URLs</Text>
          </Box>
          <Box>
            <Text color="yellow">--pattern-to </Text>
            <Text color="cyan">&lt;string&gt;</Text>
            <Text>{'  '}</Text>
            <Text>Replacement ($1, $2 for groups)</Text>
          </Box>
          <Box>
            <Text color="yellow">-h, --help{'             '}</Text>
            <Text>Show this help message</Text>
          </Box>
          <Box>
            <Text color="yellow">-v, --version{'          '}</Text>
            <Text>Show version number</Text>
          </Box>
        </Box>
      </Box>

      {/* Advanced Usage */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          ADVANCED USAGE
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text dimColor>Rename repository:</Text>
          <Box>
            <Text color="green">$ </Text>
            <Text color="cyan">github-username-migrator run \</Text>
          </Box>
          <Box marginLeft={4}>
            <Text color="cyan">--pattern-from </Text>
            <Text color="gray">&quot;github.com/user/</Text>
            <Text color="red">old-repo</Text>
            <Text color="gray">&quot; \</Text>
          </Box>
          <Box marginLeft={4}>
            <Text color="cyan">--pattern-to </Text>
            <Text color="gray">&quot;github.com/user/</Text>
            <Text color="green">new-repo</Text>
            <Text color="gray">&quot;</Text>
          </Box>
        </Box>
      </Box>

      {/* Safety Note */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          SAFETY
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            <Text color="yellow">⚠ </Text>
            <Text>By default, runs in </Text>
            <Text color="yellow" bold>
              dry run mode
            </Text>
            <Text> (no changes made)</Text>
          </Text>
          <Text>
            <Text color="green">✓ </Text>
            <Text>Use </Text>
            <Text color="green" bold>
              --apply
            </Text>
            <Text> flag to actually modify git remotes</Text>
          </Text>
        </Box>
      </Box>

      {/* Workflow */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          WORKFLOW
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Box>
            <Text color="blue">1.</Text>
            <Text> Enter your </Text>
            <Text color="red">old</Text>
            <Text> GitHub username</Text>
          </Box>
          <Box>
            <Text color="blue">2.</Text>
            <Text> Enter your </Text>
            <Text color="green">new</Text>
            <Text> GitHub username</Text>
          </Box>
          <Box>
            <Text color="blue">3.</Text>
            <Text> Review found repositories</Text>
          </Box>
          <Box>
            <Text color="blue">4.</Text>
            <Text> Confirm to apply changes</Text>
          </Box>
        </Box>
      </Box>

      {/* Examples */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          SUPPORTED URL FORMATS
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Box>
            <Text dimColor>SSH:{'   '}</Text>
            <Text color="gray">git@github.com:</Text>
            <Text color="red">olduser</Text>
            <Text color="gray">/repo.git</Text>
          </Box>
          <Box>
            <Text dimColor>HTTPS: </Text>
            <Text color="gray">https://github.com/</Text>
            <Text color="red">olduser</Text>
            <Text color="gray">/repo.git</Text>
          </Box>
        </Box>
      </Box>

      {/* Log location */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="white">
          LOG LOCATION
        </Text>
        <Box marginLeft={2}>
          <Text color="cyan">~/.github-username-migrator/logs/</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          For more info: <Text color="blue">https://github.com/lennondotw/github-username-migrator</Text>
        </Text>
      </Box>
    </Box>
  );
};

export const Version: React.FC = () => {
  return (
    <Box>
      <Text color="cyan">github-username-migrator</Text>
      <Text> </Text>
      <Text color="yellow">{VERSION}</Text>
      <Text dimColor> ({BUILD_INFO})</Text>
    </Box>
  );
};
