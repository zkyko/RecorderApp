/**
 * Shared ElectronAPI interface definition
 * Used by both Electron app (main process) and Web Demo (mock backend)
 */

export interface ElectronAPI {
  // Configuration management
  getConfig: () => Promise<{
    recordingsDir: string;
    d365Url: string | undefined;
    storageStatePath: string | undefined;
    isSetupComplete: boolean;
  }>;
  chooseRecordingsDir: () => Promise<string | null>;
  saveD365Url: (url: string) => Promise<void>;
  createStorageState: (credentials: { username: string; password: string; d365Url: string }) => Promise<{ success: boolean; error?: string }>;
  onLoginProgress: (callback: (message: string) => void) => void;
  removeLoginProgressListener: () => void;

  // Authentication (legacy)
  checkAuth: () => Promise<{ needsLogin: boolean; hasStorageState: boolean }>;
  login: (credentials: { username: string; password: string; d365Url?: string }) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  startSession: (config: {
    flowName: string;
    module: string;
    targetRepo?: string;
    d365Url?: string;
    storageStatePath?: string;
  }) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  
  stopSession: (sessionId: string) => Promise<{ success: boolean }>;
  
  getSessionSteps: (sessionId: string) => Promise<Array<{
    order: number;
    description: string;
    action: string;
    pageId: string;
    locator: any;
    value?: string;
  }>>;
  
  updateStep: (sessionId: string, stepOrder: number, description: string) => Promise<{ success: boolean }>;
  
  // Code generation
  generateCode: (
    sessionId: string,
    outputConfig: {
      pagesDir: string;
      testsDir: string;
      module?: string;
    }
  ) => Promise<{ success: boolean; files?: string[]; error?: string }>;
  
  // Browser control
  closeBrowser: () => Promise<{ success: boolean }>;

  // Test execution
  listSpecFiles: () => Promise<{ success: boolean; specFiles?: string[]; error?: string }>;
  findDataFile: (specFilePath: string) => Promise<{ 
    success: boolean; 
    dataFilePath?: string; 
    parameters?: string[];
    hasDataFile?: boolean;
    error?: string 
  }>;
  loadTestData: (dataFilePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  saveTestData: (dataFilePath: string, data: any) => Promise<{ success: boolean; error?: string }>;
  runTestLocal: (specFilePath: string) => Promise<{ success: boolean; error?: string }>;
  runTestBrowserStack: (specFilePath: string) => Promise<{ success: boolean; error?: string }>;
  stopTest: () => Promise<{ success: boolean }>;
  onTestOutput: (callback: (data: string) => void) => void;
  onTestError: (callback: (data: string) => void) => void;
  onTestClose: (callback: (code: number | null) => void) => void;
  removeTestListeners: () => void;

  // BrowserStack settings
  getBrowserStackCredentials: () => Promise<{ username: string | undefined; accessKey: string | undefined }>;
  setBrowserStackCredentials: (username: string, accessKey: string) => Promise<{ success: boolean }>;

  // Storage state checker
  checkStorageState: () => Promise<{
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
  }>;

  // ============================================================================
  // v1.5 IPC Methods
  // ============================================================================

  // Codegen control
  codegenStart: (request: { envUrl: string; workspacePath: string; storageStatePath: string }) =>
    Promise<{ success: boolean; pid?: number; error?: string }>;
  codegenStop: () => Promise<{ success: boolean; error?: string; rawCode?: string }>;
  onCodegenCodeUpdate: (callback: (update: { workspacePath: string; content: string; timestamp: string }) => void) => void;
  removeCodegenCodeUpdateListener: () => void;

  // Recorder control (QA Studio Recorder)
  recorderStart: (request: { envUrl: string; workspacePath: string; storageStatePath: string }) =>
    Promise<{ success: boolean; pid?: number; error?: string }>;
  recorderStop: () => Promise<{ success: boolean; error?: string; rawCode?: string }>;
  recorderCompileSteps: (steps: any[]) => Promise<string>;
  onRecorderCodeUpdate: (callback: (update: { workspacePath: string; content: string; timestamp: string }) => void) => void;
  removeRecorderCodeUpdateListener: () => void;

  // Locator Browser
  locatorBrowseStart: (request: { workspacePath: string; storageStatePath?: string; url?: string }) =>
    Promise<{ success: boolean; error?: string }>;
  locatorBrowseStop: () => Promise<{ success: boolean; error?: string }>;
  onLocatorBrowseElementHover: (callback: (data: any) => void) => void;
  onLocatorBrowseElementClick: (callback: (data: any) => void) => void;
  onLocatorBrowseClickedElements: (callback: (data: any) => void) => void;
  removeLocatorBrowseListeners: () => void;
  onLocatorStatusUpdated: (callback: (data: any) => void) => void;
  removeLocatorStatusUpdatedListener: () => void;

  // Locator cleanup
  locatorCleanup: (request: { rawCode: string }) => 
    Promise<{ success: boolean; cleanedCode?: string; mapping?: Array<{ original: string; upgraded: string }>; error?: string }>;

  // Parameter detection
  paramsDetect: (request: { cleanedCode: string }) => 
    Promise<{ success: boolean; candidates?: Array<{ id: string; label: string; originalValue: string; suggestedName: string }>; error?: string }>;

  // Spec writing
  specWrite: (request: { workspacePath: string; testName: string; module?: string; cleanedCode: string; selectedParams: Array<{ id: string; variableName: string }> }) => 
    Promise<{ success: boolean; specPath?: string; metaPath?: string; error?: string }>;

  // Data writing
  dataWrite: (request: { workspacePath: string; testName: string; rows: Array<any> }) => 
    Promise<{ success: boolean; dataPath?: string; error?: string }>;

  // Test library
  workspaceTestsList: (request: { workspacePath: string }) => 
    Promise<{ success: boolean; tests?: Array<{ testName: string; module?: string; specPath: string; dataPath?: string; metaPath?: string; datasetCount: number; lastRunAt?: string; lastStatus: 'never_run' | 'passed' | 'failed' | 'running'; tags?: string[] }>; error?: string }>;

  // Test execution
  testRun: (request: { workspacePath: string; specPath: string; runMode?: 'local' | 'browserstack'; target?: string; datasetFilterIds?: string[] }) => 
    Promise<{ runId: string }>;
  testStop: () => Promise<{ success: boolean }>;
  onTestRunEvents: (callback: (event: { type: 'log' | 'error' | 'status' | 'finished'; runId: string; message?: string; status?: 'started' | 'running' | 'passed' | 'failed'; exitCode?: number; timestamp: string }) => void) => void;
  removeTestRunEventsListener: () => void;
  onTestUpdate: (callback: (data: { workspacePath: string; testName: string; status: 'passed' | 'failed'; lastRunAt: string; lastRunId: string }) => void) => void;
  removeTestUpdateListener: () => void;

  // Trace & Report
  traceOpen: (request: { workspacePath: string; traceZipPath: string }) => 
    Promise<{ success: boolean; url?: string; error?: string }>;
  traceOpenWindow: (request: { workspacePath: string; traceZipPath: string }) => 
    Promise<{ success: boolean; error?: string }>;
  reportOpen: (request: { workspacePath: string; reportPath?: string; runId?: string }) => 
    Promise<{ success: boolean; url?: string; error?: string }>;
  reportOpenWindow: (request: { workspacePath: string; reportPath?: string; runId?: string }) => 
    Promise<{ success: boolean; error?: string }>;

  // Run metadata
  runsList: (request: { workspacePath: string; testName?: string }) => 
    Promise<{ success: boolean; runs?: Array<{ runId: string; testName: string; specRelPath: string; status: 'passed' | 'failed' | 'skipped' | 'running'; startedAt: string; finishedAt?: string; tracePaths?: string[]; reportPath?: string; allureReportPath?: string }>; error?: string }>;
  runGet: (request: { workspacePath: string; runId: string }) => 
    Promise<{ success: boolean; run?: { runId: string; testName: string; specRelPath: string; status: 'passed' | 'failed' | 'skipped' | 'running'; startedAt: string; finishedAt?: string; tracePaths?: string[]; reportPath?: string; allureReportPath?: string }; error?: string }>;

  // Workspace management
  workspacesList: () => Promise<{ success: boolean; workspaces?: Array<{ id: string; name: string; type: 'd365' | 'salesforce' | 'generic'; version: string; createdWith: string; lastOpenedWith: string; createdAt: string; updatedAt: string; workspacePath: string; settings?: Record<string, unknown> }>; error?: string }>;
  workspacesCreate: (request: { name: string; type?: 'd365' | 'salesforce' | 'generic' }) => Promise<{ success: boolean; workspace?: { id: string; name: string; type: 'd365' | 'salesforce' | 'generic'; version: string; createdWith: string; lastOpenedWith: string; createdAt: string; updatedAt: string; workspacePath: string; settings?: Record<string, unknown> }; error?: string }>;
  workspacesGetCurrent: () => Promise<{ success: boolean; workspace?: { id: string; name: string; type: 'd365' | 'salesforce' | 'generic'; version: string; createdWith: string; lastOpenedWith: string; createdAt: string; updatedAt: string; workspacePath: string; settings?: Record<string, unknown> } | null; error?: string }>;
  workspacesSetCurrent: (request: { workspaceId: string }) => Promise<{ success: boolean; workspace?: { id: string; name: string; type: 'd365' | 'salesforce' | 'generic'; version: string; createdWith: string; lastOpenedWith: string; createdAt: string; updatedAt: string; workspacePath: string; settings?: Record<string, unknown> }; error?: string }>;

  // v1.6: Test Details
  testGetSpec: (request: { workspacePath: string; testName: string }) => Promise<{ success: boolean; content?: string; error?: string }>;
  testParseLocators: (request: { workspacePath: string; testName: string }) => Promise<{ success: boolean; locators?: Array<{ name?: string; selector: string; type: string; lines: number[] }>; error?: string }>;
  testExportBundle: (request: { workspacePath: string; testName: string }) => Promise<{ success: boolean; bundlePath?: string; error?: string }>;
  testUpdateSpec: (request: any) => Promise<{ success: boolean; error?: string; updatedLines?: number[] }>;
  testAddStep: (request: any) => Promise<{ success: boolean; error?: string; updatedLines?: number[] }>;
  testDeleteStep: (request: any) => Promise<{ success: boolean; error?: string; updatedLines?: number[] }>;
  testReorderSteps: (request: any) => Promise<{ success: boolean; error?: string; updatedLines?: number[] }>;

  // v1.6: Data operations
  dataRead: (request: { workspacePath: string; testName: string }) => Promise<{ success: boolean; rows?: Array<any>; error?: string }>;
  dataImportExcel: (request: { workspacePath: string; testName: string }) => Promise<{ success: boolean; error?: string }>;

  // v1.6: Workspace locators
  workspaceLocatorsList: (request: { workspacePath: string }) => Promise<{ success: boolean; locators?: Array<{ locator: string; type: string; testCount: number; usedInTests: string[]; status?: { state: string; note?: string; updatedAt: string; lastTest?: string } }>; error?: string }>;
  workspaceLocatorsUpdate: (request: { workspacePath: string; originalLocator: string; updatedLocator: string; type: string; tests: string[] }) => Promise<{ success: boolean; updatedTests?: string[]; error?: string }>;
  workspaceLocatorsSetStatus: (request: { workspacePath: string; locatorKey: string; status: string; note?: string; testName?: string }) => Promise<{ success: boolean; status?: { state: string; note?: string; updatedAt: string; lastTest?: string }; error?: string }>;
  workspaceLocatorsAdd: (request: { workspacePath: string; locator: string; type: string; tests?: string[] }) => Promise<{ success: boolean; error?: string }>;

  // v1.6: Settings
  settingsGetBrowserStack: (request: { workspacePath: string }) => Promise<{ success: boolean; settings?: { username: string; accessKey: string; project?: string; buildPrefix?: string }; error?: string }>;
  settingsUpdateBrowserStack: (request: { workspacePath: string; settings: { username: string; accessKey: string; project?: string; buildPrefix?: string } }) => Promise<{ success: boolean; error?: string }>;
  clearBrowserStackTMSession: () => Promise<{ success: boolean; error?: string }>;
  settingsGetRecordingEngine: (request: { workspacePath: string }) => Promise<{ success: boolean; recordingEngine?: 'playwright' | 'qaStudio'; error?: string }>;
  settingsUpdateRecordingEngine: (request: { workspacePath: string; recordingEngine: 'playwright' | 'qaStudio' }) => Promise<{ success: boolean; error?: string }>;
  settingsGetAIConfig: () => Promise<{ success: boolean; config?: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }; error?: string }>;
  settingsUpdateAIConfig: (request: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  settingsGetDevMode: () => Promise<{ success: boolean; devMode?: boolean; error?: string }>;
  settingsUpdateDevMode: (request: { devMode: boolean }) => Promise<{ success: boolean; error?: string }>;

  // RAG Chat
  ragChat: (request: { workspacePath: string; testName: string; messages: Array<{ role: string; content: string }> }) => Promise<{ success: boolean; response?: string; error?: string }>;

  // Dev mode utilities
  devOpenFolder: (request: { path: string }) => Promise<{ success: boolean; error?: string }>;
  devClearTempFiles: (request: { workspacePath: string }) => Promise<{ success: boolean; error?: string; deletedCount?: number }>;
  devClearOldTraces: (request: { workspacePath: string; daysToKeep?: number }) => Promise<{ success: boolean; error?: string; deletedCount?: number }>;
  devClearOldReports: (request: { workspacePath: string; daysToKeep?: number }) => Promise<{ success: boolean; error?: string; deletedCount?: number }>;
  devGetWorkspaceStats: (request: { workspacePath: string }) => Promise<{ success: boolean; stats?: any; error?: string }>;
  devRebuildWorkspaceStructure: (request: { workspacePath: string }) => Promise<{ success: boolean; error?: string }>;
  devGetRawConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  devGetStorageStatePath: () => Promise<{ success: boolean; path?: string; error?: string }>;

  // Playwright environment
  playwrightCheckEnv: (request: { workspacePath: string }) => Promise<{
    success: boolean;
    cliAvailable?: boolean;
    browsersInstalled?: boolean;
    error?: string;
    details?: { version?: string; browsersDir?: string };
  }>;
  playwrightInstall: (request: { workspacePath: string }) => Promise<{
    success: boolean;
    error?: string;
    logPath?: string;
  }>;
}

