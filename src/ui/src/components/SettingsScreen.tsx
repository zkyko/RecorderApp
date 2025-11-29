import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  Modal,
  Alert,
  ScrollArea,
  Code,
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
  Code as CodeIcon,
  Trash2,
  AlertTriangle,
  FolderOpen,
  FileX,
  BarChart3,
  Wrench,
  Eye,
  Key,
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
  const [devMode, setDevMode] = useState(false);
  const [savingDevMode, setSavingDevMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(false);
  const [devWorkspaceStats, setDevWorkspaceStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [rawConfig, setRawConfig] = useState<any>(null);

  useEffect(() => {
    if (workspacePath) {
      loadBrowserStackSettings();
      loadRecordingEngine();
      loadWorkspaceStats();
    }
    loadAIConfig();
    loadDevMode();
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

  const loadDevMode = async () => {
    try {
      const response = await ipc.settings.getDevMode();
      if (response.success) {
        setDevMode(response.devMode || false);
      }
    } catch (error) {
      console.error('Failed to load dev mode:', error);
    }
  };

  const handleSaveDevMode = async () => {
    setSavingDevMode(true);
    try {
      const response = await ipc.settings.updateDevMode({ devMode });
      if (response.success) {
        alert('Dev mode setting has been saved successfully.');
      } else {
        alert(`Failed to save setting: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save setting'}`);
    } finally {
      setSavingDevMode(false);
    }
  };

  const refreshWorkspaceStats = useCallback(async () => {
    if (!workspacePath) return;
    setLoadingStats(true);
    try {
      const response = await ipc.dev.getWorkspaceStats({ workspacePath });
      if (response.success && response.stats) {
        setDevWorkspaceStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load workspace stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [workspacePath]);

  const handleDeleteFiles = async () => {
    if (!workspacePath) {
      alert('No workspace path available');
      return;
    }

    setDeletingFiles(true);
    try {
      const response = await ipc.workspaces.deleteFiles({ workspacePath });
      if (response.success) {
        alert('Workspace files have been deleted successfully. The directory structure has been recreated.');
        setShowDeleteConfirm(false);
        // Reload workspace stats
        loadWorkspaceStats();
        refreshWorkspaceStats();
      } else {
        alert(`Failed to delete files: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to delete files'}`);
    } finally {
      setDeletingFiles(false);
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      const response = await ipc.dev.openFolder({ path: folderPath });
      if (!response.success) {
        alert(`Failed to open folder: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to open folder'}`);
    }
  };

  const handleClearTempFiles = async () => {
    if (!workspacePath) return;
    if (!confirm('Clear all temporary files in the tmp/ directory?')) return;
    try {
      const response = await ipc.dev.clearTempFiles({ workspacePath });
      if (response.success) {
        alert(`Cleared ${response.deletedCount || 0} temporary file(s).`);
        refreshWorkspaceStats();
      } else {
        alert(`Failed to clear temp files: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to clear temp files'}`);
    }
  };

  const handleClearOldTraces = async () => {
    if (!workspacePath) return;
    const daysToKeep = prompt('Keep traces from the last N days (default: 7):', '7');
    if (daysToKeep === null) return;
    const days = parseInt(daysToKeep) || 7;
    if (!confirm(`Delete traces older than ${days} days?`)) return;
    try {
      const response = await ipc.dev.clearOldTraces({ workspacePath, daysToKeep: days });
      if (response.success) {
        alert(`Cleared ${response.deletedCount || 0} old trace(s).`);
        refreshWorkspaceStats();
      } else {
        alert(`Failed to clear old traces: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to clear old traces'}`);
    }
  };

  const handleClearOldReports = async () => {
    if (!workspacePath) return;
    const daysToKeep = prompt('Keep reports from the last N days (default: 7):', '7');
    if (daysToKeep === null) return;
    const days = parseInt(daysToKeep) || 7;
    if (!confirm(`Delete reports older than ${days} days?`)) return;
    try {
      const response = await ipc.dev.clearOldReports({ workspacePath, daysToKeep: days });
      if (response.success) {
        alert(`Cleared ${response.deletedCount || 0} old report(s).`);
        refreshWorkspaceStats();
      } else {
        alert(`Failed to clear old reports: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to clear old reports'}`);
    }
  };

  const handleRebuildWorkspaceStructure = async () => {
    if (!workspacePath) return;
    if (!confirm('Rebuild workspace directory structure? This will create any missing directories.')) return;
    try {
      const response = await ipc.dev.rebuildWorkspaceStructure({ workspacePath });
      if (response.success) {
        alert('Workspace structure rebuilt successfully.');
        refreshWorkspaceStats();
      } else {
        alert(`Failed to rebuild structure: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to rebuild structure'}`);
    }
  };

  const handleViewRawConfig = async () => {
    try {
      const response = await ipc.dev.getRawConfig();
      if (response.success && response.config) {
        setRawConfig(response.config);
        setShowConfigModal(true);
      } else {
        alert(`Failed to load config: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to load config'}`);
    }
  };

  const handleOpenStorageStateLocation = async () => {
    try {
      const response = await ipc.dev.getStorageStatePath();
      if (response.success && response.path) {
        // Extract directory from path (remove filename)
        const dirPath = response.path.substring(0, response.path.lastIndexOf('\\') || response.path.lastIndexOf('/'));
        await handleOpenFolder(dirPath);
      } else {
        alert(`Failed to get storage state path: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to get storage state path'}`);
    }
  };

  useEffect(() => {
    if (devMode && workspacePath) {
      refreshWorkspaceStats();
    } else {
      // Clear stats when dev mode is disabled
      setDevWorkspaceStats(null);
    }
  }, [devMode, workspacePath, refreshWorkspaceStats]);

  // Switch away from Developer tab if dev mode is disabled
  useEffect(() => {
    if (!devMode && activeTab === 'developer') {
      setActiveTab('authentication');
    }
  }, [devMode, activeTab]);

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
        <Group justify="space-between" mb="lg">
          <Text size="xl" fw={600}>Settings</Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Developer Mode</Text>
            <Switch
              checked={devMode}
              onChange={async (e) => {
                const newValue = e.currentTarget.checked;
                setDevMode(newValue);
                setSavingDevMode(true);
                try {
                  const response = await ipc.settings.updateDevMode({ devMode: newValue });
                  if (!response.success) {
                    alert(`Failed to save dev mode: ${response.error || 'Unknown error'}`);
                    setDevMode(!newValue); // Revert on error
                  }
                } catch (error: any) {
                  alert(`Error: ${error.message || 'Failed to save dev mode'}`);
                  setDevMode(!newValue); // Revert on error
                } finally {
                  setSavingDevMode(false);
                }
              }}
              disabled={savingDevMode}
            />
            {savingDevMode && <Loader size="xs" />}
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="authentication">Authentication</Tabs.Tab>
            <Tabs.Tab value="workspace">Workspace</Tabs.Tab>
            <Tabs.Tab value="recording">Recording</Tabs.Tab>
            <Tabs.Tab value="ai">AI Debugging</Tabs.Tab>
            <Tabs.Tab value="browserstack">BrowserStack</Tabs.Tab>
            {devMode && <Tabs.Tab value="developer" leftSection={<CodeIcon size={16} />}>Developer</Tabs.Tab>}
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

          {/* Developer Tab (only shown when dev mode is enabled) */}
          {devMode && (
            <Tabs.Panel value="developer" pt="md">
              <Stack gap="md">
                <div>
                  <Group gap="xs" mb="md">
                    <CodeIcon size={20} />
                    <Text size="lg" fw={600}>Developer Mode</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="md">
                    Advanced controls for developers. Use with caution.
                  </Text>

                  <Stack gap="md">
                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <CodeIcon size={20} />
                        <Text fw={500}>Developer Mode</Text>
                      </Group>
                      <Text size="sm" c="dimmed" mb="md">
                        Developer mode is currently enabled. Additional developer controls are available in this tab.
                        You can toggle developer mode from the top of the Settings page.
                      </Text>
                      <Button
                        leftSection={<Save size={16} />}
                        onClick={handleSaveDevMode}
                        loading={savingDevMode}
                        size="sm"
                      >
                        Save Dev Mode Setting
                      </Button>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <BarChart3 size={20} />
                        <Text fw={500}>Workspace Statistics</Text>
                      </Group>
                      {loadingStats ? (
                        <Loader size="sm" />
                      ) : devWorkspaceStats ? (
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm">Total Files:</Text>
                            <Text fw={500}>{devWorkspaceStats.total.count.toLocaleString()}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm">Total Size:</Text>
                            <Text fw={500}>{(devWorkspaceStats.total.size / 1024 / 1024).toFixed(2)} MB</Text>
                          </Group>
                          <Text size="xs" c="dimmed" mt="xs">Breakdown by directory:</Text>
                          {['tests', 'data', 'traces', 'runs', 'reports', 'tmp'].map((dir) => (
                            <Group key={dir} justify="space-between" pl="md">
                              <Text size="xs">{dir}/</Text>
                              <Group gap="md">
                                <Text size="xs">{devWorkspaceStats[dir]?.count || 0} files</Text>
                                <Text size="xs" c="dimmed">
                                  {devWorkspaceStats[dir]?.size ? ((devWorkspaceStats[dir].size / 1024).toFixed(1) + ' KB') : '0 KB'}
                                </Text>
                              </Group>
                            </Group>
                          ))}
                          <Button
                            leftSection={<RefreshCw size={16} />}
                            onClick={refreshWorkspaceStats}
                            variant="light"
                            size="xs"
                            mt="xs"
                          >
                            Refresh
                          </Button>
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">Click refresh to load statistics</Text>
                      )}
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <FolderOpen size={20} />
                        <Text fw={500}>Quick Access</Text>
                      </Group>
                      <Stack gap="xs">
                        <Button
                          leftSection={<FolderOpen size={16} />}
                          onClick={() => workspacePath && handleOpenFolder(workspacePath)}
                          variant="light"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Open Workspace Folder
                        </Button>
                        <Button
                          leftSection={<Key size={16} />}
                          onClick={handleOpenStorageStateLocation}
                          variant="light"
                          fullWidth
                        >
                          Open Storage State Location
                        </Button>
                      </Stack>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <FileX size={20} />
                        <Text fw={500}>Cleanup Tools</Text>
                      </Group>
                      <Stack gap="xs">
                        <Button
                          leftSection={<FileX size={16} />}
                          onClick={handleClearTempFiles}
                          variant="light"
                          color="orange"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Clear Temp Files
                        </Button>
                        <Button
                          leftSection={<FileX size={16} />}
                          onClick={handleClearOldTraces}
                          variant="light"
                          color="orange"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Clear Old Traces
                        </Button>
                        <Button
                          leftSection={<FileX size={16} />}
                          onClick={handleClearOldReports}
                          variant="light"
                          color="orange"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Clear Old Reports
                        </Button>
                      </Stack>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <Wrench size={20} />
                        <Text fw={500}>Workspace Tools</Text>
                      </Group>
                      <Stack gap="xs">
                        <Button
                          leftSection={<Wrench size={16} />}
                          onClick={handleRebuildWorkspaceStructure}
                          variant="light"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Rebuild Workspace Structure
                        </Button>
                        <Button
                          leftSection={<Eye size={16} />}
                          onClick={handleViewRawConfig}
                          variant="light"
                          fullWidth
                        >
                          View Raw Config JSON
                        </Button>
                      </Stack>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <Trash2 size={20} />
                        <Text fw={500}>Delete Workspace Files</Text>
                      </Group>
                      <Text size="sm" c="dimmed" mb="md">
                        Permanently delete all files in the workspace including tests, data, traces, reports, and runs.
                        This action cannot be undone. The directory structure will be recreated empty.
                      </Text>
                      <Alert icon={<AlertTriangle size={16} />} title="Warning" color="red" mb="md">
                        This will delete:
                        <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                          <li>All test files in the <code>tests/</code> folder</li>
                          <li>All data files in the <code>data/</code> folder</li>
                          <li>All traces in the <code>traces/</code> folder</li>
                          <li>All run history in the <code>runs/</code> folder</li>
                          <li>All reports in the <code>reports/</code> folder</li>
                          <li>All temporary files in the <code>tmp/</code> folder</li>
                        </ul>
                      </Alert>
                      <Button
                        leftSection={<Trash2 size={16} />}
                        onClick={() => setShowDeleteConfirm(true)}
                        color="red"
                        variant="outline"
                        disabled={!workspacePath}
                      >
                        Delete All Workspace Files
                      </Button>
                    </Card>
                  </Stack>
                </div>
              </Stack>
            </Tabs.Panel>
          )}
        </Tabs>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Deletion"
        centered
      >
        <Stack gap="md">
          <Alert icon={<AlertTriangle size={16} />} title="This action cannot be undone!" color="red">
            You are about to permanently delete all files in the workspace. This includes:
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              <li>All test files</li>
              <li>All data files</li>
              <li>All traces and run history</li>
              <li>All reports</li>
            </ul>
          </Alert>
          <Text size="sm" c="dimmed">
            Workspace path: <code>{workspacePath}</code>
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setShowDeleteConfirm(false)} disabled={deletingFiles}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteFiles}
              loading={deletingFiles}
              leftSection={<Trash2 size={16} />}
            >
              Delete All Files
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Raw Config Modal */}
      <Modal
        opened={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Raw Configuration JSON"
        size="xl"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Current application configuration:
          </Text>
          <ScrollArea h={400}>
            <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {rawConfig ? JSON.stringify(rawConfig, null, 2) : 'Loading...'}
            </Code>
          </ScrollArea>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowConfigModal(false)}>
              Close
            </Button>
            <CopyButton value={rawConfig ? JSON.stringify(rawConfig, null, 2) : ''}>
              {({ copied, copy }) => (
                <Button leftSection={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Modal>

      {showAuthDialog && (
        <LoginDialog
          forceShow={true}
          onLoginSuccess={() => {
            setShowAuthDialog(false);
            refreshStorageStateStatus();
            // Trigger storage state check in App.tsx to dismiss notification
            window.dispatchEvent(new CustomEvent('storage-state-updated'));
          }}
          onSkip={() => setShowAuthDialog(false)}
        />
      )}
    </div>
  );
};

export default SettingsScreen;

