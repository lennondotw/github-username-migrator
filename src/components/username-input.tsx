/**
 * Username input component for old and new usernames
 */

import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';

export interface UsernameInputProps {
  onSubmit: (oldUsername: string, newUsername: string) => void;
}

export const UsernameInput: React.FC<UsernameInputProps> = ({ onSubmit }) => {
  const [step, setStep] = useState<'old' | 'new'>('old');
  const [oldUsername, setOldUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useInput((_input, key) => {
    if (key.return) {
      if (step === 'old' && oldUsername.trim()) {
        setStep('new');
      } else if (step === 'new' && newUsername.trim()) {
        onSubmit(oldUsername.trim(), newUsername.trim());
      }
    }
  });

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Enter GitHub Usernames
        </Text>
      </Box>

      <Box>
        <Text>Old username: </Text>
        {step === 'old' ? (
          <TextInput value={oldUsername} onChange={setOldUsername} placeholder="e.g., olduser" />
        ) : (
          <Text color="green">{oldUsername}</Text>
        )}
      </Box>

      {step === 'new' && (
        <Box>
          <Text>New username: </Text>
          <TextInput value={newUsername} onChange={setNewUsername} placeholder="e.g., newuser" />
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press Enter to {step === 'old' ? 'continue' : 'start scanning'}...</Text>
      </Box>
    </Box>
  );
};
