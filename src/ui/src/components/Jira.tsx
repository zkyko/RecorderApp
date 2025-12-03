import React, { useEffect, useRef, useState } from 'react';
import { Stack, Text, Group, Button, Alert, Loader } from '@mantine/core';
import { Bug, RefreshCw, LogOut } from 'lucide-react';
import { ipc } from '../ipc';

// TypeScript type for Electron webview element
interface WebViewElement extends HTMLElement {
  reload: () => void;
  src: string;
  getWebContents?: () => any;
}

/**
 * Jira component
 * Embeds Jira web interface using Electron webview
 */
export const Jira: React.FC = () => {
  const webviewRef = useRef<WebViewElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webviewReady, setWebviewReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jiraUrl, setJiraUrl] = useState<string>('');

  // Load Jira URL from settings
  useEffect(() => {
    const loadJiraUrl = async () => {
      try {
        // Get Jira base URL from settings
        const response = await ipc.settings.getJiraConfig();
        if (response.success && response.config?.baseUrl) {
          setJiraUrl(response.config.baseUrl);
        } else {
          // Default to common Jira URL
          setJiraUrl('https://fourhands.atlassian.net');
        }
      } catch (error) {
        console.error('[Jira] Failed to load Jira URL:', error);
        setJiraUrl('https://fourhands.atlassian.net');
      }
    };
    loadJiraUrl();
  }, []);

  useEffect(() => {
    if (!jiraUrl) return;

    console.log('[Jira] Component mounted, creating webview...');
    // Create webview element dynamically after component mounts
    if (containerRef.current && !webviewRef.current) {
      console.log('[Jira] Container found, creating webview element');
      const webview = document.createElement('webview');
      webview.src = jiraUrl;
      webview.setAttribute('partition', 'persist:jira');
      webview.setAttribute('allowpopups', 'true');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'flex';
      
      webview.addEventListener('dom-ready', () => {
        setWebviewReady(true);
        setError(null);
      });
      
      webview.addEventListener('did-fail-load', (event: any) => {
        console.error('[Jira] Failed to load:', event);
        setError(`Failed to load Jira: ${event.errorDescription || 'Unknown error'}`);
      });
      
      containerRef.current.appendChild(webview);
      webviewRef.current = webview as WebViewElement;
    }

    return () => {
      // Cleanup
      if (webviewRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(webviewRef.current);
        } catch (e) {
          // Element may have already been removed
        }
        webviewRef.current = null;
      }
    };
  }, [jiraUrl]);

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
      setWebviewReady(false);
    }
  };

  const handleLogout = async () => {
    // Clear Jira session via IPC
    const result = await ipc.settings.clearJiraSession();
    if (result.success) {
      // Reload the webview to show login page
      if (webviewRef.current) {
        webviewRef.current.reload();
        setWebviewReady(false);
      }
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Minimal header bar */}
      <div style={{ flexShrink: 0, padding: '8px 16px', background: '#0b1020', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Group gap="xs">
          <Bug size={18} />
          <Text size="sm" fw={500}>Jira</Text>
          {jiraUrl && (
            <Text size="xs" c="dimmed">
              {jiraUrl}
            </Text>
          )}
        </Group>
        <Group gap="xs">
          <Button
            leftSection={<RefreshCw size={14} />}
            onClick={handleRefresh}
            variant="subtle"
            size="xs"
            compact
          >
            Refresh
          </Button>
          <Button
            leftSection={<LogOut size={14} />}
            onClick={handleLogout}
            variant="subtle"
            color="red"
            size="xs"
            compact
          >
            Log Out
          </Button>
        </Group>
      </div>

      {error && (
        <Alert color="red" icon={<Bug size={16} />} style={{ flexShrink: 0, margin: '8px 16px' }}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {!webviewReady && !error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Group>
            <Loader size="md" />
            <Text size="sm" c="dimmed">Loading Jira...</Text>
          </Group>
        </div>
      )}

      {/* Webview container - fills remaining space */}
      <div 
        ref={containerRef}
        style={{ flex: 1, display: 'flex', minHeight: 0, width: '100%', overflow: 'hidden' }}
      />
    </div>
  );
};

