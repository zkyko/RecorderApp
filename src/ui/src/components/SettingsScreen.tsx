import React, { useState, useEffect } from 'react';
import { Card, Text, Group, Button, TextInput, Stack, Breadcrumbs, Anchor, SegmentedControl, Divider } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, Cloud, Video } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { RecordingEngine } from '../../../types/v1.5';
// Using simple alerts for now - can be replaced with Mantine notifications if provider is set up
import './SettingsScreen.css';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [loading, setLoading] = useState(false);
  const [browserstackSettings, setBrowserstackSettings] = useState({
    username: '',
    accessKey: '',
    project: '',
    buildPrefix: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [recordingEngine, setRecordingEngine] = useState<RecordingEngine>('qaStudio');
  const [savingRecordingEngine, setSavingRecordingEngine] = useState(false);

  useEffect(() => {
    if (workspacePath) {
      loadBrowserStackSettings();
      loadRecordingEngine();
    }
  }, [workspacePath]);

  const loadBrowserStackSettings = async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.settings.getBrowserStack({ workspacePath });
      if (response.success && response.settings) {
        setBrowserstackSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load BrowserStack settings:', error);
    }
  };

  const handleSaveBrowserStack = async () => {
    if (!workspacePath) return;
    setLoading(true);
    try {
      const response = await ipc.settings.updateBrowserStack({ workspacePath, settings: browserstackSettings });
      if (response.success) {
        alert('BrowserStack settings have been saved successfully.');
      } else {
        alert(`Failed to save settings: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save settings'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    // Stub: just validate non-empty
    if (!browserstackSettings.username || !browserstackSettings.accessKey) {
      alert('Username and Access Key are required');
      setTestingConnection(false);
    } else {
      // Simulate connection test
      setTimeout(() => {
        alert('Connection test successful (stub)');
        setTestingConnection(false);
      }, 1000);
    }
  };

  const loadRecordingEngine = async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.settings.getRecordingEngine({ workspacePath });
      if (response.success && response.recordingEngine) {
        setRecordingEngine(response.recordingEngine);
      }
    } catch (error) {
      console.error('Failed to load recording engine setting:', error);
    }
  };

  const handleSaveRecordingEngine = async () => {
    if (!workspacePath) return;
    setSavingRecordingEngine(true);
    try {
      const response = await ipc.settings.updateRecordingEngine({ workspacePath, recordingEngine });
      if (response.success) {
        alert('Recording engine setting has been saved successfully.');
      } else {
        alert(`Failed to save setting: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save setting'}`);
    } finally {
      setSavingRecordingEngine(false);
    }
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Settings' },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        if (item.href) navigate(item.href);
      }}
    >
      {item.title}
    </Anchor>
  ));

  return (
    <div className="settings-screen">
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      <Card padding="lg" radius="md" withBorder style={{ maxWidth: 800, margin: '0 auto' }}>
        <Text size="xl" fw={600} mb="lg">Settings</Text>

        <Stack gap="md">
          {/* Recording Engine Settings */}
          <div>
            <Group gap="xs" mb="md">
              <Video size={20} />
              <Text size="lg" fw={600}>Recording Engine</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Choose which recording engine to use when creating new tests.
            </Text>

            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="xs">Recording Engine</Text>
                <SegmentedControl
                  value={recordingEngine}
                  onChange={(value) => setRecordingEngine(value as RecordingEngine)}
                  data={[
                    { 
                      label: 'QA Studio Recorder', 
                      value: 'qaStudio',
                      disabled: false,
                    },
                    { 
                      label: 'Playwright Codegen', 
                      value: 'playwright',
                      disabled: false,
                    },
                  ]}
                  fullWidth
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {recordingEngine === 'qaStudio' 
                    ? 'Captures structured steps, supports parameterization and D365-safe waits. Recommended for manual testers.'
                    : 'Uses native Playwright recorder for raw scripts and inspector. Recommended for power users.'}
                </Text>
              </div>
            </Stack>

            <Group gap="xs" mt="md">
              <Button
                leftSection={<Save size={16} />}
                onClick={handleSaveRecordingEngine}
                loading={savingRecordingEngine}
              >
                Save Setting
              </Button>
            </Group>
          </div>

          <Divider my="md" />

          {/* BrowserStack Settings */}
          <div>
            <Group gap="xs" mb="md">
              <Cloud size={20} />
              <Text size="lg" fw={600}>BrowserStack Configuration</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Configure BrowserStack credentials and defaults for cloud test execution.
            </Text>

            <Stack gap="md">
              <TextInput
                label="BrowserStack Username"
                placeholder="Enter your BrowserStack username"
                value={browserstackSettings.username}
                onChange={(e) => setBrowserstackSettings({ ...browserstackSettings, username: e.target.value })}
              />
              <TextInput
                label="BrowserStack Access Key"
                placeholder="Enter your BrowserStack access key"
                type="password"
                value={browserstackSettings.accessKey}
                onChange={(e) => setBrowserstackSettings({ ...browserstackSettings, accessKey: e.target.value })}
              />
              <TextInput
                label="Project (Optional)"
                placeholder="Project name"
                value={browserstackSettings.project}
                onChange={(e) => setBrowserstackSettings({ ...browserstackSettings, project: e.target.value })}
              />
              <TextInput
                label="Build Prefix (Optional)"
                placeholder="Build prefix"
                value={browserstackSettings.buildPrefix}
                onChange={(e) => setBrowserstackSettings({ ...browserstackSettings, buildPrefix: e.target.value })}
              />
            </Stack>

            <Group gap="xs" mt="md">
              <Button
                leftSection={<CheckCircle size={16} />}
                onClick={handleTestConnection}
                loading={testingConnection}
                variant="light"
              >
                Test Connection
              </Button>
              <Button
                leftSection={<Save size={16} />}
                onClick={handleSaveBrowserStack}
                loading={loading}
              >
                Save Settings
              </Button>
            </Group>
          </div>
        </Stack>
      </Card>
    </div>
  );
};

export default SettingsScreen;

