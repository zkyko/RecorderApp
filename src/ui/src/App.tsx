import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import { useWorkspaceStore } from './store/workspace-store';
import { ipc } from './ipc';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const { workspacePath, setWorkspacePath, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    loadCurrentWorkspace();
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      loadConfig();
    }
  }, [currentWorkspace]);

  const loadCurrentWorkspace = async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      const response = await ipc.workspaces.getCurrent();
      if (response.success) {
        if (response.workspace) {
          setCurrentWorkspace(response.workspace);
        } else {
          // No current workspace - create default
          const createResponse = await ipc.workspaces.create('Default D365 Workspace', 'd365');
          if (createResponse.success && createResponse.workspace) {
            await ipc.workspaces.setCurrent(createResponse.workspace.id);
            setCurrentWorkspace(createResponse.workspace);
          }
        }
      }
    } catch (error) {
      console.error('Error loading current workspace:', error);
    }
  };

  const loadConfig = async () => {
    if (!window.electronAPI) {
      setIsLoadingConfig(false);
      return;
    }

    try {
      const cfg = await window.electronAPI.getConfig();
      setConfig(cfg);
      
      // Use workspace path from current workspace if available
      if (currentWorkspace) {
        setWorkspacePath(currentWorkspace.workspacePath);
      } else {
        setWorkspacePath(cfg.workspacePath || cfg.recordingsDir);
      }
      
      // If setup is complete, check authentication
      if (cfg.isSetupComplete) {
        await checkAuthentication();
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const checkAuthentication = async () => {
    if (window.electronAPI) {
      try {
        const authStatus = await window.electronAPI.checkAuth();
        if (authStatus.needsLogin) {
          setShowLogin(true);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setShowLogin(true);
      }
    }
  };

  const handleSetupComplete = () => {
    loadConfig();
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setIsAuthenticated(true);
  };

  // Show loading while config loads
  if (isLoadingConfig || !config) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
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
