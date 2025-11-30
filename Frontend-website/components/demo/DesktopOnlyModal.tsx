'use client';

import React from 'react';
import { Modal, Text, Button, Stack } from '@mantine/core';
import { Download, X } from 'lucide-react';
import Link from 'next/link';

interface DesktopOnlyModalProps {
  opened: boolean;
  onClose: () => void;
  message?: string;
}

export function DesktopOnlyModal({ opened, onClose, message }: DesktopOnlyModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Desktop App Feature"
      centered
      size="md"
    >
      <Stack gap="md">
        <Text>
          {message || 'This action is available only in the Desktop App.'}
        </Text>
        <Text size="sm" c="dimmed">
          Download QA Studio to run real tests, execute on BrowserStack, view traces, and access all advanced features.
        </Text>
        <Stack gap="xs">
          <Link href="/download" passHref>
            <Button
              fullWidth
              leftSection={<Download size={16} />}
              onClick={onClose}
            >
              Download QA Studio
            </Button>
          </Link>
          <Button
            variant="subtle"
            fullWidth
            leftSection={<X size={16} />}
            onClick={onClose}
          >
            Close
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}

