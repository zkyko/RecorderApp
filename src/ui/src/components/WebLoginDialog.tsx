import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Stack, Alert, Text, Group } from '@mantine/core';
import { LogIn, X } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';

interface WebLoginDialogProps {
  opened: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  webUrl?: string;
}

const WebLoginDialog: React.FC<WebLoginDialogProps> = ({
  opened,
  onClose,
  onLoginSuccess,
  webUrl,
}) => {
  const { workspacePath, currentWorkspace } = useWorkspaceStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState(webUrl || 'https://fh-test-fourhandscom.azurewebsites.net/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      // Reset form when dialog opens
      setError(null);
      setProgress(null);
      // Use workspace URL if available
      if (currentWorkspace?.type === 'web-demo') {
        const settings = (currentWorkspace.settings || {}) as { baseUrl?: string };
        if (settings.baseUrl) {
          setUrl(settings.baseUrl);
        }
      }
    }
  }, [opened, currentWorkspace]);

  useEffect(() => {
    if (opened) {
      // Set up progress listener
      const backend = (window as any).electronAPI;
      if (backend?.onWebLoginProgress) {
        backend.onWebLoginProgress((message: string) => {
          setProgress(message);
        });
      }

      return () => {
        // Clean up listener
        if (backend?.removeWebLoginProgressListener) {
          backend.removeWebLoginProgressListener();
        }
      };
    }
  }, [opened]);

  const handleLogin = async () => {
    if (!username || !password || !url) {
      setError('Please fill in all fields');
      return;
    }

    if (!workspacePath) {
      setError('Workspace not set');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Starting authentication...');

    try {
      const backend = (window as any).electronAPI;
      if (!backend?.webLogin) {
        throw new Error('Web login API not available');
      }

      const result = await ipc.auth.webLogin({
        webUrl: url,
        username,
        password,
        workspacePath,
        // Optional: Add custom selectors if needed
        // loginSelectors: {
        //   usernameSelector: 'input[name="email"]',
        //   passwordSelector: 'input[type="password"]',
        //   submitSelector: 'button[type="submit"]',
        //   waitForSelector: '[data-testid="dashboard"]', // Wait for this after login
        // },
      });

      if (result.success) {
        setProgress('Authentication successful!');
        setTimeout(() => {
          onLoginSuccess();
          onClose();
        }, 1000);
      } else {
        setError(result.error || 'Login failed');
        setProgress(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <LogIn size={20} />
          <Text fw={600}>Login to FH Web</Text>
        </Group>
      }
      size="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Enter your credentials to save authentication state. You won't need to login again until the session expires.
        </Text>

        <TextInput
          label="Web URL"
          placeholder="https://fh-test-fourhandscom.azurewebsites.net/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />

        <TextInput
          label="Username / Email"
          placeholder="your.email@example.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
        />

        <TextInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />

        {progress && (
          <Alert color="blue" icon={<LogIn size={16} />}>
            {progress}
          </Alert>
        )}

        {error && (
          <Alert color="red" icon={<X size={16} />}>
            {error}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            loading={loading}
            leftSection={<LogIn size={16} />}
          >
            Login
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default WebLoginDialog;

