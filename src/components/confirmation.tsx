/**
 * Confirmation dialog component
 */

import { Box, Text, useInput } from 'ink';
import { useState } from 'react';

export interface ConfirmationProps {
  message: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const Confirmation: React.FC<ConfirmationProps> = ({
  message,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
}) => {
  const [selected, setSelected] = useState<'confirm' | 'cancel'>('confirm');

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || key.tab) {
      setSelected((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'));
    }
    if (key.return) {
      if (selected === 'confirm') {
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

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="yellow">
          {message}
        </Text>
      </Box>

      {description && (
        <Box marginBottom={1}>
          <Text dimColor>{description}</Text>
        </Box>
      )}

      <Box>
        <Text color={selected === 'confirm' ? 'green' : 'white'} bold={selected === 'confirm'}>
          [{confirmLabel.charAt(0).toUpperCase()}]{confirmLabel.slice(1)}
        </Text>
        <Text> / </Text>
        <Text color={selected === 'cancel' ? 'red' : 'white'} bold={selected === 'cancel'}>
          [{cancelLabel.charAt(0).toUpperCase()}]{cancelLabel.slice(1)}
        </Text>
      </Box>
    </Box>
  );
};
