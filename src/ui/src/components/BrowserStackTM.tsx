import React, { useEffect, useRef, useState } from 'react';
import { Stack, Text, Group, Button, Alert, Loader } from '@mantine/core';
import { Cloud, RefreshCw, LogOut } from 'lucide-react';
import { ipc } from '../ipc';

// TypeScript type for Electron webview element
interface WebViewElement extends HTMLElement {
  reload: () => void;
  src: string;
  getWebContents?: () => any;
}

/**
 * BrowserStack Test Management component
 * Embeds BrowserStack TM web interface using Electron webview
 */
export const BrowserStackTM: React.FC = () => {
  const webviewRef = useRef<WebViewElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webviewReady, setWebviewReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('[BrowserStackTM] Component mounted');
  }, []);

  useEffect(() => {
    console.log('[BrowserStackTM] Component mounted, creating webview...');
    // Create webview element dynamically after component mounts
    if (containerRef.current && !webviewRef.current) {
      console.log('[BrowserStackTM] Container found, creating webview element');
      const webview = document.createElement('webview');
      webview.src = 'https://test-management.browserstack.com/projects';
      webview.setAttribute('partition', 'persist:browserstack-tm');
      webview.setAttribute('allowpopups', 'true');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'flex';
      
      webview.addEventListener('dom-ready', () => {
        setWebviewReady(true);
        setError(null);
      });
      
      webview.addEventListener('did-fail-load', (event: any) => {
        console.error('[BrowserStackTM] Failed to load:', event);
        setError(`Failed to load BrowserStack Test Management: ${event.errorDescription || 'Unknown error'}`);
      });
      
      containerRef.current.appendChild(webview);
      webviewRef.current = webview as WebViewElement;
    }

    return () => {
      // Cleanup
      if (webviewRef.current && containerRef.current) {
        containerRef.current.removeChild(webviewRef.current);
        webviewRef.current = null;
      }
    };
  }, []);

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
      setWebviewReady(false);
    }
  };

  const handleLogout = async () => {
    // Clear BrowserStack TM session via IPC
    const result = await ipc.settings.clearBrowserStackTMSession();
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
      {/* Minimal header bar - collapsible or minimal */}
      <div style={{ flexShrink: 0, padding: '8px 16px', background: '#0b1020', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Group gap="xs">
          <Cloud size={18} />
          <Text size="sm" fw={500}>BrowserStack Test Management</Text>
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
        <Alert color="red" icon={<Cloud size={16} />} style={{ flexShrink: 0, margin: '8px 16px' }}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {!webviewReady && !error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Group>
            <Loader size="md" />
            <Text size="sm" c="dimmed">Loading BrowserStack Test Management...</Text>
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

