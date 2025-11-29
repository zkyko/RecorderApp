/**
 * Type-safe IPC wrapper for v1.5
 */
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
      return window.electronAPI?.codegenStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<CodegenStopResponse> => {
      return window.electronAPI?.codegenStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    onCodeUpdate: (callback: (update: CodegenCodeUpdate) => void): void => {
      window.electronAPI?.onCodegenCodeUpdate(callback);
    },
    removeCodeUpdateListener: (): void => {
      window.electronAPI?.removeCodegenCodeUpdateListener();
    },
  },

  // Recorder (QA Studio Recorder)
  recorder: {
    start: (request: RecorderStartRequest): Promise<RecorderStartResponse> => {
      return window.electronAPI?.recorderStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<RecorderStopResponse> => {
      return window.electronAPI?.recorderStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    compileSteps: (steps: any[]): Promise<string> => {
      return window.electronAPI?.recorderCompileSteps(steps) || Promise.resolve('');
    },
    onCodeUpdate: (callback: (update: RecorderCodeUpdate) => void): void => {
      window.electronAPI?.onRecorderCodeUpdate(callback);
    },
    removeCodeUpdateListener: (): void => {
      window.electronAPI?.removeRecorderCodeUpdateListener();
    },
  },

  // Locator cleanup
  locator: {
    cleanup: (request: LocatorCleanupRequest): Promise<LocatorCleanupResponse> => {
      return window.electronAPI?.locatorCleanup(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Parameter detection
  params: {
    detect: (request: ParamDetectRequest): Promise<ParamDetectResponse> => {
      return window.electronAPI?.paramsDetect(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Spec writing
  spec: {
    write: (request: SpecWriteRequest): Promise<SpecWriteResponse> => {
      return window.electronAPI?.specWrite(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Data writing
  data: {
    write: (request: DataWriteRequest): Promise<DataWriteResponse> => {
      return window.electronAPI?.dataWrite(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    // v1.6: Data operations
    read: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; rows?: any[]; error?: string }> => {
      return window.electronAPI?.dataRead(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    importExcel: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.dataImportExcel(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Test library
  workspace: {
    testsList: (request: TestListRequest): Promise<TestListResponse> => {
      return window.electronAPI?.workspaceTestsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    // v1.6: Workspace locators
    locatorsList: (request: { workspacePath: string }): Promise<{ success: boolean; locators?: any[]; error?: string }> => {
      return window.electronAPI?.workspaceLocatorsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsUpdate: (request: any): Promise<{ success: boolean; updatedTests?: string[]; error?: string }> => {
      return window.electronAPI?.workspaceLocatorsUpdate(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsAdd: (request: { workspacePath: string; locator: string; type: string; tests?: string[] }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.workspaceLocatorsAdd(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    locatorsSetStatus: (request: any): Promise<{ success: boolean; status?: any; error?: string }> => {
      return window.electronAPI?.workspaceLocatorsSetStatus(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Test execution
  test: {
    run: (request: TestRunRequest): Promise<{ runId: string }> => {
      return window.electronAPI?.testRun(request) || Promise.resolve({ runId: '' });
    },
    stop: (): Promise<{ success: boolean }> => {
      return window.electronAPI?.testStop() || Promise.resolve({ success: false });
    },
    onEvents: (callback: (event: TestRunEvent) => void): void => {
      window.electronAPI?.onTestRunEvents(callback);
    },
    removeEventsListener: (): void => {
      window.electronAPI?.removeTestRunEventsListener();
    },
    // v1.6: Test Details
    getSpec: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; content?: string; error?: string }> => {
      return window.electronAPI?.testGetSpec(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    parseLocators: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; locators?: any[]; error?: string }> => {
      return window.electronAPI?.testParseLocators(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateSpec: (request: { workspacePath: string; testName: string; updates: Array<{ line: number; originalContent?: string; newContent: string }> }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return window.electronAPI?.testUpdateSpec(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    addStep: (request: { workspacePath: string; testName: string; afterLine?: number; stepContent: string }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return window.electronAPI?.testAddStep(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    deleteStep: (request: { workspacePath: string; testName: string; line: number }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return window.electronAPI?.testDeleteStep(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    reorderSteps: (request: { workspacePath: string; testName: string; stepLines: number[] }): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return window.electronAPI?.testReorderSteps(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    exportBundle: (request: { workspacePath: string; testName: string }): Promise<{ success: boolean; bundlePath?: string; error?: string }> => {
      return window.electronAPI?.testExportBundle(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Trace & Report
  trace: {
    open: (request: TraceOpenRequest): Promise<TraceOpenResponse> => {
      return window.electronAPI?.traceOpen(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    openWindow: (request: TraceOpenRequest): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.traceOpenWindow(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },
  report: {
    open: (request: ReportOpenRequest): Promise<ReportOpenResponse> => {
      return window.electronAPI?.reportOpen(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    openWindow: (request: ReportOpenRequest): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.reportOpenWindow(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Run metadata
  runs: {
    list: (request: { workspacePath: string; testName?: string }): Promise<{ success: boolean; runs?: TestRunMeta[]; error?: string }> => {
      return window.electronAPI?.runsList(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    get: (request: { workspacePath: string; runId: string }): Promise<{ success: boolean; run?: TestRunMeta; error?: string }> => {
      return window.electronAPI?.runGet(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Workspace management
  workspaces: {
    list: (): Promise<WorkspaceListResponse> => {
      return window.electronAPI?.workspacesList() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    create: (name: string, type?: WorkspaceType): Promise<WorkspaceCreateResponse> => {
      return window.electronAPI?.workspacesCreate({ name, type }) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getCurrent: (): Promise<WorkspaceGetCurrentResponse> => {
      return window.electronAPI?.workspacesGetCurrent() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    setCurrent: (workspaceId: string): Promise<WorkspaceSetCurrentResponse> => {
      return window.electronAPI?.workspacesSetCurrent({ workspaceId }) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    deleteFiles: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.workspaceDeleteFiles(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Dev mode utilities
  dev: {
    openFolder: (request: { path: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.devOpenFolder(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearTempFiles: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return window.electronAPI?.devClearTempFiles(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearOldTraces: (request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return window.electronAPI?.devClearOldTraces(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    clearOldReports: (request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      return window.electronAPI?.devClearOldReports(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getWorkspaceStats: (request: { workspacePath: string }): Promise<{ success: boolean; stats?: any; error?: string }> => {
      return window.electronAPI?.devGetWorkspaceStats(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    rebuildWorkspaceStructure: (request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.devRebuildWorkspaceStructure(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getRawConfig: (): Promise<{ success: boolean; config?: any; error?: string }> => {
      return window.electronAPI?.devGetRawConfig() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getStorageStatePath: (): Promise<{ success: boolean; path?: string; error?: string }> => {
      return window.electronAPI?.devGetStorageStatePath() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // v1.6: Settings
  settings: {
    getBrowserStack: (request: { workspacePath: string }): Promise<{ success: boolean; settings?: any; error?: string }> => {
      return window.electronAPI?.settingsGetBrowserStack(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateBrowserStack: (request: { workspacePath: string; settings: any }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.settingsUpdateBrowserStack(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getRecordingEngine: (request: SettingsGetRecordingEngineRequest): Promise<SettingsGetRecordingEngineResponse> => {
      return window.electronAPI?.settingsGetRecordingEngine(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateRecordingEngine: (request: SettingsUpdateRecordingEngineRequest): Promise<SettingsUpdateRecordingEngineResponse> => {
      return window.electronAPI?.settingsUpdateRecordingEngine(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getAIConfig: (): Promise<{ success: boolean; config?: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }; error?: string }> => {
      return window.electronAPI?.settingsGetAIConfig() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateAIConfig: (request: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.settingsUpdateAIConfig(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    getDevMode: (): Promise<{ success: boolean; devMode?: boolean; error?: string }> => {
      return window.electronAPI?.settingsGetDevMode() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    updateDevMode: (request: { devMode: boolean }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.settingsUpdateDevMode(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // RAG Chat
  rag: {
    chat: (request: { workspacePath: string; testName: string; messages: Array<{ role: string; content: string }> }): Promise<{ success: boolean; response?: string; error?: string }> => {
      return window.electronAPI?.ragChat(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
  },

  // Locator Browser
  locatorBrowse: {
    start: (request: { workspacePath: string; storageStatePath?: string; url?: string }): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.locatorBrowseStart(request) || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    stop: (): Promise<{ success: boolean; error?: string }> => {
      return window.electronAPI?.locatorBrowseStop() || Promise.resolve({ success: false, error: 'Electron API not available' });
    },
    onElementHover: (callback: (data: any) => void): void => {
      window.electronAPI?.onLocatorBrowseElementHover(callback);
    },
    onElementClick: (callback: (data: any) => void): void => {
      window.electronAPI?.onLocatorBrowseElementClick(callback);
    },
    onClickedElements: (callback: (data: any) => void): void => {
      window.electronAPI?.onLocatorBrowseClickedElements(callback);
    },
    removeListeners: (): void => {
      window.electronAPI?.removeLocatorBrowseListeners();
    },
  },
  locator: {
    onStatusUpdated: (callback: (data: any) => void): void => {
      window.electronAPI?.onLocatorStatusUpdated(callback);
    },
    removeStatusUpdatedListener: (): void => {
      window.electronAPI?.removeLocatorStatusUpdatedListener();
    },
  },
};

