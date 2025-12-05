import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Activity,
  Search,
  Info,
  X,
} from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { RecordingEngine, WorkspaceMeta } from '../../../types/v1.5';
import LoginDialog from './LoginDialog';
import WebLoginDialog from './WebLoginDialog';
import CustomButton from './Button';
import Spinner from './Spinner';
import { notifications } from '../utils/notifications';
import { formatDate } from '../utils/formatDate';
import { Bug } from 'lucide-react';
import './SettingsScreen.css';

type StorageStateStatus = {
  status: 'valid' | 'missing' | 'invalid' | 'expired' | 'error';
  message: string;
  nextSteps: string[];
  storageStatePath: string;
  workspaceType?: string;
  details?: {
    exists: boolean;
    hasCookies: boolean;
    cookieCount: number;
    canAccessD365?: boolean;
    canAccessWeb?: boolean;
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
  const [browserstackTmSettings, setBrowserstackTmSettings] = useState({
    projectId: 'PR-25',
    suiteName: 'TestManagement For StudioAPP',
    apiToken: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingTmConnection, setTestingTmConnection] = useState(false);
  const [jiraSettings, setJiraSettings] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
    projectKey: '',
  });
  const [testingJiraConnection, setTestingJiraConnection] = useState(false);
  const [jiraConnectionStatus, setJiraConnectionStatus] = useState<{ success: boolean; projectName?: string; message?: string } | null>(null);
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
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Record<string, Date>>({});
  const originalValuesRef = useRef<Record<string, any>>({});
  const [playwrightStatus, setPlaywrightStatus] = useState<{
    cliAvailable?: boolean;
    browsersInstalled?: boolean;
    checking: boolean;
    lastError?: string;
    version?: string;
    runtimeType?: string;
  }>({
    checking: false,
  });

  const [runtimeHealth, setRuntimeHealth] = useState<{
    nodeVersion?: string;
    playwrightVersion?: string;
    browsers?: string[];
    runtimeType?: string;
    loading: boolean;
    error?: string;
  }>({
    loading: false,
  });

  useEffect(() => {
    if (workspacePath) {
      loadBrowserStackSettings();
      loadBrowserStackTmSettings();
      loadJiraSettings();
      loadRecordingEngine();
      loadWorkspaceStats();
      checkPlaywrightEnv();
      checkRuntimeHealth();
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

  const loadBrowserStackTmSettings = async () => {
    try {
      const response = await ipc.settings.getBrowserStackTmConfig();
      if (response.success && response.config) {
        setBrowserstackTmSettings({
          projectId: response.config.projectId || 'PR-25',
          suiteName: response.config.suiteName || 'TestManagement For StudioAPP',
          apiToken: response.config.apiToken || '',
        });
      }
    } catch (error) {
      console.error('Failed to load BrowserStack TM settings:', error);
    }
  };

  const handleSaveBrowserStackTm = async () => {
    setLoading(true);
    try {
      const response = await ipc.settings.updateBrowserStackTmConfig({
        projectId: browserstackTmSettings.projectId,
        suiteName: browserstackTmSettings.suiteName,
        apiToken: browserstackTmSettings.apiToken,
      });
      if (response.success) {
        alert('BrowserStack TM settings have been saved successfully.');
      } else {
        alert(`Failed to save settings: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTmConnection = async () => {
    setTestingTmConnection(true);
    try {
      const result = await ipc.browserstackTm.testConnection();
      if (result.success) {
        alert(`Connection successful! Connected to ${result.projectName || 'BrowserStack TM'}.`);
      } else {
        alert(`Connection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setTestingTmConnection(false);
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

  const loadJiraSettings = async () => {
    try {
      const response = await ipc.settings.getJiraConfig();
      if (response.success && response.config) {
        setJiraSettings({
          baseUrl: response.config.baseUrl || 'https://fourhands.atlassian.net',
          email: response.config.email || '',
          // Don't load API token for security; user can re-enter or leave blank to keep existing
          apiToken: '',
          projectKey: response.config.projectKey || 'QST',
        });
      } else {
        // Fallback if config is missing
        setJiraSettings({
          baseUrl: 'https://fourhands.atlassian.net',
          email: '',
          apiToken: '',
          projectKey: 'QST',
        });
      }
    } catch (error) {
      console.error('Failed to load Jira settings:', error);
      setJiraSettings(prev => ({
        ...prev,
        baseUrl: prev.baseUrl || 'https://fourhands.atlassian.net',
        apiToken: '••••••••••••••••••••••••••••••••',
        projectKey: prev.projectKey || 'QST',
      }));
    }
  };

  const handleSaveJira = async () => {
    if (!jiraSettings.baseUrl || !jiraSettings.email || !jiraSettings.projectKey) {
      alert('Base URL, Email, and Project Key are required');
      return;
    }
    setLoading(true);
    try {
      // Only send apiToken if user entered one; otherwise leave undefined to keep existing
      const apiTokenToSave = jiraSettings.apiToken && jiraSettings.apiToken.trim().length > 0
        ? jiraSettings.apiToken.trim()
        : undefined;

      const response = await ipc.settings.updateJiraConfig({
        baseUrl: jiraSettings.baseUrl,
        email: jiraSettings.email,
        apiToken: apiTokenToSave as any,
        projectKey: jiraSettings.projectKey,
      });
      if (response.success) {
        alert('Jira settings have been saved successfully.');
        setJiraConnectionStatus(null); // Reset connection status
      } else {
        alert(`Failed to save settings: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save settings'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestJiraConnection = async () => {
    if (!jiraSettings.baseUrl || !jiraSettings.email || !jiraSettings.projectKey) {
      alert('Please fill in Base URL, Email, and Project Key before testing connection');
      return;
    }
    setTestingJiraConnection(true);
    setJiraConnectionStatus(null);
    try {
      const result = await ipc.jira.testConnection();
      setJiraConnectionStatus({
        success: result.success,
        projectName: result.projectName,
        message: result.success ? `Connected to project: ${result.projectName}` : result.error || 'Connection failed',
      });
    } catch (error: any) {
      setJiraConnectionStatus({
        success: false,
        message: error.message || 'Failed to test connection',
      });
    } finally {
      setTestingJiraConnection(false);
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

  const checkPlaywrightEnv = async () => {
    if (!workspacePath) return;
    setPlaywrightStatus((prev) => ({ ...prev, checking: true, lastError: undefined }));
    try {
      const response = await ipc.playwright.checkEnv({ workspacePath });
      if (response.success) {
        setPlaywrightStatus({
          checking: false,
          cliAvailable: response.cliAvailable,
          browsersInstalled: response.browsersInstalled,
          lastError: response.error,
          version: response.details?.version,
          runtimeType: response.details?.runtimeType,
        });
      } else {
        setPlaywrightStatus({
          checking: false,
          cliAvailable: false,
          browsersInstalled: false,
          lastError: response.error || 'Failed to check Playwright environment',
        });
      }
    } catch (error: any) {
      setPlaywrightStatus({
        checking: false,
        cliAvailable: false,
        browsersInstalled: false,
        lastError: error.message || 'Failed to check Playwright environment',
      });
    }
  };

  const handleInstallPlaywright = async () => {
    if (!workspacePath) return;
    if (!confirm('Install or repair Playwright browsers? This may take a few minutes and requires internet access.')) {
      return;
    }
    setPlaywrightStatus((prev) => ({ ...prev, checking: true, lastError: undefined }));
    try {
      const response = await ipc.playwright.install({ workspacePath });
      if (response.success) {
        alert('Playwright installation completed successfully.');
        await checkPlaywrightEnv();
        await checkRuntimeHealth();
      } else {
        alert(`Playwright installation failed: ${response.error || 'Unknown error'}`);
        setPlaywrightStatus((prev) => ({
          ...prev,
          checking: false,
          lastError: response.error || 'Playwright installation failed',
        }));
      }
    } catch (error: any) {
      alert(`Error running Playwright install: ${error.message || 'Unknown error'}`);
      setPlaywrightStatus((prev) => ({
        ...prev,
        checking: false,
        lastError: error.message || 'Playwright installation failed',
      }));
    }
  };

  const checkRuntimeHealth = async () => {
    if (!workspacePath) return;
    setRuntimeHealth((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const response = await ipc.playwright.runtimeHealth({ workspacePath });
      if (response.success) {
        setRuntimeHealth({
          nodeVersion: response.nodeVersion,
          playwrightVersion: response.playwrightVersion,
          browsers: response.browsers,
          runtimeType: response.runtimeType,
          loading: false,
        });
      } else {
        setRuntimeHealth({
          loading: false,
          error: response.error || 'Failed to check runtime health',
        });
      }
    } catch (error: any) {
      setRuntimeHealth({
        loading: false,
        error: error.message || 'Failed to check runtime health',
      });
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
      // Add timeout handling (10s max)
      const timeoutPromise = new Promise<StorageStateStatus>((_, reject) => {
        setTimeout(() => reject(new Error('Check timed out')), 10000);
      });

      const workspaceType = currentWorkspace?.type;
      const checkPromise = electronAPI.checkStorageState(workspaceType, workspacePath);
      
      const status = await Promise.race([checkPromise, timeoutPromise]);
      setStorageStateStatus(status);
    } catch (error: any) {
      console.error('Failed to check storage state:', error);
      const isTimeout = error?.message?.includes('timed out');
      setStorageStateStatus({
        status: 'error',
        message: isTimeout 
          ? 'Check timed out after 10 seconds. The storage state file may be locked or inaccessible.'
          : 'Unable to read storage state status',
        nextSteps: isTimeout
          ? ['Click Retry to check again', 'If the issue persists, try re-authenticating']
          : ['Try refreshing the status or re-authenticate.'],
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
      const response = await ipc.workspaces.create({ name: name.trim() });
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

      <div className="glass-card" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content/70">Developer Mode</span>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={devMode}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  setDevMode(newValue);
                  setSavingDevMode(true);
                  try {
                    const response = await ipc.settings.updateDevMode({ devMode: newValue });
                    if (!response.success) {
                      notifications.show({
                        message: `Failed to save dev mode: ${response.error || 'Unknown error'}`,
                        color: 'error',
                      });
                      setDevMode(!newValue);
                    } else {
                      notifications.show({
                        message: 'Developer mode updated',
                        color: 'success',
                      });
                    }
                  } catch (error: any) {
                    notifications.show({
                      message: `Error: ${error.message || 'Failed to save dev mode'}`,
                      color: 'error',
                    });
                    setDevMode(!newValue);
                  } finally {
                    setSavingDevMode(false);
                  }
                }}
                disabled={savingDevMode}
              />
              {savingDevMode && <Spinner size="sm" />}
            </div>
          </div>

          {/* Settings Search */}
          <div className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search settings..."
                className="input input-bordered w-full pl-10 bg-base-100"
                value={settingsSearchQuery}
                onChange={(e) => setSettingsSearchQuery(e.target.value)}
              />
              {settingsSearchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
                  onClick={() => setSettingsSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Vertical Sidebar Layout */}
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {[
                  { id: 'authentication', label: 'Authentication', icon: ShieldCheck },
                  { id: 'workspace', label: 'Workspace', icon: Folder },
                  { id: 'recording', label: 'Recording', icon: Video },
                  { id: 'ai', label: 'AI Debugging', icon: ShieldCheck },
                  { id: 'browserstack', label: 'BrowserStack', icon: Cloud },
                  { id: 'jira', label: 'Jira', icon: Bug },
                  ...(devMode ? [{ id: 'developer', label: 'Developer', icon: CodeIcon }] : []),
                ]
                  .filter(tab => !settingsSearchQuery || tab.label.toLowerCase().includes(settingsSearchQuery.toLowerCase()))
                  .map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const hasUnsavedChanges = unsavedChanges.has(tab.id);
                    return (
                      <button
                        key={tab.id}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                          ${isActive
                            ? 'bg-[#4C6EF5] text-white border-l-4 border-[#4C6EF5]'
                            : 'text-base-content/70 hover:bg-base-300'
                          }
                        `.trim().replace(/\s+/g, ' ')}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon size={18} />
                        <span className="flex-1 font-medium">{tab.label}</span>
                        {hasUnsavedChanges && (
                          <span className="badge badge-warning badge-xs">Modified</span>
                        )}
                      </button>
                    );
                  })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onChange={setActiveTab}>

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
                      {storageStatusLoading 
                        ? 'Checking authentication status...'
                        : storageStateStatus?.message || 'Storage state status unavailable'}
                    </Text>
                    {storageStateStatus && !storageStatusLoading && (
                      <Text size="xs" c="dimmed" mt={4}>
                        Last checked: {formatDate(new Date().toISOString())}
                      </Text>
                    )}
                  </div>
                </Group>
                <div className="flex items-center gap-2">
                  {storageStatusLoading && <Spinner size="sm" />}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={refreshStorageStateStatus}
                    disabled={storageStatusLoading}
                    aria-label="Refresh storage state status"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </Group>

              {storageStateStatus?.details && (
                <Group gap="xl" mt="sm">
                  <Text size="sm">Cookies: {storageStateStatus.details.cookieCount}</Text>
                  {currentWorkspace?.type === 'web-demo' ? (
                    <Text size="sm">Can access Web: {storageStateStatus.details.canAccessWeb ? 'Yes' : 'No'}</Text>
                  ) : (
                    <Text size="sm">Can access D365: {storageStateStatus.details.canAccessD365 ? 'Yes' : 'No'}</Text>
                  )}
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

              {storageStateStatus?.status === 'error' && storageStateStatus.message?.includes('timed out') && (
                <div className="alert alert-warning mt-4">
                  <AlertTriangle size={16} />
                  <div>
                    <div className="font-medium">Check timed out</div>
                    <div className="text-sm">The storage state check took longer than 10 seconds.</div>
                  </div>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={refreshStorageStateStatus}
                    disabled={storageStatusLoading}
                  >
                    Retry
                  </button>
                </div>
              )}

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
                  {currentWorkspace?.type === 'web-demo' ? 'Login to FH Web' : 'Re-authenticate'}
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

            <Card padding="md" radius="md" withBorder mt="lg">
              <Group gap="xs" mb="md">
                <CodeIcon size={18} />
                <Text fw={500}>Playwright Environment</Text>
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                The Playwright CLI and browser binaries are required for both recording and running tests
                (including Playwright Codegen). Use these tools to verify and fix your environment on this machine.
              </Text>

              <Group justify="space-between" align="flex-start" mb="sm">
                <Stack gap={4}>
                  <Group gap="xs">
                    <Badge
                      color={playwrightStatus.cliAvailable ? 'green' : 'red'}
                      variant="light"
                    >
                      CLI {playwrightStatus.cliAvailable ? 'Available' : 'Missing'}
                    </Badge>
                    <Badge
                      color={playwrightStatus.browsersInstalled ? 'green' : 'orange'}
                      variant="light"
                    >
                      Browsers {playwrightStatus.browsersInstalled ? 'Installed' : 'Not detected'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {playwrightStatus.version
                      ? `Detected: ${playwrightStatus.version}`
                      : 'Version unknown (run Check environment)'}
                  </Text>
                  {playwrightStatus.runtimeType && (
                    <Text size="xs" c={playwrightStatus.runtimeType === 'bundled' ? 'green' : 'dimmed'}>
                      {playwrightStatus.runtimeType === 'bundled' 
                        ? '✓ Using bundled Playwright runtime (self-contained).'
                        : playwrightStatus.runtimeType === 'system'
                        ? 'Bundled runtime missing — falling back to system npx.'
                        : 'Playwright cannot run because your system command-line tools are restricted.'}
                    </Text>
                  )}
                  {playwrightStatus.lastError && (
                    <Text size="xs" c="red">
                      {playwrightStatus.lastError}
                    </Text>
                  )}
                </Stack>
                {playwrightStatus.checking && <Loader size="sm" />}
              </Group>

              <Group gap="xs">
                <Button
                  variant="light"
                  leftSection={<RefreshCw size={16} />}
                  onClick={checkPlaywrightEnv}
                  disabled={!workspacePath}
                  loading={playwrightStatus.checking}
                >
                  Check environment
                </Button>
                <Button
                  leftSection={<Wrench size={16} />}
                  onClick={handleInstallPlaywright}
                  disabled={!workspacePath || playwrightStatus.checking}
                >
                  Install / Repair Playwright
                </Button>
              </Group>
            </Card>

            {/* Runtime Health Section */}
            <Card 
              padding="md" 
              radius="md" 
              withBorder 
              mt="lg"
              style={{ backgroundColor: 'transparent' }}
            >
              <Group gap="xs" mb="md">
                <Activity size={18} />
                <Text fw={500}>Runtime Health</Text>
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                Detailed information about your runtime environment including Node.js, Playwright, and installed browsers.
              </Text>

              {runtimeHealth.loading ? (
                <Group justify="center" py="md">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">Checking runtime health...</Text>
                </Group>
              ) : runtimeHealth.error ? (
                <Text size="sm" c="red" py="md">
                  {runtimeHealth.error}
                </Text>
              ) : (
                <Stack gap="md">
                  <div className="runtime-health-grid">
                    <div className="runtime-health-item">
                      <Text size="xs" c="dimmed" mb={4}>Node.js Version</Text>
                      <Text size="sm" fw={500} c="white">
                        {runtimeHealth.nodeVersion || (
                          <Text component="span" c="dimmed" fs="italic">Not detected</Text>
                        )}
                      </Text>
                    </div>
                    <div className="runtime-health-item">
                      <Text size="xs" c="dimmed" mb={4}>Playwright Version</Text>
                      <Text size="sm" fw={500} c="white">
                        {runtimeHealth.playwrightVersion || (
                          <Text component="span" c="dimmed" fs="italic">Not detected</Text>
                        )}
                      </Text>
                    </div>
                    <div className="runtime-health-item">
                      <Text size="xs" c="dimmed" mb={4}>Runtime Type</Text>
                      <Badge
                        color={runtimeHealth.runtimeType === 'bundled' ? 'green' : runtimeHealth.runtimeType === 'system' ? 'blue' : 'gray'}
                        variant="light"
                      >
                        {runtimeHealth.runtimeType === 'bundled'
                          ? 'Bundled'
                          : runtimeHealth.runtimeType === 'system'
                          ? 'System'
                          : 'Unknown'}
                      </Badge>
                    </div>
                    <div className="runtime-health-item">
                      <Text size="xs" c="dimmed" mb={4}>Installed Browsers</Text>
                      {runtimeHealth.browsers && runtimeHealth.browsers.length > 0 ? (
                        <Group gap={4}>
                          {runtimeHealth.browsers.map((browser) => (
                            <Badge key={browser} color="green" variant="light" size="sm">
                              {browser}
                            </Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm" c="orange" fs="italic">No browsers detected</Text>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<RefreshCw size={14} />}
                    onClick={checkRuntimeHealth}
                    disabled={!workspacePath || runtimeHealth.loading}
                  >
                    Refresh Runtime Health
                  </Button>
                </Stack>
              )}
            </Card>
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

              <div>
                <Group gap="xs" mb="md" mt="xl">
                  <ListChecks size={20} />
                  <Text size="lg" fw={600}>BrowserStack Test Management</Text>
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                  Configure BrowserStack Test Management (TM) project and suite settings for test case synchronization.
                </Text>

                <Stack gap="md">
                  <TextInput
                    label="Project ID"
                    placeholder="PR-25"
                    value={browserstackTmSettings.projectId}
                    onChange={(e) => setBrowserstackTmSettings({ ...browserstackTmSettings, projectId: e.target.value })}
                    description="BrowserStack TM project identifier (e.g., PR-25)"
                  />
                  <TextInput
                    label="Suite Name"
                    placeholder="TestManagement For StudioAPP"
                    value={browserstackTmSettings.suiteName}
                    onChange={(e) => setBrowserstackTmSettings({ ...browserstackTmSettings, suiteName: e.target.value })}
                    description="Default suite name for test cases"
                  />
                  <TextInput
                    label="TM API Token (Optional)"
                    placeholder="username:accessKey or accessKey only"
                    type="password"
                    value={browserstackTmSettings.apiToken}
                    onChange={(e) => setBrowserstackTmSettings({ ...browserstackTmSettings, apiToken: e.target.value })}
                    description="Optional: Separate TM API token. Leave blank to use BrowserStack Automate credentials above. Format: 'username:accessKey' or just 'accessKey'."
                  />
                </Stack>

                <Group gap="xs" mt="md">
                  <Button
                    leftSection={<CheckCircle size={16} />}
                    onClick={handleTestTmConnection}
                    loading={testingTmConnection}
                    variant="light"
                  >
                    Test TM Connection
                  </Button>
                  <Button
                    leftSection={<Save size={16} />}
                    onClick={handleSaveBrowserStackTm}
                    loading={loading}
                  >
                    Save TM Settings
                  </Button>
                </Group>
              </div>
            </Stack>
          </Tabs.Panel>

          {/* Jira Settings Tab */}
          <Tabs.Panel value="jira" pt="md">
            <Stack gap="md">
              <div>
                <Group gap="xs" mb="md">
                  <Bug size={20} />
                  <Text size="lg" fw={600}>Jira Configuration</Text>
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                  Configure Jira credentials and project settings for defect creation and management.
                </Text>

                <Stack gap="md">
                  <TextInput
                    label="Jira Base URL"
                    placeholder="https://fourhands.atlassian.net"
                    value={jiraSettings.baseUrl}
                    onChange={(e) => setJiraSettings({ ...jiraSettings, baseUrl: e.target.value })}
                  />
                  <TextInput
                    label="Email"
                    placeholder="your-email@example.com"
                    value={jiraSettings.email}
                    onChange={(e) => setJiraSettings({ ...jiraSettings, email: e.target.value })}
                    required
                  />
                  <TextInput
                    label="API Token"
                    placeholder="Enter or paste your Jira API token"
                    type="password"
                    value={jiraSettings.apiToken}
                    onChange={(e) => setJiraSettings({ ...jiraSettings, apiToken: e.target.value })}
                    description="Leave blank to keep the existing token that was previously saved."
                  />
                  <TextInput
                    label="Project Key"
                    placeholder="QST"
                    value={jiraSettings.projectKey}
                    onChange={(e) => setJiraSettings({ ...jiraSettings, projectKey: e.target.value.toUpperCase() })}
                  />
                </Stack>

                {jiraConnectionStatus && (
                  <Alert
                    color={jiraConnectionStatus.success ? 'green' : 'red'}
                    icon={<CheckCircle size={16} />}
                    mt="md"
                  >
                    <Text size="sm">{jiraConnectionStatus.message}</Text>
                    {jiraConnectionStatus.success && jiraConnectionStatus.projectName && (
                      <Text size="xs" c="dimmed" mt={4}>
                        Connected to project: <strong>{jiraConnectionStatus.projectName}</strong>
                      </Text>
                    )}
                  </Alert>
                )}

                <Group gap="xs" mt="md">
                  <Button
                    leftSection={<CheckCircle size={16} />}
                    onClick={handleTestJiraConnection}
                    loading={testingJiraConnection}
                    variant="light"
                  >
                    Test Connection
                  </Button>
                  <Button
                    leftSection={<Save size={16} />}
                    onClick={handleSaveJira}
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
                        <Button
                          leftSection={<Activity size={16} />}
                          onClick={async () => {
                            if (!workspacePath) return;
                            try {
                              const response = await ipc.playwright.checkEnv({ workspacePath });
                              if (response.success) {
                                alert(`Playwright Status:\nCLI Available: ${response.cliAvailable ? 'Yes' : 'No'}\nBrowsers Installed: ${response.browsersInstalled ? 'Yes' : 'No'}\nVersion: ${response.details?.version || 'Unknown'}`);
                              } else {
                                alert(`Failed to check Playwright: ${response.error}`);
                              }
                            } catch (error: any) {
                              alert(`Error: ${error.message}`);
                            }
                          }}
                          variant="light"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Check Playwright Status
                        </Button>
                        <Button
                          leftSection={<RefreshCw size={16} />}
                          onClick={async () => {
                            if (!workspacePath) return;
                            if (!confirm('Install/Update Playwright browsers? This may take several minutes.')) return;
                            try {
                              const response = await ipc.playwright.install({ workspacePath });
                              if (response.success) {
                                alert('Playwright installation started. Check the log file for progress.');
                              } else {
                                alert(`Failed to install Playwright: ${response.error}`);
                              }
                            } catch (error: any) {
                              alert(`Error: ${error.message}`);
                            }
                          }}
                          variant="light"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Install/Update Playwright
                        </Button>
                      </Stack>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <Database size={20} />
                        <Text fw={500}>Cache & Storage</Text>
                      </Group>
                      <Stack gap="xs">
                        <Button
                          leftSection={<RefreshCw size={16} />}
                          onClick={async () => {
                            if (!workspacePath) return;
                            try {
                              const response = await ipc.dev.clearTempFiles({ workspacePath });
                              if (response.success) {
                                alert(`Cleared ${response.deletedCount || 0} temporary files.`);
                                refreshWorkspaceStats();
                              } else {
                                alert(`Failed to clear temp files: ${response.error}`);
                              }
                            } catch (error: any) {
                              alert(`Error: ${error.message}`);
                            }
                          }}
                          variant="light"
                          color="blue"
                          disabled={!workspacePath}
                          fullWidth
                        >
                          Clear Application Cache
                        </Button>
                        <Text size="xs" c="dimmed">
                          Clears temporary files and caches to free up space and resolve issues.
                        </Text>
                      </Stack>
                    </Card>

                    <Card padding="md" radius="md" withBorder>
                      <Group gap="xs" mb="md">
                        <CodeIcon size={20} />
                        <Text fw={500}>Debugging Tools</Text>
                      </Group>
                      <Stack gap="xs">
                        <Button
                          leftSection={<Eye size={16} />}
                          onClick={async () => {
                            try {
                              const response = await ipc.dev.getRawConfig();
                              if (response.success && response.config) {
                                const envInfo = {
                                  nodeVersion: process.versions.node,
                                  electronVersion: process.versions.electron,
                                  chromeVersion: process.versions.chrome,
                                  platform: process.platform,
                                  arch: process.arch,
                                  config: response.config,
                                };
                                const info = JSON.stringify(envInfo, null, 2);
                                navigator.clipboard.writeText(info);
                                alert('Environment info copied to clipboard!');
                              }
                            } catch (error: any) {
                              alert(`Error: ${error.message}`);
                            }
                          }}
                          variant="light"
                          fullWidth
                        >
                          Copy Environment Info
                        </Button>
                        <Button
                          leftSection={<FileX size={16} />}
                          onClick={() => {
                            if (confirm('Clear all browser cache and storage? This will log you out of D365.')) {
                              // Clear browser cache - this would require IPC call
                              alert('Browser cache clear functionality coming soon.');
                            }
                          }}
                          variant="light"
                          color="orange"
                          fullWidth
                        >
                          Clear Browser Cache
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
            </div>
          </div>
        </div>
      </div>

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

      {showAuthDialog && currentWorkspace?.type === 'web-demo' ? (
        <WebLoginDialog
          opened={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onLoginSuccess={() => {
            setShowAuthDialog(false);
            refreshStorageStateStatus();
            // Trigger storage state check in App.tsx to dismiss notification
            window.dispatchEvent(new CustomEvent('storage-state-updated'));
          }}
          webUrl={(currentWorkspace?.settings as { baseUrl?: string })?.baseUrl}
        />
      ) : showAuthDialog ? (
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
      ) : null}
    </div>
  );
};

export default SettingsScreen;

