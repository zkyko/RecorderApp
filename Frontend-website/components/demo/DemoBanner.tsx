'use client';

import React from 'react';
import { Alert, Group, Button, Text } from '@mantine/core';
import { Info, Download, X } from 'lucide-react';
import Link from 'next/link';

interface DemoBannerProps {
  onDismiss?: () => void;
}

export function DemoBanner({ onDismiss }: DemoBannerProps) {
  return (
    <Alert
      icon={<Info size={16} />}
      title="You're viewing the QA Studio Web Demo"
      color="blue"
      variant="light"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        borderRadius: 0,
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
      }}
      styles={{
        root: {
          padding: '12px 16px',
        },
        title: {
          marginBottom: 4,
        },
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="sm" style={{ flex: 1 }}>
          Some features require the Desktop App. Download QA Studio to run real tests, execute on BrowserStack, view traces, and access all advanced features.
        </Text>
        <Group gap="xs" wrap="nowrap">
          <Button
            component={Link}
            href="/download"
            size="xs"
            leftSection={<Download size={14} />}
            variant="filled"
          >
            Download Desktop App
          </Button>
          {onDismiss && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={onDismiss}
              leftSection={<X size={14} />}
            >
              Dismiss
            </Button>
          )}
        </Group>
      </Group>
    </Alert>
  );
}

