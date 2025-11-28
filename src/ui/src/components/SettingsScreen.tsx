import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  TextInput,
  Stack,
  Breadcrumbs,
  Anchor,
  SegmentedControl,
  Badge,
  CopyButton,
  Tooltip,
  ActionIcon,
  Select,
  Loader,
  Tabs,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  Cloud,
  Video,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  LogIn,
  Folder,
  Copy,
  Check,
  Plus,
  ListChecks,
  Database,
  Clock4,
} from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { RecordingEngine, WorkspaceMeta } from '../../../types/v1.5';
import LoginDialog from './LoginDialog';
// Using simple alerts for now - can be replaced with Mantine notifications if provider is set up
import './SettingsScreen.css';

type StorageStateStatus = {
  status: 'valid' | 'missing' | 'invalid' | 'expired' | 'error';
  message: string;
  nextSteps: string[];
  storageStatePath: string;
  details?: {
    exists: boolean;
    hasCookies: boolean;
    cookieCount: number;
    canAccessD365: boolean;
  };
};

type WorkspaceStats = {
  testCount: number;
  datasetCount: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
};

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    workspacePath,
    setWorkspacePath,
    currentWorkspace,
    setCurrentWorkspace,
  } = useWorkspaceStore();
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
  const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats>({
    testCount: 0,
    datasetCount: 0,
    lastRunAt: null,
    lastRunStatus: null,
  });
  const [storageStateStatus, setStorageStateStatus] = useState<StorageStateStatus | null>(null);
  const [storageStatusLoading, setStorageStatusLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [aiConfig, setAiConfig] = useState<{
    provider?: 'openai' | 'deepseek' | 'custom';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }>({});
  const [savingAIConfig, setSavingAIConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('authentication');

  useEffect(() => {
    if (workspacePath) {
      loadBrowserStackSettings();
      loadRecordingEngine();
      loadWorkspaceStats();
    }
    loadAIConfig();
  }, [workspacePath]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    refreshStorageStateStatus();
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

  const loadAIConfig = async () => {
    try {
      const response = await ipc.settings.getAIConfig();
      if (response.success && response.config) {
        setAiConfig(response.config);
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  };

  const handleSaveAIConfig = async () => {
    setSavingAIConfig(true);
    try {
      const response = await ipc.settings.updateAIConfig(aiConfig);
      if (response.success) {
        alert('AI configuration has been saved successfully.');
      } else {
        alert(`Failed to save AI config: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save AI config'}`);
    } finally {
      setSavingAIConfig(false);
    }
  };

  const handleProviderChange = (provider: 'openai' | 'deepseek' | 'custom') => {
    const newConfig = { ...aiConfig, provider };
    
    // Update model and base URL if they match the old provider's defaults
    if (provider === 'openai') {
      // Only update if current values match DeepSeek defaults
      if (aiConfig.model === 'deepseek-chat' || !aiConfig.model) {
        newConfig.model = 'gpt-4o';
      }
      if (aiConfig.baseUrl === 'https://api.deepseek.com/v1' || !aiConfig.baseUrl) {
        newConfig.baseUrl = 'https://api.openai.com/v1';
      }
    } else if (provider === 'deepseek') {
      // Only update if current values match OpenAI defaults
      if (aiConfig.model === 'gpt-4o' || !aiConfig.model) {
        newConfig.model = 'deepseek-chat';
      }
      if (aiConfig.baseUrl === 'https://api.openai.com/v1' || !aiConfig.baseUrl) {
        newConfig.baseUrl = 'https://api.deepseek.com/v1';
      }
    } else if (provider === 'custom') {
      // Clear defaults for custom
      if (aiConfig.model === 'gpt-4o' || aiConfig.model === 'deepseek-chat') {
        newConfig.model = '';
      }
      if (aiConfig.baseUrl === 'https://api.openai.com/v1' || aiConfig.baseUrl === 'https://api.deepseek.com/v1') {
        newConfig.baseUrl = '';
      }
    }
    
    setAiConfig(newConfig);
  };

  const refreshStorageStateStatus = async () => {
    const electronAPI = (window as typeof window & { electronAPI?: any }).electronAPI;
    if (!electronAPI?.checkStorageState) {
      setStorageStateStatus(null);
      return;
    }

    setStorageStatusLoading(true);
    try {
      const status = await electronAPI.checkStorageState();
      setStorageStateStatus(status);
    } catch (error) {
      console.error('Failed to check storage state:', error);
      setStorageStateStatus({
        status: 'error',
        message: 'Unable to read storage state status',
        nextSteps: ['Try refreshing the status or re-authenticate.'],
        storageStatePath: '',
      });
    } finally {
      setStorageStatusLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const response = await ipc.workspaces.list();
      if (response.success && response.workspaces) {
        setWorkspaces(response.workspaces);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const loadWorkspaceStats = async (pathOverride?: string) => {
    const targetPath = pathOverride || workspacePath;
    if (!targetPath) return;
    try {
      const [testsResponse, runsResponse] = await Promise.all([
        ipc.workspace.testsList({ workspacePath: targetPath }),
        ipc.runs.list({ workspacePath: targetPath }),
      ]);

      const tests = testsResponse.success && testsResponse.tests ? testsResponse.tests : [];
      const datasetCount = tests.reduce((sum, test) => sum + (test.datasetCount || 0), 0);

      let lastRunAt: string | null = null;
      let lastRunStatus: string | null = null;

      if (runsResponse.success && runsResponse.runs && runsResponse.runs.length > 0) {
        const sortedRuns = [...runsResponse.runs].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        lastRunAt = sortedRuns[0].startedAt;
        lastRunStatus = sortedRuns[0].status;
      }

      setWorkspaceStats({
        testCount: tests.length,
        datasetCount,
        lastRunAt,
        lastRunStatus,
      });
    } catch (error) {
      console.error('Failed to load workspace stats:', error);
    }
  };

  const handleWorkspaceChange = async (workspaceId: string | null) => {
    if (!workspaceId) return;
    setSwitchingWorkspace(true);
    try {
      const response = await ipc.workspaces.setCurrent(workspaceId);
      if (response.success && response.workspace) {
        setCurrentWorkspace(response.workspace);
        setWorkspacePath(response.workspace.workspacePath);
        await Promise.all([
          loadWorkspaceStats(response.workspace.workspacePath),
          refreshStorageStateStatus(),
        ]);
        alert(`Switched to workspace "${response.workspace.name}"`);
      } else {
        alert(response.error || 'Failed to switch workspace');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to switch workspace');
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  const handleCreateWorkspace = async () => {
    const name = window.prompt('Enter a name for the new workspace:');
    if (!name || !name.trim()) {
      return;
    }
    try {
      const response = await ipc.workspaces.create(name.trim());
      if (response.success && response.workspace) {
        await loadWorkspaces();
        await handleWorkspaceChange(response.workspace.id);
      } else {
        alert(response.error || 'Failed to create workspace');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create workspace');
    }
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const storageStatusIcon =
    storageStateStatus?.status === 'valid' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />;
  const storageStatusColor =
    storageStateStatus?.status === 'valid'
      ? 'green'
      : storageStateStatus?.status === 'error'
        ? 'gray'
        : 'orange';

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

      <Card padding="lg" radius="md" withBorder style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Text size="xl" fw={600} mb="lg">Settings</Text>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="authentication">Authentication</Tabs.Tab>
            <Tabs.Tab value="workspace">Workspace</Tabs.Tab>
            <Tabs.Tab value="recording">Recording</Tabs.Tab>
            <Tabs.Tab value="ai">AI Debugging</Tabs.Tab>
            <Tabs.Tab value="browserstack">BrowserStack</Tabs.Tab>
          </Tabs.List>

          {/* Authentication & Storage State Tab */}
          <Tabs.Panel value="authentication" pt="md">
            <Stack gap="md">
              <div>
            <Group gap="xs" mb="md">
              <ShieldCheck size={20} />
              <Text size="lg" fw={600}>Authentication & Storage State</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Make sure your saved login is valid before recording or running tests.
            </Text>

            <Card padding="md" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <Group gap="sm">
                  <Badge color={storageStatusColor} variant="light" size="lg">
                    {storageStateStatus?.status.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                  <div>
                    <Group gap={4}>
                      {storageStatusIcon}
                      <Text fw={600}>Storage state</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {storageStateStatus?.message || 'Storage state status unavailable'}
                    </Text>
                  </div>
                </Group>
                {storageStatusLoading && <Loader size="sm" />}
              </Group>

              {storageStateStatus?.details && (
                <Group gap="xl" mt="sm">
                  <Text size="sm">Cookies: {storageStateStatus.details.cookieCount}</Text>
                  <Text size="sm">Can access D365: {storageStateStatus.details.canAccessD365 ? 'Yes' : 'No'}</Text>
                </Group>
              )}

              {storageStateStatus?.storageStatePath && (
                <Text size="xs" mt="sm" c="dimmed">
                  Path: {storageStateStatus.storageStatePath}
                </Text>
              )}

              {storageStateStatus?.nextSteps?.length ? (
                <Stack gap={4} mt="sm">
                  <Text size="sm" fw={500}>Next steps</Text>
                  <ul className="settings-status-steps">
                    {storageStateStatus.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </Stack>
              ) : null}

              <Group gap="xs" mt="md">
                <Button
                  leftSection={<RefreshCw size={16} />}
                  onClick={refreshStorageStateStatus}
                  loading={storageStatusLoading}
                  variant="light"
                >
                  Refresh status
                </Button>
                <Button
                  leftSection={<LogIn size={16} />}
                  color="orange"
                  variant="outline"
                  onClick={() => setShowAuthDialog(true)}
                >
                  Re-authenticate
                </Button>
              </Group>
            </Card>
          </div>
            </Stack>
          </Tabs.Panel>

          {/* Workspace Settings Tab */}
          <Tabs.Panel value="workspace" pt="md">
            <Stack gap="md">
              <div>
            <Group gap="xs" mb="md">
              <Folder size={20} />
              <Text size="lg" fw={600}>Workspace</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Review the current project directory and switch to another workspace if needed.
            </Text>

            <Stack gap="md">
              <Select
                label="Active workspace"
                placeholder={loadingWorkspaces ? 'Loading workspaces...' : 'Select workspace'}
                data={workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: `${workspace.name} (${workspace.type.toUpperCase()})`,
                }))}
                value={currentWorkspace?.id || null}
                onChange={handleWorkspaceChange}
                searchable
                disabled={loadingWorkspaces || switchingWorkspace}
              />

              <TextInput
                label="Workspace path"
                value={currentWorkspace?.workspacePath || workspacePath || ''}
                readOnly
                rightSection={
                  <CopyButton value={currentWorkspace?.workspacePath || workspacePath || ''} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'} position="top" withArrow>
                        <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                }
              />

              <Group gap="xs">
                <Button
                  variant="light"
                  leftSection={<Plus size={16} />}
                  onClick={handleCreateWorkspace}
                >
                  Create workspace
                </Button>
              </Group>

              <div className="settings-stats-grid">
                <div className="settings-stat-card">
                  <Group gap={4}>
                    <ListChecks size={16} />
                    <Text className="settings-stat-label">Tests</Text>
                  </Group>
                  <Text className="settings-stat-value">{workspaceStats.testCount}</Text>
                </div>
                <div className="settings-stat-card">
                  <Group gap={4}>
                    <Database size={16} />
                    <Text className="settings-stat-label">Datasets</Text>
                  </Group>
                  <Text className="settings-stat-value">{workspaceStats.datasetCount}</Text>
                </div>
                <div className="settings-stat-card">
                  <Group gap={4}>
                    <Clock4 size={16} />
                    <Text className="settings-stat-label">Last run</Text>
                  </Group>
                  <Text className="settings-stat-value">{formatDateTime(workspaceStats.lastRunAt)}</Text>
                  {workspaceStats.lastRunStatus && (
                    <Badge
                      mt="xs"
                      variant="light"
                      color={
                        workspaceStats.lastRunStatus === 'passed'
                          ? 'green'
                          : workspaceStats.lastRunStatus === 'failed'
                            ? 'red'
                            : 'gray'
                      }
                    >
                      {workspaceStats.lastRunStatus.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </Stack>
          </div>
            </Stack>
          </Tabs.Panel>

          {/* Recording Engine Settings Tab */}
          <Tabs.Panel value="recording" pt="md">
            <Stack gap="md">
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
            </Stack>
          </Tabs.Panel>

          {/* AI Debugging Assistant Tab */}
          <Tabs.Panel value="ai" pt="md">
            <Stack gap="md">
              <div>
            <Group gap="xs" mb="md">
              <ShieldCheck size={20} />
              <Text size="lg" fw={600}>AI Debugging Assistant</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Configure the LLM provider for AI-powered test debugging and analysis.
            </Text>

            <Stack gap="md">
              <Select
                label="Provider"
                placeholder="Select AI provider"
                data={[
                  { value: 'openai', label: 'OpenAI' },
                  { value: 'deepseek', label: 'DeepSeek' },
                  { value: 'custom', label: 'Custom' },
                ]}
                value={aiConfig.provider || null}
                onChange={(value) => handleProviderChange(value as 'openai' | 'deepseek' | 'custom')}
              />
              <TextInput
                label="API Key"
                placeholder="Enter your API key"
                type="password"
                value={aiConfig.apiKey || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
              />
              <TextInput
                label="Model Name"
                placeholder={
                  aiConfig.provider === 'openai' 
                    ? 'gpt-4o' 
                    : aiConfig.provider === 'deepseek' 
                    ? 'deepseek-chat' 
                    : 'Enter model name'
                }
                value={aiConfig.model || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                description={
                  aiConfig.provider === 'openai' 
                    ? 'Default: gpt-4o' 
                    : aiConfig.provider === 'deepseek' 
                    ? 'Default: deepseek-chat' 
                    : 'Enter the model name for your custom provider'
                }
              />
              <TextInput
                label="Base URL (Optional)"
                placeholder={
                  aiConfig.provider === 'openai' 
                    ? 'https://api.openai.com/v1' 
                    : aiConfig.provider === 'deepseek' 
                    ? 'https://api.deepseek.com/v1' 
                    : 'https://api.example.com/v1'
                }
                value={aiConfig.baseUrl || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                description="Base URL for the API endpoint. Useful for DeepSeek, local LLMs, or custom providers."
              />
            </Stack>

            <Group gap="xs" mt="md">
              <Button
                leftSection={<Save size={16} />}
                onClick={handleSaveAIConfig}
                loading={savingAIConfig}
              >
                Save Settings
              </Button>
            </Group>
          </div>
            </Stack>
          </Tabs.Panel>

          {/* BrowserStack Settings Tab */}
          <Tabs.Panel value="browserstack" pt="md">
            <Stack gap="md">
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
          </Tabs.Panel>
        </Tabs>
      </Card>

      {showAuthDialog && (
        <LoginDialog
          onLoginSuccess={() => {
            setShowAuthDialog(false);
            refreshStorageStateStatus();
          }}
          onSkip={() => setShowAuthDialog(false)}
        />
      )}
    </div>
  );
};

export default SettingsScreen;

