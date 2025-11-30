/**
 * Mock ElectronAPI implementation for web demo
 * Provides fake responses using mock data
 */

import type { ElectronAPI } from '../../../src/types/electron-api';
import { DesktopOnlyError } from './errors';
import { mockStore } from './mock-store';

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to load mock data from JSON files
async function loadMockData<T>(filename: string): Promise<T> {
  try {
    const response = await fetch(`/mock-data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load mock data: ${filename}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[MockBackend] Failed to load ${filename}, using fallback`, error);
    // Return empty/default data as fallback
    return {} as T;
  }
}

export const mockElectronAPI: ElectronAPI = {
  // Configuration management
  async getConfig() {
    await delay(100);
    const workspace = mockStore.getCurrentWorkspace();
    return {
      recordingsDir: workspace?.workspacePath || '/mock-workspace',
      d365Url: 'https://demo.sandbox.operations.dynamics.com/',
      storageStatePath: '/mock-workspace/storage_state/d365.json',
      isSetupComplete: true,
    };
  },

  async chooseRecordingsDir() {
    await delay(300);
    // In demo, just return a mock path
    return '/mock-workspace';
  },

  async saveD365Url() {
    await delay(100);
    // Mock - no-op
  },

  async createStorageState() {
    await delay(2000);
    return { success: true };
  },

  onLoginProgress() {
    // Mock - no-op for event listeners in demo
  },

  removeLoginProgressListener() {
    // Mock - no-op
  },

  // Authentication
  async checkAuth() {
    await delay(100);
    return {
      needsLogin: false,
      hasStorageState: true,
    };
  },

  async login() {
    await delay(1500);
    return { success: true };
  },

  // Session management (legacy - not used in v1.5+)
  async startSession() {
    await delay(300);
    return { success: true, sessionId: 'mock-session-1' };
  },

  async stopSession() {
    await delay(100);
    return { success: true };
  },

  async getSessionSteps() {
    await delay(100);
    const stepsData = await loadMockData<any>('steps.json');
    return stepsData.steps || [];
  },

  async updateStep() {
    await delay(100);
    return { success: true };
  },

  // Code generation (legacy)
  async generateCode() {
    await delay(500);
    return {
      success: true,
      files: ['mock-page.ts', 'mock-test.spec.ts'],
    };
  },

  async closeBrowser() {
    await delay(100);
    return { success: true };
  },

  // Test execution (legacy)
  async listSpecFiles() {
    await delay(100);
    const testsData = await loadMockData<any>('tests.json');
    return {
      success: true,
      specFiles: (testsData.tests || []).map((t: any) => t.specPath),
    };
  },

  async findDataFile() {
    await delay(100);
    return {
      success: true,
      dataFilePath: 'tests/d365/data/MockTestData.json',
      parameters: ['customerName', 'orderNumber'],
      hasDataFile: true,
    };
  },

  async loadTestData() {
    await delay(100);
    const datasetsData = await loadMockData<any>('datasets.json');
    return {
      success: true,
      data: datasetsData.rows || [],
    };
  },

  async saveTestData() {
    await delay(200);
    return { success: true };
  },

  async runTestLocal() {
    throw new DesktopOnlyError();
  },

  async runTestBrowserStack() {
    throw new DesktopOnlyError();
  },

  async stopTest() {
    await delay(100);
    return { success: true };
  },

  onTestOutput() {
    // Mock - no-op
  },

  onTestError() {
    // Mock - no-op
  },

  onTestClose() {
    // Mock - no-op
  },

  removeTestListeners() {
    // Mock - no-op
  },

  // BrowserStack settings
  async getBrowserStackCredentials() {
    await delay(100);
    return {
      username: undefined,
      accessKey: undefined,
    };
  },

  async setBrowserStackCredentials() {
    await delay(100);
    return { success: true };
  },

  // Storage state checker
  async checkStorageState() {
    await delay(300);
    return {
      status: 'valid' as const,
      message: 'Storage state is valid and working',
      nextSteps: ['You can start recording sessions'],
      storageStatePath: '/mock-workspace/storage_state/d365.json',
      details: {
        exists: true,
        hasCookies: true,
        cookieCount: 5,
        canAccessD365: true,
      },
    };
  },

  // ============================================================================
  // v1.5 IPC Methods
  // ============================================================================

  // Codegen control
  async codegenStart(request) {
    await delay(300);
    mockStore.setIsRecording(true);
    // Start simulated code updates
    setTimeout(() => {
      const listeners = mockStore.getCodegenListeners();
      const codeData = loadMockData<any>('code-snippets.json');
      codeData.then(data => {
        listeners.forEach(cb => {
          cb({
            workspacePath: request.workspacePath,
            content: data.codegen || '// Mock codegen output\nawait page.goto("https://demo.example.com");',
            timestamp: new Date().toISOString(),
          });
        });
      });
    }, 1000);
    return {
      success: true,
      pid: 12345,
    };
  },

  async codegenStop() {
    await delay(200);
    mockStore.setIsRecording(false);
    const codeData = await loadMockData<any>('code-snippets.json');
    return {
      success: true,
      rawCode: codeData.codegen || '// Mock codegen output',
    };
  },

  onCodegenCodeUpdate(callback) {
    mockStore.getCodegenListeners().add(callback);
  },

  removeCodegenCodeUpdateListener() {
    mockStore.getCodegenListeners().clear();
  },

  // Recorder control (QA Studio Recorder)
  async recorderStart(request) {
    await delay(300);
    mockStore.setIsRecording(true);
    // Start simulated recorder updates
    setTimeout(() => {
      const listeners = mockStore.getRecorderListeners();
      const codeData = loadMockData<any>('code-snippets.json');
      codeData.then(data => {
        listeners.forEach(cb => {
          cb({
            workspacePath: request.workspacePath,
            content: data.recorder || '// Mock recorder output\nawait page.getByRole("button", { name: "Submit" }).click();',
            timestamp: new Date().toISOString(),
          });
        });
      });
    }, 500);
    return {
      success: true,
      pid: 12346,
    };
  },

  async recorderStop() {
    await delay(200);
    mockStore.setIsRecording(false);
    const codeData = await loadMockData<any>('code-snippets.json');
    return {
      success: true,
      rawCode: codeData.recorder || '// Mock recorder output',
    };
  },

  async recorderCompileSteps(steps) {
    await delay(100);
    return steps.map((s: any, i: number) => `// Step ${i + 1}\nawait ${s.action}();`).join('\n\n');
  },

  onRecorderCodeUpdate(callback) {
    mockStore.getRecorderListeners().add(callback);
  },

  removeRecorderCodeUpdateListener() {
    mockStore.getRecorderListeners().clear();
  },

  // Locator Browser
  async locatorBrowseStart() {
    await delay(300);
    return { success: true };
  },

  async locatorBrowseStop() {
    await delay(100);
    return { success: true };
  },

  onLocatorBrowseElementHover() {
    // Mock - no-op
  },

  onLocatorBrowseElementClick() {
    // Mock - no-op
  },

  onLocatorBrowseClickedElements() {
    // Mock - no-op
  },

  removeLocatorBrowseListeners() {
    // Mock - no-op
  },

  onLocatorStatusUpdated() {
    // Mock - no-op
  },

  removeLocatorStatusUpdatedListener() {
    // Mock - no-op
  },

  // Locator cleanup
  async locatorCleanup(request) {
    await delay(300);
    return {
      success: true,
      cleanedCode: request.rawCode.replace(/page\.locator\(['"]#.*?['"]\)/g, 'page.getByRole("button")'),
      mapping: [],
    };
  },

  // Parameter detection
  async paramsDetect(request) {
    await delay(300);
    return {
      success: true,
      candidates: [
        {
          id: '1',
          label: 'Customer Name',
          originalValue: 'Acme Corp',
          suggestedName: 'customerName',
        },
        {
          id: '2',
          label: 'Order Number',
          originalValue: 'SO-12345',
          suggestedName: 'orderNumber',
        },
      ],
    };
  },

  // Spec writing
  async specWrite(request) {
    await delay(400);
    return {
      success: true,
      specPath: `tests/d365/specs/${request.testName}/${request.testName}.spec.ts`,
      metaPath: `tests/d365/specs/${request.testName}/${request.testName}.meta.json`,
    };
  },

  // Data writing
  async dataWrite(request) {
    await delay(200);
    return {
      success: true,
      dataPath: `tests/d365/data/${request.testName}Data.json`,
    };
  },

  // Test library
  async workspaceTestsList(request) {
    await delay(200);
    const testsData = await loadMockData<any>('tests.json');
    return {
      success: true,
      tests: testsData.tests || [],
    };
  },

  // Test execution
  async testRun(request) {
    throw new DesktopOnlyError();
  },

  async testStop() {
    await delay(100);
    return { success: true };
  },

  onTestRunEvents() {
    // Mock - no-op
  },

  removeTestRunEventsListener() {
    // Mock - no-op
  },

  onTestUpdate() {
    // Mock - no-op
  },

  removeTestUpdateListener() {
    // Mock - no-op
  },

  // Trace & Report
  async traceOpen() {
    throw new DesktopOnlyError();
  },

  async traceOpenWindow() {
    throw new DesktopOnlyError();
  },

  async reportOpen() {
    throw new DesktopOnlyError();
  },

  async reportOpenWindow() {
    throw new DesktopOnlyError();
  },

  // Run metadata
  async runsList(request) {
    await delay(200);
    const runsData = await loadMockData<any>('runs.json');
    let runs = runsData.runs || [];
    if (request.testName) {
      runs = runs.filter((r: any) => r.testName === request.testName);
    }
    return {
      success: true,
      runs,
    };
  },

  async runGet(request) {
    await delay(100);
    const runsData = await loadMockData<any>('runs.json');
    const run = (runsData.runs || []).find((r: any) => r.runId === request.runId);
    if (!run) {
      return { success: false, error: 'Run not found' };
    }
    return {
      success: true,
      run,
    };
  },

  // Workspace management
  async workspacesList() {
    await delay(200);
    const workspaceData = await loadMockData<any>('workspace.json');
    return {
      success: true,
      workspaces: workspaceData.workspaces || [
        {
          id: 'demo-workspace-1',
          name: 'Demo D365 Workspace',
          type: 'd365' as const,
          version: '1.5.0',
          createdWith: '1.5.0',
          lastOpenedWith: '1.5.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspacePath: '/mock-workspace',
        },
      ],
    };
  },

  async workspacesCreate(request) {
    await delay(300);
    const workspace = {
      id: `demo-workspace-${Date.now()}`,
      name: request.name,
      type: (request.type || 'd365') as 'd365' | 'salesforce' | 'generic',
      version: '1.5.0',
      createdWith: '1.5.0',
      lastOpenedWith: '1.5.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspacePath: `/mock-workspace-${Date.now()}`,
    };
    mockStore.setCurrentWorkspace(workspace);
    return {
      success: true,
      workspace,
    };
  },

  async workspacesGetCurrent() {
    await delay(100);
    const workspace = mockStore.getCurrentWorkspace();
    if (!workspace) {
      // Return default demo workspace
      const defaultWorkspace = {
        id: 'demo-workspace-1',
        name: 'Demo D365 Workspace',
        type: 'd365' as const,
        version: '1.5.0',
        createdWith: '1.5.0',
        lastOpenedWith: '1.5.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspacePath: '/mock-workspace',
      };
      mockStore.setCurrentWorkspace(defaultWorkspace);
      return {
        success: true,
        workspace: defaultWorkspace,
      };
    }
    return {
      success: true,
      workspace,
    };
  },

  async workspacesSetCurrent(request) {
    await delay(100);
    const workspacesData = await loadMockData<any>('workspace.json');
    const allWorkspaces = workspacesData.workspaces || [];
    const workspace = allWorkspaces.find((w: any) => w.id === request.workspaceId) || mockStore.getCurrentWorkspace();
    if (workspace) {
      mockStore.setCurrentWorkspace(workspace);
      return {
        success: true,
        workspace,
      };
    }
    return {
      success: false,
      error: 'Workspace not found',
    };
  },

  // v1.6: Test Details
  async testGetSpec(request) {
    await delay(200);
    const codeData = await loadMockData<any>('code-snippets.json');
    return {
      success: true,
      content: codeData.spec || '// Mock test spec\nimport { test } from "@playwright/test";',
    };
  },

  async testParseLocators(request) {
    await delay(200);
    const locatorsData = await loadMockData<any>('locators.json');
    return {
      success: true,
      locators: locatorsData.locators || [],
    };
  },

  async testExportBundle() {
    throw new DesktopOnlyError();
  },

  async testUpdateSpec() {
    await delay(200);
    return {
      success: true,
      updatedLines: [1, 2, 3],
    };
  },

  async testAddStep() {
    await delay(200);
    return {
      success: true,
      updatedLines: [10, 11],
    };
  },

  async testDeleteStep() {
    await delay(200);
    return {
      success: true,
      updatedLines: [],
    };
  },

  async testReorderSteps() {
    await delay(200);
    return {
      success: true,
      updatedLines: [1, 2, 3, 4, 5],
    };
  },

  // v1.6: Data operations
  async dataRead(request) {
    await delay(200);
    const datasetsData = await loadMockData<any>('datasets.json');
    return {
      success: true,
      rows: datasetsData.rows || [],
    };
  },

  async dataImportExcel() {
    throw new DesktopOnlyError();
  },

  // v1.6: Workspace locators
  async workspaceLocatorsList(request) {
    await delay(200);
    const locatorsData = await loadMockData<any>('locators.json');
    // Transform mock data: map 'tests' to 'usedInTests' and add 'testCount'
    const locators = (locatorsData.locators || []).map((loc: any) => ({
      ...loc,
      usedInTests: loc.tests || loc.usedInTests || [],
      testCount: (loc.tests || loc.usedInTests || []).length,
    }));
    return {
      success: true,
      locators,
    };
  },

  async workspaceLocatorsUpdate() {
    await delay(200);
    return {
      success: true,
      updatedTests: ['Test1', 'Test2'],
    };
  },

  async workspaceLocatorsSetStatus() {
    await delay(200);
    return {
      success: true,
      status: {
        state: 'healthy',
        note: 'Mock status update',
        updatedAt: new Date().toISOString(),
      },
    };
  },

  async workspaceLocatorsAdd() {
    await delay(200);
    return { success: true };
  },

  // v1.6: Settings
  async settingsGetBrowserStack() {
    await delay(100);
    return {
      success: true,
      settings: {
        username: '',
        accessKey: '',
        project: '',
        buildPrefix: '',
      },
    };
  },

  async settingsUpdateBrowserStack() {
    await delay(200);
    return { success: true };
  },

  async settingsGetRecordingEngine() {
    await delay(100);
    return {
      success: true,
      recordingEngine: 'qaStudio' as const,
    };
  },

  async settingsUpdateRecordingEngine() {
    await delay(200);
    return { success: true };
  },

  async settingsGetAIConfig() {
    await delay(100);
    return {
      success: true,
      config: {
        provider: 'openai' as const,
        apiKey: '',
        model: 'gpt-4',
        baseUrl: undefined,
      },
    };
  },

  async settingsUpdateAIConfig() {
    await delay(200);
    return { success: true };
  },

  async settingsGetDevMode() {
    await delay(100);
    return {
      success: true,
      devMode: false,
    };
  },

  async settingsUpdateDevMode() {
    await delay(200);
    return { success: true };
  },

  // RAG Chat
  async ragChat(request) {
    await delay(1000);
    const aiData = await loadMockData<any>('ai-explanations.json');
    return {
      success: true,
      response: aiData.response || 'This is a mock AI response. In the desktop app, this would use real AI analysis.',
    };
  },

  // Dev mode utilities
  async devOpenFolder() {
    throw new DesktopOnlyError();
  },

  async devClearTempFiles() {
    throw new DesktopOnlyError();
  },

  async devClearOldTraces() {
    throw new DesktopOnlyError();
  },

  async devClearOldReports() {
    throw new DesktopOnlyError();
  },

  async devGetWorkspaceStats() {
    throw new DesktopOnlyError();
  },

  async devRebuildWorkspaceStructure() {
    throw new DesktopOnlyError();
  },

  async devGetRawConfig() {
    throw new DesktopOnlyError();
  },

  async devGetStorageStatePath() {
    throw new DesktopOnlyError();
  },
};

