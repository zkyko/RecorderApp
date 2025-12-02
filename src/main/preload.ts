import { contextBridge, ipcRenderer } from 'electron';
import { SessionConfig, OutputConfig, RecordedStep } from '../types';

/**
 * Preload script to expose safe IPC methods to renderer
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration management
  getConfig: () => ipcRenderer.invoke('config:get'),
  chooseRecordingsDir: () => ipcRenderer.invoke('config:choose-recordings-dir'),
  saveD365Url: (url: string) => ipcRenderer.invoke('config:save-d365-url', url),
  createStorageState: (credentials: { username: string; password: string; d365Url: string }) =>
    ipcRenderer.invoke('config:create-storage-state', credentials),
  onLoginProgress: (callback: (message: string) => void) => {
    ipcRenderer.on('login:progress', (_event, message) => callback(message));
  },
  removeLoginProgressListener: () => {
    ipcRenderer.removeAllListeners('login:progress');
  },

  // Authentication
  checkAuth: () => ipcRenderer.invoke('auth:check'),
  login: (credentials: { username: string; password: string; d365Url?: string }) =>
    ipcRenderer.invoke('auth:login', credentials),

  // Session management
  startSession: (config: SessionConfig) => ipcRenderer.invoke('session:start', config),
  stopSession: (sessionId: string) => ipcRenderer.invoke('session:stop', sessionId),
  getSessionSteps: (sessionId: string) => ipcRenderer.invoke('session:getSteps', sessionId),
  updateStep: (sessionId: string, stepOrder: number, description: string) =>
    ipcRenderer.invoke('session:updateStep', sessionId, stepOrder, description),

  // Code generation
  generateCode: (sessionId: string, outputConfig: OutputConfig) =>
    ipcRenderer.invoke('code:generate', sessionId, outputConfig),

  // Browser control
  closeBrowser: () => ipcRenderer.invoke('browser:close'),

  // Test execution
  listSpecFiles: () => ipcRenderer.invoke('test:list-spec-files'),
  findDataFile: (specFilePath: string) => ipcRenderer.invoke('test:find-data-file', specFilePath),
  loadTestData: (dataFilePath: string) => ipcRenderer.invoke('test:load-data', dataFilePath),
  saveTestData: (dataFilePath: string, data: any) => ipcRenderer.invoke('test:save-data', dataFilePath, data),
  runTestLocal: (specFilePath: string) => ipcRenderer.invoke('test:run-local', specFilePath),
  runTestBrowserStack: (specFilePath: string) => ipcRenderer.invoke('test:run-browserstack', specFilePath),
  stopTest: () => ipcRenderer.invoke('test:stop'),
  onTestOutput: (callback: (data: string) => void) => {
    ipcRenderer.on('test:output', (_event, data) => callback(data));
  },
  onTestError: (callback: (data: string) => void) => {
    ipcRenderer.on('test:error', (_event, data) => callback(data));
  },
  onTestClose: (callback: (code: number | null) => void) => {
    ipcRenderer.on('test:close', (_event, code) => callback(code));
  },
  removeTestListeners: () => {
    ipcRenderer.removeAllListeners('test:output');
    ipcRenderer.removeAllListeners('test:error');
    ipcRenderer.removeAllListeners('test:close');
  },

  // BrowserStack settings
  getBrowserStackCredentials: () => ipcRenderer.invoke('config:get-browserstack-credentials'),
  setBrowserStackCredentials: (username: string, accessKey: string) => 
    ipcRenderer.invoke('config:set-browserstack-credentials', username, accessKey),

  // Storage state checker
  checkStorageState: () => ipcRenderer.invoke('config:check-storage-state'),

  // ============================================================================
  // v1.5 IPC Methods
  // ============================================================================

  // Codegen control
  codegenStart: (request: any) => ipcRenderer.invoke('codegen:start', request),
  codegenStop: () => ipcRenderer.invoke('codegen:stop'),
  onCodegenCodeUpdate: (callback: (update: any) => void) => {
    ipcRenderer.on('codegen:code-update', (_event, update) => callback(update));
  },
  removeCodegenCodeUpdateListener: () => {
    ipcRenderer.removeAllListeners('codegen:code-update');
  },

  // Recorder control (QA Studio Recorder)
  recorderStart: (request: any) => ipcRenderer.invoke('recorder:start', request),
  recorderStop: () => ipcRenderer.invoke('recorder:stop'),
  recorderCompileSteps: (steps: RecordedStep[]) => ipcRenderer.invoke('recorder:compileSteps', steps),
  
  // Locator Browser
  locatorBrowseStart: (request: { workspacePath: string; storageStatePath?: string; url?: string }) => ipcRenderer.invoke('locator:browse:start', request),
  locatorBrowseStop: () => ipcRenderer.invoke('locator:browse:stop'),
  onLocatorBrowseElementHover: (callback: (data: any) => void) => {
    ipcRenderer.on('locator:browse:elementHover', (_, data) => callback(data));
  },
  onLocatorBrowseElementClick: (callback: (data: any) => void) => {
    ipcRenderer.on('locator:browse:elementClick', (_, data) => callback(data));
  },
  onLocatorBrowseClickedElements: (callback: (data: any) => void) => {
    ipcRenderer.on('locator:browse:clickedElements', (_, data) => callback(data));
  },
  removeLocatorBrowseListeners: () => {
    ipcRenderer.removeAllListeners('locator:browse:elementHover');
    ipcRenderer.removeAllListeners('locator:browse:elementClick');
    ipcRenderer.removeAllListeners('locator:browse:clickedElements');
  },
  onLocatorStatusUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('locator:status:updated', (_, data) => callback(data));
  },
  removeLocatorStatusUpdatedListener: () => {
    ipcRenderer.removeAllListeners('locator:status:updated');
  },
  
  onRecorderCodeUpdate: (callback: (update: any) => void) => {
    ipcRenderer.on('recorder:code-update', (_event, update) => callback(update));
  },
  removeRecorderCodeUpdateListener: () => {
    ipcRenderer.removeAllListeners('recorder:code-update');
  },

  // Locator cleanup
  locatorCleanup: (request: any) => ipcRenderer.invoke('locator:cleanup', request),

  // Parameter detection
  paramsDetect: (request: any) => ipcRenderer.invoke('params:detect', request),

  // Spec writing
  specWrite: (request: any) => ipcRenderer.invoke('spec:write', request),

  // Data writing
  dataWrite: (request: any) => ipcRenderer.invoke('data:write', request),

  // Test library
  workspaceTestsList: (request: any) => ipcRenderer.invoke('workspace:tests:list', request),

  // Test execution
  testRun: (request: any) => ipcRenderer.invoke('test:run', request),
  testStop: () => ipcRenderer.invoke('test:stop'),
  onTestRunEvents: (callback: (event: any) => void) => {
    ipcRenderer.on('test:run:events', (_event, event) => callback(event));
  },
  removeTestRunEventsListener: () => {
    ipcRenderer.removeAllListeners('test:run:events');
  },
  onTestUpdate: (callback: (data: { workspacePath: string; testName: string; status: 'passed' | 'failed'; lastRunAt: string; lastRunId: string }) => void) => {
    ipcRenderer.on('test:update', (_event, data) => callback(data));
  },
  removeTestUpdateListener: () => {
    ipcRenderer.removeAllListeners('test:update');
  },

  // Trace & Report
  traceOpen: (request: any) => ipcRenderer.invoke('trace:open', request),
  traceOpenWindow: (request: any) => ipcRenderer.invoke('trace:openWindow', request),
  reportOpen: (request: any) => ipcRenderer.invoke('report:open', request),
  reportOpenWindow: (request: any) => ipcRenderer.invoke('report:openWindow', request),

  // Run metadata
  runsList: (request: { workspacePath: string; testName?: string }) => ipcRenderer.invoke('runs:list', request),
  runGet: (request: { workspacePath: string; runId: string }) => ipcRenderer.invoke('run:get', request),

  // Workspace management
  workspacesList: () => ipcRenderer.invoke('workspaces:list'),
  workspacesCreate: (request: { name: string; type?: string }) => ipcRenderer.invoke('workspaces:create', request),
  workspacesGetCurrent: () => ipcRenderer.invoke('workspaces:getCurrent'),
  workspacesSetCurrent: (request: { workspaceId: string }) => ipcRenderer.invoke('workspaces:setCurrent', request),
  workspaceDeleteFiles: (request: { workspacePath: string }) => ipcRenderer.invoke('workspace:deleteFiles', request),

  // ============================================================================
  // v1.6: Test Details IPC Methods
  // ============================================================================

  // Test Details
  testGetSpec: (request: { workspacePath: string; testName: string }) => ipcRenderer.invoke('test:getSpec', request),
  testParseLocators: (request: { workspacePath: string; testName: string }) => ipcRenderer.invoke('test:parseLocators', request),
  testExportBundle: (request: { workspacePath: string; testName: string }) => ipcRenderer.invoke('test:exportBundle', request),
  testUpdateSpec: (request: any) => ipcRenderer.invoke('test:updateSpec', request),
  testAddStep: (request: any) => ipcRenderer.invoke('test:addStep', request),
  testDeleteStep: (request: any) => ipcRenderer.invoke('test:deleteStep', request),
  testReorderSteps: (request: any) => ipcRenderer.invoke('test:reorderSteps', request),

  // Data operations
  dataRead: (request: { workspacePath: string; testName: string }) => ipcRenderer.invoke('data:read', request),
  dataImportExcel: (request: { workspacePath: string; testName: string }) => ipcRenderer.invoke('data:importExcel', request),

  // Workspace locators
  workspaceLocatorsList: (request: { workspacePath: string }) => ipcRenderer.invoke('workspace:locators:list', request),
  workspaceLocatorsUpdate: (request: any) => ipcRenderer.invoke('workspace:locators:update', request),
  workspaceLocatorsSetStatus: (request: any) => ipcRenderer.invoke('workspace:locators:setStatus', request),
  workspaceLocatorsAdd: (request: { workspacePath: string; locator: string; type: string; tests?: string[] }) => ipcRenderer.invoke('workspace:locators:add', request),

  // Settings
    settingsGetBrowserStack: (request: { workspacePath: string }) => ipcRenderer.invoke('settings:getBrowserStack', request),
    settingsUpdateBrowserStack: (request: { workspacePath: string; settings: any }) => ipcRenderer.invoke('settings:updateBrowserStack', request),
    clearBrowserStackTMSession: () => ipcRenderer.invoke('browserstack:clearTMSession'),
  settingsGetRecordingEngine: (request: { workspacePath: string }) => ipcRenderer.invoke('settings:getRecordingEngine', request),
  settingsUpdateRecordingEngine: (request: { workspacePath: string; recordingEngine: string }) => ipcRenderer.invoke('settings:updateRecordingEngine', request),
  settingsGetAIConfig: () => ipcRenderer.invoke('settings:getAIConfig'),
  settingsUpdateAIConfig: (request: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }) => ipcRenderer.invoke('settings:updateAIConfig', request),
  settingsGetDevMode: () => ipcRenderer.invoke('settings:getDevMode'),
  settingsUpdateDevMode: (request: { devMode: boolean }) => ipcRenderer.invoke('settings:updateDevMode', request),

  // Playwright environment
  playwrightCheckEnv: (request: { workspacePath: string }) => ipcRenderer.invoke('playwright:checkEnv', request),
  playwrightInstall: (request: { workspacePath: string }) => ipcRenderer.invoke('playwright:install', request),
  playwrightRuntimeHealth: (request: { workspacePath: string }) => ipcRenderer.invoke('playwright:runtimeHealth', request),

  // RAG Chat
  ragChat: (request: { workspacePath: string; testName: string; messages: Array<{ role: string; content: string }> }) => ipcRenderer.invoke('rag:chat', request),

  // Dev mode utilities
  devOpenFolder: (request: { path: string }) => ipcRenderer.invoke('dev:openFolder', request),
  devClearTempFiles: (request: { workspacePath: string }) => ipcRenderer.invoke('dev:clearTempFiles', request),
  devClearOldTraces: (request: { workspacePath: string; daysToKeep?: number }) => ipcRenderer.invoke('dev:clearOldTraces', request),
  devClearOldReports: (request: { workspacePath: string; daysToKeep?: number }) => ipcRenderer.invoke('dev:clearOldReports', request),
  devGetWorkspaceStats: (request: { workspacePath: string }) => ipcRenderer.invoke('dev:getWorkspaceStats', request),
  devRebuildWorkspaceStructure: (request: { workspacePath: string }) => ipcRenderer.invoke('dev:rebuildWorkspaceStructure', request),
  devGetRawConfig: () => ipcRenderer.invoke('dev:getRawConfig'),
  devGetStorageStatePath: () => ipcRenderer.invoke('dev:getStorageStatePath'),
});

