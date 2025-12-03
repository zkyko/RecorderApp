import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AlertTriangle } from 'lucide-react';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import TestLibrary from './components/TestLibrary';
import TestDetailsScreen from './components/TestDetailsScreen';
import LocatorsScreen from './components/LocatorsScreen';
import RecordScreen from './components/RecordScreen';
import LocatorCleanupScreen from './components/LocatorCleanupScreen';
import StepEditorScreen from './components/StepEditorScreen';
import ParameterMappingScreen from './components/ParameterMappingScreen';
import DataEditorScreen from './components/DataEditorScreen';
import RunScreen from './components/RunScreen';
import RunsScreen from './components/RunsScreen';
import TraceViewerScreen from './components/TraceViewerScreen';
import ReportViewerScreen from './components/ReportViewerScreen';
import ReportDashboard from './components/ReportDashboard';
import SettingsScreen from './components/SettingsScreen';
import SetupScreen from './components/SetupScreen';
import LoginDialog from './components/LoginDialog';
import MarketplaceScreen from './components/MarketplaceScreen';
import BrowserStackTMScreen from './components/BrowserStackTMScreen';
import JiraScreen from './components/JiraScreen';
import DiagnosticsScreen from './components/DiagnosticsScreen';
import { useWorkspaceStore } from './store/workspace-store';
import { ipc } from './ipc';
import { getBackend } from './ipc-backend';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const {
    workspacePath,
    setWorkspacePath,
    currentWorkspace,
    setCurrentWorkspace,
    isSwitchingWorkspace,
    switchingToName,
  } = useWorkspaceStore();
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const expiredNotificationShown = useRef(false);
  const storageStateCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const debugLogsRef = useRef<string[]>([]);
  const lastRenderStateRef = useRef<string>('');

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    // Only store in ref - no state updates to avoid infinite loops
    debugLogsRef.current = [...debugLogsRef.current.slice(-9), logMessage]; // Keep last 10 logs
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return 'unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  useEffect(() => {
    addDebugLog('AppContent mounted');
    const backend = getBackend();
    addDebugLog(`Backend available: ${!!backend}`);
    loadCurrentWorkspace();
    
    // Set up auto-updater listeners
    if (backend) {
      ipc.updater.onEvent((event, data) => {
        switch (event) {
          case 'checking':
            // Silent - just checking
            break;
          case 'available': {
            const sizeLabel = data?.sizeBytes ? ` (~${formatBytes(data.sizeBytes)})` : '';
            notifications.show({
              id: 'update-available',
              title: 'Update Available',
              message: `Version ${data?.version} is available${sizeLabel}. Click to download.`,
              color: 'blue',
              autoClose: false,
              onClick: () => {
                ipc.updater.download();
                notifications.show({
                  id: 'update-downloading',
                  title: 'Downloading Update',
                  message: 'Preparing download...',
                  color: 'blue',
                  autoClose: false,
                });
              },
            });
            break;
          }
          case 'download-progress': {
            const percent = data?.percent ?? 0;
            const transferred = data?.transferred ? formatBytes(data.transferred) : '';
            const total = data?.total ? formatBytes(data.total) : '';
            const sizePart =
              transferred && total ? ` (${transferred} of ${total})` : '';
            notifications.update({
              id: 'update-downloading',
              title: 'Downloading Update',
              message: `Downloading update... ${percent}%${sizePart}`,
              color: 'blue',
              autoClose: false,
            });
            break;
          }
          case 'downloaded':
            notifications.show({
              id: 'update-downloaded',
              title: 'Update Ready',
              message: 'Update downloaded. Restart to install?',
              color: 'green',
              autoClose: false,
              onClick: () => {
                ipc.updater.install();
              },
            });
            break;
          case 'error':
            notifications.show({
              id: 'update-error',
              title: 'Update Error',
              message: data?.message || 'Failed to check for updates',
              color: 'red',
              autoClose: 5000,
            });
            break;
        }
      });
      
      return () => {
        ipc.updater.removeListeners();
      };
    }
  }, []);

  const checkStorageStateStatus = useCallback(async () => {
    const backend = getBackend();
    if (!backend) return;

    try {
      const status = await backend.checkStorageState();
      if (status.status === 'expired' && !expiredNotificationShown.current) {
        expiredNotificationShown.current = true;
        notifications.show({
          id: 'storage-state-expired',
          title: 'Authentication Expired',
          message: 'Your Dynamics 365 authentication has expired. Please re-authenticate in Settings.',
          color: 'orange',
          icon: <AlertTriangle size={16} />,
          autoClose: false,
          withCloseButton: true,
          onClose: () => {
            expiredNotificationShown.current = false;
          },
        });
      } else if (status.status === 'valid' && expiredNotificationShown.current) {
        // If state becomes valid again, close the notification
        notifications.hide('storage-state-expired');
        expiredNotificationShown.current = false;
      }
    } catch (error) {
      console.error('Error checking storage state status:', error);
    }
  }, []);

  const checkAuthentication = useCallback(async () => {
    addDebugLog('checkAuthentication called');
    const backend = getBackend();
    if (backend) {
      try {
        addDebugLog('Calling backend.checkAuth()');
        const authStatus = await backend.checkAuth();
        addDebugLog(`Auth status: needsLogin=${authStatus.needsLogin}, hasStorageState=${authStatus.hasStorageState}`);
        if (authStatus.needsLogin) {
          addDebugLog('Needs login, showing login dialog');
          setShowLogin(true);
        } else {
          addDebugLog('Authenticated, setting isAuthenticated=true');
          setIsAuthenticated(true);
          // Only check storage state status if we have a storage state
          // This avoids launching a browser unnecessarily
          if (authStatus.hasStorageState) {
            addDebugLog('Has storage state, will check status later');
            checkStorageStateStatus();
          }
        }
      } catch (error) {
        addDebugLog(`ERROR checking auth: ${error}`);
        console.error('Error checking authentication:', error);
        setShowLogin(true);
      }
    } else {
      addDebugLog('ERROR: Backend not available in checkAuthentication');
    }
  }, [checkStorageStateStatus]);

  const loadConfig = useCallback(async () => {
    addDebugLog('loadConfig called');
    const backend = getBackend();
    if (!backend) {
      addDebugLog('WARNING: Backend not available in loadConfig, will retry');
      // Don't throw - backend might be injected soon (e.g., in demo mode)
      // Retry after a short delay
      setTimeout(() => {
        const retryBackend = getBackend();
        if (retryBackend) {
          loadConfig();
        } else {
          setIsLoadingConfig(false);
        }
      }, 100);
      return;
    }

    try {
      addDebugLog('Calling backend.getConfig()');
      const cfg = await backend.getConfig() as {
        recordingsDir: string;
        d365Url?: string;
        storageStatePath?: string;
        isSetupComplete: boolean;
        workspacePath?: string;
      };
      addDebugLog(`Config loaded: isSetupComplete=${cfg?.isSetupComplete}`);
      setConfig(cfg);
      
      // Use workspace path from current workspace if available
      if (currentWorkspace) {
        setWorkspacePath(currentWorkspace.workspacePath);
        addDebugLog(`Using workspace path: ${currentWorkspace.workspacePath}`);
      } else {
        setWorkspacePath(cfg.workspacePath || cfg.recordingsDir);
        addDebugLog(`Using config path: ${cfg.workspacePath || cfg.recordingsDir}`);
      }
      
      // If setup is complete, check authentication (non-blocking)
      if (cfg.isSetupComplete) {
        addDebugLog('Setup complete, checking authentication');
        // Don't await - let the UI render first
        checkAuthentication().catch(error => {
          addDebugLog(`ERROR in checkAuthentication: ${error}`);
          console.error('Error in checkAuthentication:', error);
          // If auth check fails, show login dialog
          setShowLogin(true);
        });
      } else {
        addDebugLog('Setup not complete');
        // Setup not complete - ensure we're not showing login
        setIsAuthenticated(false);
        setShowLogin(false);
      }
    } catch (error) {
      addDebugLog(`ERROR loading config: ${error}`);
      console.error('Error loading config:', error);
      setIsLoadingConfig(false);
    } finally {
      addDebugLog('loadConfig finished, setting isLoadingConfig=false');
      setIsLoadingConfig(false);
    }
  }, [currentWorkspace, checkAuthentication]);

  useEffect(() => {
    if (currentWorkspace) {
      loadConfig();
    }
  }, [currentWorkspace, loadConfig]);

  const loadCurrentWorkspace = async () => {
    addDebugLog('loadCurrentWorkspace called');
    const backend = getBackend();
    if (!backend) {
      addDebugLog('WARNING: Backend not available yet, will retry');
      // Don't throw - backend might be injected soon (e.g., in demo mode)
      // Retry after a short delay
      setTimeout(() => {
        const retryBackend = getBackend();
        if (retryBackend) {
          loadCurrentWorkspace();
        }
      }, 100);
      return;
    }

    try {
      addDebugLog('Calling ipc.workspaces.getCurrent()');
      const response = await ipc.workspaces.getCurrent();
      addDebugLog(`getCurrent response: ${JSON.stringify(response)}`);
      if (response.success) {
        if (response.workspace) {
          addDebugLog(`Found workspace: ${response.workspace.id}`);
          setCurrentWorkspace(response.workspace);
        } else {
          addDebugLog('No workspace found, creating default');
          // No current workspace - create default
          const createResponse = await ipc.workspaces.create({ name: 'Default D365 Workspace', type: 'd365' });
          addDebugLog(`create response: ${JSON.stringify(createResponse)}`);
          if (createResponse.success && createResponse.workspace) {
            await ipc.workspaces.setCurrent(createResponse.workspace.id);
            setCurrentWorkspace(createResponse.workspace);
            addDebugLog('Default workspace created and set');
          }
        }
      }
    } catch (error) {
      addDebugLog(`ERROR loading workspace: ${error}`);
      console.error('Error loading current workspace:', error);
    }
  };



  // Set up periodic check for expired storage state
  // Only check if authenticated and setup is complete (avoids launching browser unnecessarily)
  useEffect(() => {
    if (isAuthenticated && config?.isSetupComplete) {
      // Delay the initial check slightly to avoid blocking app startup
      const timeoutId = setTimeout(() => {
        checkStorageStateStatus();
      }, 2000); // Wait 2 seconds after app loads
      
      // Then check every 5 minutes
      storageStateCheckInterval.current = setInterval(() => {
        checkStorageStateStatus();
      }, 5 * 60 * 1000); // 5 minutes

      // Listen for storage state updates (e.g., after re-authentication)
      const handleStorageStateUpdate = () => {
        setTimeout(() => {
          checkStorageStateStatus();
        }, 1000); // Wait 1 second for storage state to be saved
      };
      window.addEventListener('storage-state-updated', handleStorageStateUpdate);

      return () => {
        clearTimeout(timeoutId);
        if (storageStateCheckInterval.current) {
          clearInterval(storageStateCheckInterval.current);
        }
        window.removeEventListener('storage-state-updated', handleStorageStateUpdate);
      };
    }
  }, [isAuthenticated, config?.isSetupComplete, checkStorageStateStatus]);

  const handleSetupComplete = () => {
    loadConfig();
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setIsAuthenticated(true);
  };

  // Check if backend is available (graceful handling for demo mode)
  const backend = getBackend();
  if (!backend) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <p>Loading demo backend...</p>
          <p style={{ fontSize: '12px', marginTop: '1rem', opacity: 0.7 }}>
            Initializing QA Studio Web Demo
          </p>
        </div>
      </div>
    );
  }

  // Show loading while config loads
  if (isLoadingConfig || !config) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Debug logging for render decisions (only log when state actually changes)
  // Removed to prevent infinite loops - debug logs are still available in console
  // useEffect(() => {
  //   if (config) {
  //     const currentState = `${config.isSetupComplete}-${showLogin}-${isAuthenticated}`;
  //     if (currentState !== lastRenderStateRef.current) {
  //       lastRenderStateRef.current = currentState;
  //       if (!config.isSetupComplete) {
  //         addDebugLog('Rendering SetupScreen (setup not complete)');
  //       } else if (showLogin) {
  //         addDebugLog('Rendering LoginDialog (showLogin=true)');
  //       } else if (!isAuthenticated) {
  //         addDebugLog('Rendering auth check screen (not authenticated yet)');
  //       } else {
  //         addDebugLog('Rendering main app routes');
  //       }
  //     }
  //   }
  // }, [config, showLogin, isAuthenticated]);

  // Show setup screen if not completed
  if (!config.isSetupComplete) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  // Show login if needed
  if (showLogin) {
    return <LoginDialog onLoginSuccess={handleLoginSuccess} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <p>Checking authentication...</p>
          <p style={{ fontSize: '12px', marginTop: '1rem', opacity: 0.7 }}>
            isAuthenticated: {isAuthenticated ? 'true' : 'false'}, showLogin: {showLogin ? 'true' : 'false'}
          </p>
          {debugLogsRef.current.length > 0 && (
            <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '10px', fontFamily: 'monospace', maxHeight: '200px', overflow: 'auto' }}>
              <strong>Debug Log:</strong>
              {debugLogsRef.current.map((log, i) => (
                <div key={i} style={{ marginTop: '4px' }}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Workspace switching overlay */}
      {isSwitchingWorkspace && (
        <div className="workspace-switch-overlay">
          <div className="workspace-switch-card">
            <div className="workspace-switch-spinner" />
            <div className="workspace-switch-text">
              <div className="workspace-switch-title">Switching workspace…</div>
              <div className="workspace-switch-subtitle">
                {switchingToName ? `Loading "${switchingToName}"` : 'Applying environment settings'}
              </div>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/setup" element={<SetupScreen onSetupComplete={handleSetupComplete} />} />
        <Route path="/login" element={<LoginDialog onLoginSuccess={handleLoginSuccess} />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<TestLibrary />} />
          <Route path="/tests/:testName" element={<TestDetailsScreen />} />
          <Route path="/locators" element={<LocatorsScreen />} />
          <Route path="/record" element={<RecordScreen />} />
          <Route path="/record/step-editor" element={<StepEditorScreen />} />
          <Route path="/record/locator-cleanup" element={<LocatorCleanupScreen />} />
          <Route path="/record/params" element={<ParameterMappingScreen />} />
          <Route path="/test/:testName/data" element={<DataEditorScreen />} />
          <Route path="/runs" element={<RunsScreen />} />
          <Route path="/runs/:runId" element={<RunScreen />} />
          <Route path="/trace/:testName/:runId" element={<TraceViewerScreen />} />
          <Route path="/trace/:runId" element={<TraceViewerScreen />} />
          <Route path="/trace" element={<TraceViewerScreen />} />
          <Route path="/report/:testName/:runId" element={<ReportViewerScreen />} />
          <Route path="/report/:runId" element={<ReportViewerScreen />} />
          <Route path="/report" element={<ReportDashboard />} />
          <Route path="/browserstack-tm" element={<BrowserStackTMScreen />} />
          <Route path="/jira" element={<JiraScreen />} />
          <Route path="/marketplace" element={<MarketplaceScreen />} />
          <Route path="/diagnostics" element={<DiagnosticsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  // Use HashRouter for Electron compatibility with file:// protocol
  // HashRouter works better than BrowserRouter in Electron because it doesn't
  // rely on the pathname, which can be problematic with file:// URLs
  return (
    <HashRouter>
      {/* DEBUG: This is the NEW App.tsx with Mantine + Sidebar Layout */}
      <AppContent />
    </HashRouter>
  );
}

export default App;
