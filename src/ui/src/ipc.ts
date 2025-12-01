/**
 * Type-safe IPC wrapper for v1.5
 */
import { getBackend } from './ipc-backend';
import {
  CodegenStartRequest,
  CodegenStartResponse,
  CodegenStopResponse,
  CodegenCodeUpdate,
  LocatorCleanupRequest,
  LocatorCleanupResponse,
  ParamDetectRequest,
  ParamDetectResponse,
  SpecWriteRequest,
  SpecWriteResponse,
  DataWriteRequest,
  DataWriteResponse,
  TestListRequest,
  TestListResponse,
  TestRunRequest,
  TestRunEvent,
  TestRunMeta,
  TraceOpenRequest,
  TraceOpenResponse,
  ReportOpenRequest,
  ReportOpenResponse,
  WorkspaceListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceGetCurrentResponse,
  WorkspaceSetCurrentRequest,
  WorkspaceSetCurrentResponse,
  WorkspaceMeta,
  WorkspaceType,
  SettingsGetRecordingEngineRequest,
  SettingsGetRecordingEngineResponse,
  SettingsUpdateRecordingEngineRequest,
  SettingsUpdateRecordingEngineResponse,
  RecordingEngine,
  RecorderStartRequest,
  RecorderStartResponse,
  RecorderStopResponse,
  RecorderCodeUpdate,
} from '../../types/v1.5';

export const ipc = {
  // Codegen
  codegen: {
    start: (request: CodegenStartRequest): Promise<CodegenStartResponse> => {
      return getBackend()?.codegenStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<CodegenStopResponse> => {
      return getBackend()?.codegenStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    onCodeUpdate: (callback: (update: CodegenCodeUpdate) => void): void => {
      getBackend()?.onCodegenCodeUpdate(callback);
    },
    removeCodeUpdateListener: (): void => {
      getBackend()?.removeCodegenCodeUpdateListener();
    },
  },

  // Recorder (QA Studio Recorder)
  recorder: {
    start: (request: RecorderStartRequest): Promise<RecorderStartResponse> => {
      return getBackend()?.recorderStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<RecorderStopResponse> => {
      return getBackend()?.recorderStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    compileSteps: (steps: any[]): Promise<string> => {
      return getBackend()?.recorderCompileSteps(steps) || Promise.resolve('');
    },
    onCodeUpdate: (callback: (update: RecorderCodeUpdate) => void): void => {
      getBackend()?.onRecorderCodeUpdate(callback);
    },
    removeCodeUpdateListener: (): void => {
      getBackend()?.removeRecorderCodeUpdateListener();
    },
  },

  // Locator cleanup
  locator: {
    cleanup: (request: LocatorCleanupRequest): Promise<LocatorCleanupResponse> => {
      return getBackend()?.locatorCleanup(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    onStatusUpdated: (callback: (data: any) => void): void => {
      getBackend()?.onLocatorStatusUpdated(callback);
    },
    removeStatusUpdatedListener: (): void => {
      getBackend()?.removeLocatorStatusUpdatedListener();
    },
  },

  // Parameter detection
  params: {
    detect: (request: ParamDetectRequest): Promise<ParamDetectResponse> => {
      return getBackend()?.paramsDetect(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Spec writing
  spec: {
    write: (request: SpecWriteRequest): Promise<SpecWriteResponse> => {
      return getBackend()?.specWrite(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Data writing
  data: {
    write: (request: DataWriteRequest): Promise<DataWriteResponse> => {
      return getBackend()?.dataWrite(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    // v1.6: Data operations
    read: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; rows?: any[]; error?: string }> => {
      return getBackend()?.dataRead(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    importExcel: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.dataImportExcel(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Test library
  workspace: {
    testsList: (request: TestListRequest): Promise<TestListResponse> => {
      return getBackend()?.workspaceTestsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    // v1.6: Workspace locators
    locatorsList: (request: { workspacePath: string }): Promise<{ success: boolean; locators?: any[]; error?: string }> => {
      return getBackend()?.workspaceLocatorsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsUpdate: (request: any): Promise<{ success: boolean; updatedTests?: string[]; error?: string }> => {
      return getBackend()?.workspaceLocatorsUpdate(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsAdd: (request: { workspacePath: string; locator: string; type: string; tests?: string[] }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.workspaceLocatorsAdd(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsSetStatus: (request: any): Promise<{ success: boolean; status?: any; error?: string }> => {
      return getBackend()?.workspaceLocatorsSetStatus(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Test execution
  test: {
    run: (request: TestRunRequest): Promise<{ runId: string }> => {
      return getBackend()?.testRun(request) || Promise.resolve({ runId: '' });
    },
    stop: (): Promise<{ success: boolean }> => {
      return getBackend()?.testStop() || Promise.resolve({ success: false });
    },
    onEvents: (callback: (event: TestRunEvent) => void): void => {
      getBackend()?.onTestRunEvents(callback);
    },
    removeEventsListener: (): void => {
      getBackend()?.removeTestRunEventsListener();
    },
    // v1.6: Test Details
    getSpec: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; content?: string; error?: string }> => {
      return getBackend()?.testGetSpec(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    parseLocators: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; locators?: any[]; error?: string }> => {
      return getBackend()?.testParseLocators(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateSpec: (request: { workspacePath: string; testName: string; updates: Array<{ line: number; originalContent?: string; newContent: string }> }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return getBackend()?.testUpdateSpec(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    addStep: (request: { workspacePath: string; testName: string; afterLine?: number; stepContent: string }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return getBackend()?.testAddStep(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    deleteStep: (request: { workspacePath: string; testName: string; line: number }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return getBackend()?.testDeleteStep(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    reorderSteps: (request: { workspacePath: string; testName: string; stepLines: number[] }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return getBackend()?.testReorderSteps(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    exportBundle: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; bundlePath?: string; error?: string }> => {
      return getBackend()?.testExportBundle(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Trace & Report
  trace: {
    open: (request: TraceOpenRequest): Promise<TraceOpenResponse> => {
      return getBackend()?.traceOpen(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    openWindow: (request: TraceOpenRequest): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.traceOpenWindow(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },
  report: {
    open: (request: ReportOpenRequest): Promise<ReportOpenResponse> => {
      return getBackend()?.reportOpen(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    openWindow: (request: ReportOpenRequest): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.reportOpenWindow(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Run metadata
  runs: {
    list: (request: { workspacePath: string; testName?: string }): Promise<{ success: boolean; runs?: TestRunMeta[]; error?: string }> => {
      return getBackend()?.runsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    get: (request: { workspacePath: string; runId: string }): Promise<{ success: boolean; run?: TestRunMeta; error?: string }> => {
      return getBackend()?.runGet(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Workspace management
  workspaces: {
    list: (): Promise<WorkspaceListResponse> => {
      return getBackend()?.workspacesList() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    create: (name: string, type?: WorkspaceType): Promise<WorkspaceCreateResponse> => {
      return getBackend()?.workspacesCreate({ name, type }) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getCurrent: (): Promise<WorkspaceGetCurrentResponse> => {
      return getBackend()?.workspacesGetCurrent() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    setCurrent: (workspaceId: string): Promise<WorkspaceSetCurrentResponse> => {
      return getBackend()?.workspacesSetCurrent({ workspaceId }) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    deleteFiles: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.workspaceDeleteFiles(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Dev mode utilities
  dev: {
    openFolder: (request: { path: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.devOpenFolder(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearTempFiles: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return getBackend()?.devClearTempFiles(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearOldTraces: (request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return getBackend()?.devClearOldTraces(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearOldReports: (request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return getBackend()?.devClearOldReports(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getWorkspaceStats: (request: { workspacePath: string }): Promise<{ success: boolean; stats?: any; error?: string }> => {
      return getBackend()?.devGetWorkspaceStats(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    rebuildWorkspaceStructure: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.devRebuildWorkspaceStructure(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getRawConfig: (): Promise<{ success: boolean; config?: any; error?: string }> => {
      return getBackend()?.devGetRawConfig() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getStorageStatePath: (): Promise<{ success: boolean; path?: string; error?: string }> => {
      return getBackend()?.devGetStorageStatePath() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Playwright environment
  playwright: {
    checkEnv: (request: { workspacePath: string }): Promise<{
      success: boolean;
      cliAvailable?: boolean;
      browsersInstalled?: boolean;
      error?: string;
      details?: { version?: string; browsersDir?: string };
    }> => {
      return getBackend()?.playwrightCheckEnv(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    install: (request: { workspacePath: string }): Promise<{
      success: boolean;
      error?: string;
      logPath?: string;
    }> => {
      return getBackend()?.playwrightInstall(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // v1.6: Settings
  settings: {
    getBrowserStack: (request: { workspacePath: string }): Promise<{ success: boolean; settings?: any; error?: string }> => {
      return getBackend()?.settingsGetBrowserStack(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateBrowserStack: (request: { workspacePath: string; settings: any }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.settingsUpdateBrowserStack(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearBrowserStackTMSession: (): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.clearBrowserStackTMSession() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getRecordingEngine: (request: SettingsGetRecordingEngineRequest): Promise<SettingsGetRecordingEngineResponse> => {
      return getBackend()?.settingsGetRecordingEngine(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateRecordingEngine: (request: SettingsUpdateRecordingEngineRequest): Promise<SettingsUpdateRecordingEngineResponse> => {
      return getBackend()?.settingsUpdateRecordingEngine(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getAIConfig: (): Promise<{ success: boolean; config?: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }; error?: string }> => {
      return getBackend()?.settingsGetAIConfig() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateAIConfig: (request: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.settingsUpdateAIConfig(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getDevMode: (): Promise<{ success: boolean; devMode?: boolean; error?: string }> => {
      return getBackend()?.settingsGetDevMode() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateDevMode: (request: { devMode: boolean }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.settingsUpdateDevMode(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // RAG Chat
  rag: {
    chat: (request: { workspacePath: string; testName: string; messages: Array<{ role: string; content: string }> }): Promise<{ success: boolean; response?: string; error?: string }> => {
      return getBackend()?.ragChat(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Locator Browser
  locatorBrowse: {
    start: (request: { workspacePath: string; storageStatePath?: string; url?: string }): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.locatorBrowseStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<{ success: boolean; error?: string }> => {
      return getBackend()?.locatorBrowseStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    onElementHover: (callback: (data: any) => void): void => {
      getBackend()?.onLocatorBrowseElementHover(callback);
    },
    onElementClick: (callback: (data: any) => void): void => {
      getBackend()?.onLocatorBrowseElementClick(callback);
    },
    onClickedElements: (callback: (data: any) => void): void => {
      getBackend()?.onLocatorBrowseClickedElements(callback);
    },
    removeListeners: (): void => {
      getBackend()?.removeLocatorBrowseListeners();
    },
  },
};

