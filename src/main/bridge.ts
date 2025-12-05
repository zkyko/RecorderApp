import { ipcMain, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, SpawnOptions } from 'child_process';
import { safeRemoveSync } from './utils/file-utils';
import { runPlaywright, runPlaywrightOnce, getRuntimeInfo, hasBundledRuntime, getBundledRuntimePaths, getNodeVersion, getInstalledBrowsers } from './utils/playwrightRuntime';
import { SessionManager } from '../core/session/session-manager';
import { BrowserManager } from '../core/playwright/browser-manager';
import { RecorderEngine } from '../core/recorder/recorder-engine';
import { POMGenerator } from '../generators/pom-generator';
import { SpecGenerator } from '../generators/spec-generator';
import { CodeFormatter } from '../generators/code-formatter';
import { SessionConfig, OutputConfig, RecordedStep } from '../types';
import { ConfigManager } from './config-manager';
// v1.5 services
import { CodegenService } from './services/codegen-service';
import { RecorderService } from './services/recorder-service';
import { LocatorCleanupService } from './services/locator-cleanup-service';
import { ParameterDetector } from './services/parameter-detector';
import { SpecWriter } from './services/spec-writer';
import { DataWriter } from './services/data-writer';
import { TestRunner } from './services/test-runner';
import { TraceServer } from './services/trace-server';
import { WorkspaceManager } from './services/workspace-manager';
import { LocatorMaintenanceService } from './services/locator-maintenance';
import { RAGService } from './services/rag-service';
import { JiraService } from './services/jiraService';
import { BrowserStackTmService } from './services/browserstackTmService';
import { BrowserStackAutomateService } from './services/browserstackAutomateService';
import { SpecUpdater } from './services/spec-updater';
import { LocatorBrowserService } from './services/locator-browser-service';
import { runAllElectronTests } from '../ElectronTest';
import {
  CodegenStartRequest,
  LocatorCleanupRequest,
  ParamDetectRequest,
  SpecWriteRequest,
  DataWriteRequest,
  TestListRequest,
  TestRunRequest,
  TestRunMeta,
  RunIndex,
  TraceOpenRequest,
  ReportOpenRequest,
  TestSummary,
  TestMeta,
  WorkspaceListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceGetCurrentResponse,
  WorkspaceSetCurrentRequest,
  WorkspaceSetCurrentResponse,
  WorkspaceType,
  TestGetSpecRequest,
  TestGetSpecResponse,
  TestParseLocatorsRequest,
  TestParseLocatorsResponse,
  LocatorInfo,
  TestExportBundleRequest,
  TestExportBundleResponse,
  DataReadRequest,
  DataReadResponse,
  DataImportExcelRequest,
  DataImportExcelResponse,
  WorkspaceLocatorsListRequest,
  WorkspaceLocatorsListResponse,
  LocatorIndexEntry,
  LocatorUpdateRequest,
  LocatorUpdateResponse,
  LocatorStatusUpdateRequest,
  LocatorStatusUpdateResponse,
  SettingsGetBrowserStackRequest,
  SettingsGetBrowserStackResponse,
  SettingsUpdateBrowserStackRequest,
  SettingsUpdateBrowserStackResponse,
  BrowserStackSettings,
  SettingsGetRecordingEngineRequest,
  SettingsGetRecordingEngineResponse,
  SettingsUpdateRecordingEngineRequest,
  SettingsUpdateRecordingEngineResponse,
  RecordingEngine,
  RecorderStartRequest,
  RecorderStartResponse,
  RecorderStopResponse,
  JiraDefectContext,
} from '../types/v1.5';

/**
 * IPC bridge between React UI and Node.js core
 */
export class IPCBridge {
  private sessionManager: SessionManager;
  private browserManager: BrowserManager;
  private recorderEngine: RecorderEngine;
  private pomGenerator: POMGenerator;
  private specGenerator: SpecGenerator;
  private codeFormatter: CodeFormatter;
  private currentSessionId: string | null = null;
  private configManager: ConfigManager;
  // v1.5 services
  private codegenService: CodegenService;
  private recorderService: RecorderService;
  private locatorCleanupService: LocatorCleanupService;
  private parameterDetector: ParameterDetector;
  private specWriter: SpecWriter;
  private dataWriter: DataWriter;
  private testRunner: TestRunner | null = null;
  private traceServer: TraceServer;
  private mainWindow: BrowserWindow | null = null;
  private workspaceManager: WorkspaceManager;
  private locatorMaintenance: LocatorMaintenanceService;
  private ragService: RAGService;
  private specUpdater: SpecUpdater;
  private locatorBrowser: LocatorBrowserService;
  private jiraService: JiraService;
  private browserstackTmService: BrowserStackTmService;
  private browserstackAutomateService: BrowserStackAutomateService;

  constructor(configManager: ConfigManager, workspaceManager: WorkspaceManager, mainWindow: BrowserWindow | null = null) {
    this.configManager = configManager;
    this.workspaceManager = workspaceManager;
    this.mainWindow = mainWindow;
    this.sessionManager = new SessionManager();
    this.browserManager = new BrowserManager();
    // RecorderEngine will be created per session with module context
    this.recorderEngine = new RecorderEngine();
    this.pomGenerator = new POMGenerator();
    this.specGenerator = new SpecGenerator();
    this.codeFormatter = new CodeFormatter();
    // v1.5 services
    this.codegenService = new CodegenService();
    this.codegenService.setMainWindow(mainWindow);
    this.recorderService = new RecorderService();
    this.recorderService.setMainWindow(mainWindow);
    this.locatorCleanupService = new LocatorCleanupService();
    this.parameterDetector = new ParameterDetector();
    this.specWriter = new SpecWriter(workspaceManager, new BrowserStackTmService(configManager));
    this.dataWriter = new DataWriter();
    this.traceServer = new TraceServer();
    this.locatorMaintenance = new LocatorMaintenanceService();
    this.ragService = new RAGService(configManager);
    this.specUpdater = new SpecUpdater();
    this.locatorBrowser = new LocatorBrowserService();
    this.jiraService = new JiraService(configManager);
    this.browserstackTmService = new BrowserStackTmService(configManager);
    this.browserstackAutomateService = new BrowserStackAutomateService(configManager);
    this.locatorBrowser.setMainWindow(mainWindow);
  }

  /**
   * Set main window (needed for test runner events)
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
    this.testRunner = new TestRunner(window, this.locatorMaintenance, this.browserstackTmService);
    this.codegenService.setMainWindow(window);
    if (this.recorderService) {
      this.recorderService.setMainWindow(window);
    }
    // Also set main window for locator browser
    if (this.locatorBrowser) {
      this.locatorBrowser.setMainWindow(window);
    }
  }

  /**
   * Get storage state path from config or default
   * @param workspaceType Optional workspace type to determine which storage state to use
   * @param workspacePath Optional workspace path for workspace-specific storage state
   */
  private getStorageStatePath(workspaceType?: string, workspacePath?: string): string {
    // For web-demo workspaces, use workspace-specific web.json
    if (workspaceType === 'web-demo' && workspacePath) {
      const webStorageStatePath = path.join(workspacePath, 'storage_state', 'web.json');
      if (fs.existsSync(webStorageStatePath)) {
        return webStorageStatePath;
      }
    }
    
    // For D365 workspaces or default, use config or default D365 storage state
    const config = this.configManager.getConfig();
    if (config.storageStatePath && fs.existsSync(config.storageStatePath)) {
      return config.storageStatePath;
    }
    // Fallback to config manager's default (D365)
    return this.configManager.getStorageStatePath();
  }

  /**
   * Get D365 URL from config or env
   */
  private getD365Url(config?: { d365Url?: string }): string | null {
    const appConfig = this.configManager.getConfig();
    return config?.d365Url || appConfig.d365Url || process.env.D365_URL || null;
  }

  /**
   * Check if authentication is needed
   */
  checkAuthentication(): { needsLogin: boolean; hasStorageState: boolean } {
    const storageStatePath = this.getStorageStatePath();
    const hasStorageState = this.browserManager.isStorageStateValid(storageStatePath);
    
    // If we have a valid storage state, we don't need login
    // If we don't have storage state, we'll need login (user will enter credentials in UI)
    return {
      needsLogin: !hasStorageState,
      hasStorageState,
    };
  }

  /**
   * Check storage state and determine next steps
   * @param workspaceType Optional workspace type ('d365' | 'web-demo')
   * @param workspacePath Optional workspace path for workspace-specific storage state
   */
  async checkStorageState(workspaceType?: string, workspacePath?: string): Promise<{
    status: 'valid' | 'missing' | 'invalid' | 'expired' | 'error';
    message: string;
    nextSteps: string[];
    storageStatePath: string;
    details?: any;
    workspaceType?: string;
  }> {
    const storageStatePath = this.getStorageStatePath(workspaceType, workspacePath);
    const isWebDemo = workspaceType === 'web-demo';
    
    // For web-demo, get web URL from workspace settings
    let testUrl: string | null = null;
    if (isWebDemo && workspacePath) {
      try {
        const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
        if (fs.existsSync(workspaceJsonPath)) {
          const workspaceMeta = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8'));
          const settings = workspaceMeta.settings || {};
          testUrl = settings.baseUrl || null;
        }
      } catch (error: any) {
        console.warn('[Bridge] Failed to read workspace settings:', error.message);
      }
    } else {
      // For D365, use D365 URL
      testUrl = this.getD365Url() || process.env.D365_URL || '';
    }
    
    if (!testUrl) {
      return {
        status: 'error',
        message: isWebDemo ? 'Web URL not configured in workspace settings' : 'D365 URL not configured',
        nextSteps: isWebDemo 
          ? ['Configure baseUrl in workspace settings']
          : ['Configure D365 URL in settings'],
        storageStatePath,
        workspaceType,
      };
    }

    if (!fs.existsSync(storageStatePath)) {
      return {
        status: 'missing',
        message: 'Storage state file does not exist',
        nextSteps: isWebDemo
          ? [
              'Go to Record screen',
              'Click "Login to FH Web" button',
              'Enter your web application credentials',
            ]
          : [
              'Go to Setup screen',
              'Enter D365 URL and credentials',
              'Click "Sign in to D365" to create storage state',
            ],
        storageStatePath,
        workspaceType,
      };
    }

    // Test if storage state works
    const testResult = await this.browserManager.testStorageState(storageStatePath, testUrl, !isWebDemo);
    
    if (!testResult.isValid) {
      return {
        status: 'invalid',
        message: testResult.error || 'Storage state is invalid',
        nextSteps: isWebDemo
          ? [
              'Storage state file is corrupted or invalid',
              'Go to Record screen',
              'Click "Login to FH Web" to re-authenticate',
            ]
          : [
              'Storage state file is corrupted or invalid',
              'Go to Setup screen',
              'Re-enter credentials and sign in again',
            ],
        storageStatePath,
        details: testResult.details,
        workspaceType,
      };
    }

    if (!testResult.isWorking) {
      return {
        status: 'expired',
        message: 'Storage state exists but authentication has expired',
        nextSteps: isWebDemo
          ? [
              'Go to Record screen',
              'Click "Login to FH Web" to re-authenticate',
              'This will update the storage state',
            ]
          : [
              'Go to Setup screen',
              'Re-enter credentials and sign in again',
              'This will update the storage state',
            ],
        storageStatePath,
        details: testResult.details,
        workspaceType,
      };
    }

    return {
      status: 'valid',
      message: 'Storage state is valid and working',
      nextSteps: [
        'You can start recording sessions',
        'Tests can run with authentication',
      ],
      storageStatePath,
      details: testResult.details,
      workspaceType,
    };
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    // Authentication
    ipcMain.handle('auth:check', async () => {
      return this.checkAuthentication();
    });

    // Storage state checker (workspace-aware)
    ipcMain.handle('config:check-storage-state', async (_event, workspaceType?: string, workspacePath?: string) => {
      return await this.checkStorageState(workspaceType, workspacePath);
    });

    ipcMain.handle('auth:login', async (_, credentials: { username: string; password: string; d365Url?: string }) => {
      return this.handleLogin(credentials);
    });

    // Web login (for FH web and other web applications)
    ipcMain.handle('auth:web-login', async (_, credentials: {
      webUrl: string;
      username: string;
      password: string;
      workspacePath: string;
      loginSelectors?: {
        usernameSelector?: string;
        passwordSelector?: string;
        submitSelector?: string;
        loginButtonSelector?: string;
        waitForSelector?: string;
      };
    }) => {
      return this.handleWebLogin(credentials);
    });

    // Session management
    ipcMain.handle('session:start', async (_, config: SessionConfig) => {
      return this.handleStartSession(config);
    });

    ipcMain.handle('session:stop', async (_, sessionId: string) => {
      return this.handleStopSession(sessionId);
    });

    ipcMain.handle('session:getSteps', async (_, sessionId: string) => {
      return this.handleGetSteps(sessionId);
    });

    ipcMain.handle('session:updateStep', async (_, sessionId: string, stepOrder: number, description: string) => {
      return this.handleUpdateStep(sessionId, stepOrder, description);
    });

    // Code generation
    ipcMain.handle('code:generate', async (_, sessionId: string, outputConfig: OutputConfig) => {
      return this.handleGenerateCode(sessionId, outputConfig);
    });

    // Browser control
    ipcMain.handle('browser:close', async () => {
      return this.handleCloseBrowser();
    });

    // ============================================================================
    // v1.5 IPC Handlers
    // ============================================================================

    // Codegen control
    ipcMain.handle('codegen:start', async (_, request: CodegenStartRequest) => {
      return await this.codegenService.start(request);
    });

    ipcMain.handle('codegen:stop', async () => {
      return await this.codegenService.stop();
    });

    // Recorder control (QA Studio Recorder)
    ipcMain.handle('recorder:start', async (_, request: RecorderStartRequest) => {
      return await this.recorderService.start(request);
    });

    ipcMain.handle('recorder:stop', async () => {
      return await this.recorderService.stop();
    });

    ipcMain.handle('recorder:compileSteps', async (_, steps: RecordedStep[]) => {
      return this.recorderService.compileSteps(steps);
    });

    // Locator Browser handlers
    ipcMain.handle('locator:browse:start', async (_, request: any) => {
      return await this.locatorBrowser.start(request);
    });

    ipcMain.handle('locator:browse:stop', async () => {
      return await this.locatorBrowser.stop();
    });

    // Locator cleanup
    ipcMain.handle('locator:cleanup', async (_, request: LocatorCleanupRequest) => {
      return await this.locatorCleanupService.cleanup(request);
    });

    // Parameter detection
    ipcMain.handle('params:detect', async (_, request: ParamDetectRequest) => {
      return await this.parameterDetector.detect(request);
    });

    // Spec writing
    ipcMain.handle('spec:write', async (_, request: SpecWriteRequest) => {
      return await this.specWriter.writeSpec(request);
    });

    // Data writing
    ipcMain.handle('data:write', async (_, request: DataWriteRequest) => {
      return await this.dataWriter.writeData(request);
    });

    // Test library
    ipcMain.handle('workspace:tests:list', async (_, request: TestListRequest) => {
      return await this.handleTestList(request);
    });

    // Test execution
    ipcMain.handle('test:run', async (_, request: TestRunRequest) => {
      if (!this.testRunner) {
        this.testRunner = new TestRunner(this.mainWindow, this.locatorMaintenance);
      }
      return await this.testRunner.run(request);
    });

    ipcMain.handle('test:stop', async () => {
      if (this.testRunner) {
        this.testRunner.stop();
      }
      return { success: true };
    });

    // Trace & Report
    ipcMain.handle('trace:open', async (_, request: TraceOpenRequest) => {
      return await this.traceServer.openTrace(request);
    });

    ipcMain.handle('trace:openWindow', async (_, request: TraceOpenRequest) => {
      const response = await this.traceServer.openTrace(request);
      if (response.success && response.url) {
        // Open in new BrowserWindow
        const traceWindow = new BrowserWindow({
          width: 1400,
          height: 900,
          title: 'Playwright Trace Viewer',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });
        traceWindow.loadURL(response.url);
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to open trace' };
    });

    ipcMain.handle('report:open', async (_, request: ReportOpenRequest) => {
      return await this.traceServer.openReport(request);
    });

    ipcMain.handle('report:openWindow', async (_, request: ReportOpenRequest) => {
      const response = await this.traceServer.openReport(request);
      if (response.success && response.url) {
        // Open in new BrowserWindow
        const reportWindow = new BrowserWindow({
          width: 1400,
          height: 900,
          title: 'Allure Test Report',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });
        reportWindow.loadURL(response.url);
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to open report' };
    });

    // Run metadata
    ipcMain.handle('runs:list', async (_, request: { workspacePath: string; testName?: string }) => {
      return await this.handleListRuns(request);
    });

    ipcMain.handle('run:get', async (_, request: { workspacePath: string; runId: string }) => {
      return await this.handleGetRun(request);
    });

    // ============================================================================
    // Workspace Management IPC Handlers
    // ============================================================================

    ipcMain.handle('workspaces:list', async (): Promise<WorkspaceListResponse> => {
      try {
        const workspaces = await this.workspaceManager.listWorkspaces();
        return { success: true, workspaces };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to list workspaces' };
      }
    });

    ipcMain.handle('workspaces:create', async (_, request: WorkspaceCreateRequest): Promise<WorkspaceCreateResponse> => {
      try {
        const defaultType: WorkspaceType = (request.type || 'd365') as WorkspaceType;
        const workspace = await this.workspaceManager.createWorkspace({
          name: request.name,
          type: defaultType,
        });
        return { success: true, workspace };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create workspace' };
      }
    });

    ipcMain.handle('workspaces:getCurrent', async (): Promise<WorkspaceGetCurrentResponse> => {
      try {
        const workspaceId = this.workspaceManager.getCurrentWorkspaceId();
        if (!workspaceId) {
          return { success: true, workspace: null };
        }

        // Find workspace by ID
        const workspaces = await this.workspaceManager.listWorkspaces();
        const workspace = workspaces.find(w => w.id === workspaceId);
        
        if (workspace) {
          // Ensure migrated
          const migrated = await this.workspaceManager.ensureWorkspaceMigrated(workspace);
          return { success: true, workspace: migrated };
        }

        return { success: true, workspace: null };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get current workspace' };
      }
    });

    ipcMain.handle('workspaces:setCurrent', async (_, request: WorkspaceSetCurrentRequest): Promise<WorkspaceSetCurrentResponse> => {
      try {
        await this.workspaceManager.setCurrentWorkspaceId(request.workspaceId);
        
        // Load and return the workspace
        const workspaces = await this.workspaceManager.listWorkspaces();
        const workspace = workspaces.find(w => w.id === request.workspaceId);
        
        if (!workspace) {
          return { success: false, error: `Workspace not found: ${request.workspaceId}` };
        }

        // Ensure migrated
        const migrated = await this.workspaceManager.ensureWorkspaceMigrated(workspace);
        
        // Update config manager with new workspace path
        this.configManager.setWorkspacePath(migrated.workspacePath);
        
        return { success: true, workspace: migrated };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to set current workspace' };
      }
    });

    // ============================================================================
    // v1.6: Test Details IPC Handlers
    // ============================================================================

    // Get spec file content
    ipcMain.handle('test:getSpec', async (_, request: TestGetSpecRequest): Promise<TestGetSpecResponse> => {
      try {
        // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
        const fileName = this.specGenerator.flowNameToFileName(request.testName);
        const specPath = path.join(request.workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.spec.ts`);
        if (!fs.existsSync(specPath)) {
          return { success: false, error: `Spec file not found: ${request.testName}` };
        }
        const content = fs.readFileSync(specPath, 'utf-8');
        return { success: true, content };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to read spec file' };
      }
    });

    // Update spec file steps
    ipcMain.handle('test:updateSpec', async (_, request: any): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return await this.specUpdater.updateSpec(request);
    });

    // Add step to spec file
    ipcMain.handle('test:addStep', async (_, request: any): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return await this.specUpdater.addStep(request);
    });

    // Delete step from spec file
    ipcMain.handle('test:deleteStep', async (_, request: any): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return await this.specUpdater.deleteStep(request);
    });

    // Reorder steps in spec file
    ipcMain.handle('test:reorderSteps', async (_, request: any): Promise<{ success: boolean; error?: string; updatedLines?: number[] }> => {
      return await this.specUpdater.reorderSteps(request);
    });

    // Parse locators from spec file
    ipcMain.handle('test:parseLocators', async (_, request: TestParseLocatorsRequest): Promise<TestParseLocatorsResponse> => {
      try {
        // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
        const fileName = this.specGenerator.flowNameToFileName(request.testName);
        const specPath = path.join(request.workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.spec.ts`);
        if (!fs.existsSync(specPath)) {
          return { success: false, error: `Spec file not found: ${request.testName}` };
        }
        const content = fs.readFileSync(specPath, 'utf-8');
        const lines = content.split('\n');
        const locators: LocatorInfo[] = [];
        
        // Simple regex-based parsing (can be enhanced with AST later)
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          
          // Match page.getByRole(...)
          const roleMatch = line.match(/page\.getByRole\(['"]([^'"]+)['"],\s*\{[^}]*name:\s*['"]([^'"]+)['"]/);
          if (roleMatch) {
            locators.push({
              selector: line.trim(),
              type: 'role',
              lines: [lineNum],
            });
          }
          
          // Match page.getByLabel(...)
          const labelMatch = line.match(/page\.getByLabel\(['"]([^'"]+)['"]/);
          if (labelMatch) {
            locators.push({
              selector: line.trim(),
              type: 'label',
              lines: [lineNum],
            });
          }
          
          // Match page.locator(...)
          const locatorMatch = line.match(/page\.locator\(['"]([^'"]+)['"]/);
          if (locatorMatch) {
            const selector = locatorMatch[1];
            let type: LocatorInfo['type'] = 'css';
            if (selector.includes('data-dyn-controlname')) {
              type = 'd365-controlname';
            } else if (selector.includes('data-test-id')) {
              type = 'testid';
            } else if (selector.startsWith('//') || selector.startsWith('/')) {
              type = 'xpath';
            }
            locators.push({
              selector: line.trim(),
              type,
              lines: [lineNum],
            });
          }
          
          // Match page.getByText(...)
          const textMatch = line.match(/page\.getByText\(['"]([^'"]+)['"]/);
          if (textMatch) {
            locators.push({
              selector: line.trim(),
              type: 'text',
              lines: [lineNum],
            });
          }
          
          // Match page.getByPlaceholder(...)
          const placeholderMatch = line.match(/page\.getByPlaceholder\(['"]([^'"]+)['"]/);
          if (placeholderMatch) {
            locators.push({
              selector: line.trim(),
              type: 'placeholder',
              lines: [lineNum],
            });
          }
        });
        
        // Merge duplicate locators
        const merged: Map<string, LocatorInfo> = new Map();
        locators.forEach(loc => {
          const key = loc.selector;
          if (merged.has(key)) {
            const existing = merged.get(key)!;
            existing.lines.push(...loc.lines);
            existing.lines = [...new Set(existing.lines)].sort();
          } else {
            merged.set(key, { ...loc });
          }
        });
        
        return { success: true, locators: Array.from(merged.values()) };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to parse locators' };
      }
    });

    // Export test bundle (stub)
    ipcMain.handle('test:exportBundle', async (_, request: TestExportBundleRequest): Promise<TestExportBundleResponse> => {
      try {
        // Stub: just log for now
        console.log(`[TestExport] Export bundle requested for test: ${request.testName}`);
        // TODO: Implement actual bundle export (zip spec + data + metadata)
        return { success: true, bundlePath: `bundles/${request.testName}.zip` };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to export bundle' };
      }
    });

    // Read data file
    ipcMain.handle('data:read', async (_, request: DataReadRequest): Promise<DataReadResponse> => {
      try {
        // Use DataWriter.readData() which uses the correct path: tests/d365/data/<testName>Data.json
        const rows = await this.dataWriter.readData(request.workspacePath, request.testName);
        return { success: true, rows: Array.isArray(rows) ? rows : [] };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to read data file' };
      }
    });

    // Import Excel (stub)
    ipcMain.handle('data:importExcel', async (_, request: DataImportExcelRequest): Promise<DataImportExcelResponse> => {
      try {
        // Stub: just log for now
        console.log(`[DataImport] Excel import requested for test: ${request.testName}`);
        // TODO: Implement Excel parsing and conversion to JSON
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to import Excel' };
      }
    });

    // List all locators across workspace
    ipcMain.handle('workspace:locators:list', async (_, request: WorkspaceLocatorsListRequest): Promise<WorkspaceLocatorsListResponse> => {
      try {
        const testsDir = path.join(request.workspacePath, 'tests');
        if (!fs.existsSync(testsDir)) {
          return { success: true, locators: [] };
        }
        
        // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
        // Recursively find all .spec.ts files in bundle structure
        const specFiles: string[] = [];
        const findSpecFiles = (dir: string) => {
          if (!fs.existsSync(dir)) return;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              findSpecFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
              specFiles.push(fullPath);
            }
          }
        };
        findSpecFiles(testsDir);
        
        const locatorMap: Map<string, LocatorIndexEntry> = new Map();
        
        for (const specPath of specFiles) {
          // Extract test name from bundle path: tests/d365/specs/<TestName>/<TestName>.spec.ts
          const bundleMatch = specPath.match(/tests\/d365\/specs\/([^\/]+)\/[^\/]+\.spec\.ts$/);
          const testName = bundleMatch ? bundleMatch[1] : path.basename(specPath, '.spec.ts');
          const content = fs.readFileSync(specPath, 'utf-8');
          const lines = content.split('\n');
          
          lines.forEach((line) => {
            // Extract locator patterns (same as parseLocators)
            const patterns = [
              { regex: /page\.getByRole\(['"]([^'"]+)['"],\s*\{[^}]*name:\s*['"]([^'"]+)['"]/, type: 'role' as const },
              { regex: /page\.getByLabel\(['"]([^'"]+)['"]/, type: 'label' as const },
              { regex: /page\.locator\(['"]([^'"]+)['"]/, type: 'css' as const },
              { regex: /page\.getByText\(['"]([^'"]+)['"]/, type: 'text' as const },
              { regex: /page\.getByPlaceholder\(['"]([^'"]+)['"]/, type: 'placeholder' as const },
            ];
            
            patterns.forEach(({ regex, type }) => {
              const match = line.match(regex);
              if (match) {
                const selector = line.trim();
                const key = `${type}:${selector}`;
                
                if (locatorMap.has(key)) {
                  const entry = locatorMap.get(key)!;
                  if (!entry.usedInTests.includes(testName)) {
                    entry.usedInTests.push(testName);
                    entry.testCount++;
                  }
                } else {
                  locatorMap.set(key, {
                    locator: selector,
                    type,
                    testCount: 1,
                    usedInTests: [testName],
                  });
                }
              }
            });
          });
        }
        
        const locators = Array.from(locatorMap.values());
        const enriched = this.locatorMaintenance.attachStatuses(locators, request.workspacePath);
        return { success: true, locators: enriched };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to list locators' };
      }
    });
    ipcMain.handle('workspace:locators:update', async (_, request: LocatorUpdateRequest): Promise<LocatorUpdateResponse> => {
      return await this.locatorMaintenance.updateLocator(request);
    });
    ipcMain.handle('workspace:locators:setStatus', async (_, request: LocatorStatusUpdateRequest): Promise<LocatorStatusUpdateResponse> => {
      return await this.locatorMaintenance.setLocatorStatus(request, this.mainWindow);
    });
    ipcMain.handle('workspace:locators:add', async (_, request: { workspacePath: string; locator: string; type: LocatorIndexEntry['type']; tests?: string[] }): Promise<{ success: boolean; error?: string }> => {
      return await this.locatorMaintenance.addCustomLocator(request.workspacePath, request.locator, request.type, request.tests || []);
    });

    // BrowserStack Settings
    ipcMain.handle('settings:getBrowserStack', async (_, request: SettingsGetBrowserStackRequest): Promise<SettingsGetBrowserStackResponse> => {
      try {
        const settingsPath = path.join(request.workspacePath, 'workspace-settings.json');
        if (!fs.existsSync(settingsPath)) {
          return { success: true, settings: { username: '', accessKey: '', project: '', buildPrefix: '' } };
        }
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        return {
          success: true,
          settings: {
            username: settings.browserstack?.username || '',
            accessKey: settings.browserstack?.accessKey || '',
            project: settings.browserstack?.project || '',
            buildPrefix: settings.browserstack?.buildPrefix || '',
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get BrowserStack settings' };
      }
    });

    ipcMain.handle('settings:updateBrowserStack', async (_, request: SettingsUpdateBrowserStackRequest): Promise<SettingsUpdateBrowserStackResponse> => {
      try {
        const settingsPath = path.join(request.workspacePath, 'workspace-settings.json');
        let settings: any = {};
        if (fs.existsSync(settingsPath)) {
          try {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            settings = JSON.parse(content);
          } catch (e) {
            // Ignore parse errors, start fresh
          }
        }
        
        settings.browserstack = {
          username: request.settings.username,
          accessKey: request.settings.accessKey,
          project: request.settings.project || '',
          buildPrefix: request.settings.buildPrefix || '',
        };
        settings.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update BrowserStack settings' };
      }
    });

    // BrowserStack TM Session Management
    ipcMain.handle('browserstack:clearTMSession', async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const { session } = require('electron');
        const bsSession = session.fromPartition('persist:browserstack-tm');
        await bsSession.clearStorageData();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to clear BrowserStack TM session' };
      }
    });

    // Jira Configuration handlers
    ipcMain.handle('settings:getJiraConfig', async (): Promise<{ success: boolean; config?: { baseUrl?: string; email?: string; projectKey?: string }; error?: string }> => {
      try {
        const config = this.configManager.getJiraConfig();
        return {
          success: true,
          config: {
            baseUrl: config.baseUrl || '',
            email: config.email || '',
            projectKey: config.projectKey || '',
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get Jira config' };
      }
    });

    ipcMain.handle('settings:updateJiraConfig', async (_, request: { baseUrl: string; email: string; apiToken: string; projectKey: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        this.configManager.setJiraConfig({
          baseUrl: request.baseUrl,
          email: request.email,
          apiToken: request.apiToken,
          projectKey: request.projectKey,
        });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update Jira config' };
      }
    });

    // BrowserStack TM Configuration handlers
    ipcMain.handle('settings:getBrowserStackTmConfig', async (): Promise<{ success: boolean; config?: { projectId?: string; suiteName?: string; apiToken?: string }; error?: string }> => {
      try {
        const config = this.configManager.getBrowserStackTmConfig();
        return {
          success: true,
          config: {
            projectId: config.projectId || '',
            suiteName: config.suiteName || '',
            apiToken: config.apiToken || '',
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get BrowserStack TM config' };
      }
    });

    ipcMain.handle('settings:updateBrowserStackTmConfig', async (_, request: { projectId?: string; suiteName?: string; apiToken?: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        this.configManager.setBrowserStackTmConfig({
          projectId: request.projectId,
          suiteName: request.suiteName,
          apiToken: request.apiToken,
        });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update BrowserStack TM config' };
      }
    });

    // Jira Session Management
    ipcMain.handle('jira:clearSession', async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const { session } = require('electron');
        const jiraSession = session.fromPartition('persist:jira');
        await jiraSession.clearStorageData();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to clear Jira session' };
      }
    });

    // AI Configuration handlers (stored in electron-store via ConfigManager)
    ipcMain.handle('settings:getAIConfig', async (): Promise<{ success: boolean; config?: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }; error?: string }> => {
      try {
        const config = this.configManager.getAIConfig();
        return { success: true, config };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get AI config' };
      }
    });

    ipcMain.handle('settings:updateAIConfig', async (_, request: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        this.configManager.setAIConfig(request);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update AI config' };
      }
    });

    // RAG Chat
    ipcMain.handle('rag:chat', async (_, request: { workspacePath: string; testName: string; messages: Array<{ role: string; content: string }> }): Promise<{ success: boolean; response?: string; error?: string }> => {
      try {
        const response = await this.ragService.chatWithTest(
          request.workspacePath,
          request.testName,
          request.messages
        );
        return { success: true, response };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to chat with AI' };
      }
    });

    // ============================================================================
    // v2.0: Jira Integration
    // ============================================================================
    ipcMain.handle('jira:testConnection', async (): Promise<{ success: boolean; projectName?: string; error?: string }> => {
      try {
        return await this.jiraService.testConnection();
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to test Jira connection' };
      }
    });

    ipcMain.handle('jira:searchIssues', async (_, request: {
      jql?: string;
      maxResults?: number;
      startAt?: number;
      nextPageToken?: string;
    }): Promise<{
      success: boolean;
      issues?: Array<{
        key: string;
        summary: string;
        status: string;
        issueType: string;
        assignee?: string;
        created: string;
        updated: string;
        url: string;
      }>;
      total?: number;
      startAt?: number;
      maxResults?: number;
      nextPageToken?: string;
      error?: string;
    }> => {
      try {
        const result = await this.jiraService.searchIssues(
          request.jql,
          request.maxResults || 50,
          request.startAt || 0,
          request.nextPageToken
        );
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to search JIRA issues' };
      }
    });

    ipcMain.handle('jira:getIssue', async (_, issueKey: string): Promise<{
      success: boolean;
      issue?: any;
      error?: string;
    }> => {
      try {
        const issue = await this.jiraService.getIssue(issueKey);
        return { success: true, issue };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get JIRA issue' };
      }
    });

    ipcMain.handle('jira:getComments', async (_, issueKey: string): Promise<{
      success: boolean;
      comments?: Array<{
        id: string;
        author: string;
        body: string;
        created: string;
        updated: string;
      }>;
      error?: string;
    }> => {
      try {
        const comments = await this.jiraService.getComments(issueKey);
        return { success: true, comments };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get comments' };
      }
    });

    ipcMain.handle('jira:addComment', async (_, request: {
      issueKey: string;
      comment: string;
    }): Promise<{
      success: boolean;
      commentId?: string;
      error?: string;
    }> => {
      try {
        const result = await this.jiraService.addComment(request.issueKey, request.comment);
        return { success: true, commentId: result.id };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to add comment' };
      }
    });

    ipcMain.handle('jira:getTransitions', async (_, issueKey: string): Promise<{
      success: boolean;
      transitions?: Array<{ id: string; name: string; to: { id: string; name: string } }>;
      error?: string;
    }> => {
      try {
        const transitions = await this.jiraService.getTransitions(issueKey);
        return { success: true, transitions };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get transitions' };
      }
    });

    ipcMain.handle('jira:transitionIssue', async (_, request: {
      issueKey: string;
      transitionId: string;
      comment?: string;
    }): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        await this.jiraService.transitionIssue(request.issueKey, request.transitionId, request.comment);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to transition issue' };
      }
    });

    ipcMain.handle('jira:updateIssue', async (_, request: {
      issueKey: string;
      updates: {
        summary?: string;
        description?: string;
        assignee?: string;
        priority?: string;
        labels?: string[];
        customFields?: Record<string, any>;
      };
    }): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        await this.jiraService.updateIssue(request.issueKey, request.updates);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update issue' };
      }
    });

    ipcMain.handle('jira:getProject', async (_, projectKey?: string): Promise<{
      success: boolean;
      project?: any;
      error?: string;
    }> => {
      try {
        const project = await this.jiraService.getProject(projectKey);
        return { success: true, project };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get project' };
      }
    });

    ipcMain.handle('jira:createIssue', async (_, request: {
      summary: string;
      description: string;
      issueType?: string;
      customFields?: Record<string, any>;
      labels?: string[];
    }): Promise<{ success: boolean; issueKey?: string; issueUrl?: string; error?: string }> => {
      try {
        const result = await this.jiraService.createIssue(request);
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create Jira issue' };
      }
    });

    // ============================================================================
    // v2.0: BrowserStack Test Management
    // ============================================================================
    ipcMain.handle('browserstackTm:createTestCase', async (_, request: {
      name: string;
      description?: string;
      tags?: string[];
    }): Promise<{ success: boolean; testCaseId?: string; error?: string }> => {
      try {
        const result = await this.browserstackTmService.createOrUpdateTestCase({
          name: request.name,
          description: request.description,
          tags: request.tags,
        });
        return { success: true, testCaseId: result.identifier };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create BrowserStack test case' };
      }
    });

    ipcMain.handle('browserstackTm:publishTestRun', async (_, request: {
      testCaseId: string;
      status: 'passed' | 'failed' | 'skipped';
      duration?: number;
      error?: string;
      sessionId?: string;
      buildId?: string;
      dashboardUrl?: string;
    }): Promise<{ success: boolean; testRunId?: string; error?: string }> => {
      try {
        const result = await this.browserstackTmService.publishTestRun({
          testCaseId: request.testCaseId,
          status: request.status,
          duration: request.duration,
          error: request.error,
          screenshots: [],
          videoUrl: undefined,
          sessionId: request.sessionId,
          buildId: request.buildId,
          dashboardUrl: request.dashboardUrl,
        });
        return { success: true, testRunId: result.identifier };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to publish BrowserStack test run' };
      }
    });

    ipcMain.handle('browserstackTm:testConnection', async (): Promise<{ success: boolean; projectName?: string; error?: string }> => {
      try {
        return await this.browserstackTmService.testConnection();
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to test BrowserStack TM connection' };
      }
    });

    ipcMain.handle('browserstackTm:listTestCases', async (_, request: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      tags?: string[];
    }): Promise<{
      success: boolean;
      testCases?: Array<{
        id: string;
        identifier: string;
        name: string;
        description?: string;
        status?: string;
        priority?: string;
        caseType?: string;
        owner?: string;
        tags?: string[];
        automationStatus?: string;
        createdAt: string;
        updatedAt: string;
        url: string;
      }>;
      total?: number;
      page?: number;
      pageSize?: number;
      hasMore?: boolean;
      error?: string;
    }> => {
      try {
        const result = await this.browserstackTmService.listTestCases({
          page: request.page,
          pageSize: request.pageSize,
          search: request.search,
          status: request.status,
          tags: request.tags,
        });
        return { success: true, testCases: result.items, ...result };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to list test cases' };
      }
    });

    ipcMain.handle('browserstackTm:getTestCase', async (_, testCaseId: string): Promise<{
      success: boolean;
      testCase?: any;
      error?: string;
    }> => {
      try {
        const testCase = await this.browserstackTmService.getTestCase(testCaseId);
        return { success: true, testCase };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get test case' };
      }
    });

    ipcMain.handle('browserstackTm:linkTestCase', async (_, request: {
      workspacePath: string;
      testName: string;
      testCaseId: string;
      testCaseUrl: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        // Find bundle directory
        const fileName = request.testName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        let bundleDir: string | null = null;
        const possiblePaths = [
          path.join(request.workspacePath, 'tests', 'd365', 'specs', fileName),
          path.join(request.workspacePath, 'tests', 'd365', fileName),
          path.join(request.workspacePath, 'tests', fileName),
          path.join(request.workspacePath, 'tests', 'web-demo', 'specs', fileName),
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            bundleDir = possiblePath;
            break;
          }
        }
        
        if (!bundleDir) {
          throw new Error(`Bundle not found for test: ${request.testName}`);
        }
        
        const bundleMeta = this.browserstackTmService.readBundleMeta(bundleDir);
        await this.browserstackTmService.linkTestCaseToBundle(bundleMeta, request.testCaseId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to link test case' };
      }
    });

    // ============================================================================
    // v2.0: BrowserStack Automate
    // ============================================================================
    ipcMain.handle('browserstackAutomate:getPlan', async (): Promise<{
      success: boolean;
      plan?: {
        automatePlan: string;
        parallelSessionsRunning: number;
        teamParallelSessionsMaxAllowed: number;
        parallelSessionsMaxAllowed: number;
        queuedSessions: number;
        queuedSessionsMaxAllowed: number;
      };
      error?: string;
    }> => {
      try {
        const plan = await this.browserstackAutomateService.getPlan();
        return { success: true, plan };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get plan details' };
      }
    });

    ipcMain.handle('browserstackAutomate:getBrowsers', async (): Promise<{
      success: boolean;
      browsers?: Array<{
        os: string;
        osVersion: string;
        browser: string;
        device: string | null;
        browserVersion: string | null;
        realMobile: boolean | null;
      }>;
      error?: string;
    }> => {
      try {
        const browsers = await this.browserstackAutomateService.getBrowsers();
        return { success: true, browsers };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get browsers' };
      }
    });

    ipcMain.handle('browserstackAutomate:getProjects', async (): Promise<{
      success: boolean;
      projects?: Array<{
        id: number;
        name: string;
        groupId: number;
        userId: number;
        createdAt: string;
        updatedAt: string;
        subGroupId: number;
      }>;
      error?: string;
    }> => {
      try {
        const projects = await this.browserstackAutomateService.getProjects();
        return { success: true, projects };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get projects' };
      }
    });

    ipcMain.handle('browserstackAutomate:getProject', async (_, projectId: number): Promise<{
      success: boolean;
      project?: any;
      error?: string;
    }> => {
      try {
        const project = await this.browserstackAutomateService.getProject(projectId);
        return { success: true, project };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get project' };
      }
    });

    ipcMain.handle('browserstackAutomate:getBuilds', async (_, request: {
      limit?: number;
      offset?: number;
      status?: string;
      projectId?: number;
    }): Promise<{
      success: boolean;
      builds?: Array<{
        name: string;
        hashedId: string;
        duration: number;
        status: string;
        buildTag: string | null;
        publicUrl: string;
      }>;
      error?: string;
    }> => {
      try {
        const builds = await this.browserstackAutomateService.getBuilds(request);
        return { success: true, builds };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get builds' };
      }
    });

    ipcMain.handle('browserstackAutomate:getBuildSessions', async (_, request: {
      buildId: string;
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<{
      success: boolean;
      sessions?: Array<{
        name: string;
        duration: number;
        os: string;
        osVersion: string;
        browserVersion: string | null;
        browser: string | null;
        device: string | null;
        status: string;
        hashedId: string;
        reason: string;
        buildName: string;
        projectName: string;
        testPriority: string | null;
        logs: string;
        browserUrl: string;
        publicUrl: string;
        appiumLogsUrl: string;
        videoUrl: string;
        browserConsoleLogsUrl: string;
        harLogsUrl: string;
        seleniumLogsUrl: string;
        seleniumTelemetryLogsUrl?: string;
      }>;
      error?: string;
    }> => {
      try {
        const sessions = await this.browserstackAutomateService.getBuildSessions(
          request.buildId,
          { limit: request.limit, offset: request.offset, status: request.status }
        );
        return { success: true, sessions };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get build sessions' };
      }
    });

    ipcMain.handle('browserstackAutomate:getSession', async (_, sessionId: string): Promise<{
      success: boolean;
      session?: any;
      error?: string;
    }> => {
      try {
        const session = await this.browserstackAutomateService.getSession(sessionId);
        return { success: true, session };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get session' };
      }
    });

    ipcMain.handle('browserstackAutomate:setTestStatus', async (_, request: {
      sessionId: string;
      status: 'passed' | 'failed';
      reason?: string;
    }): Promise<{
      success: boolean;
      session?: any;
      error?: string;
    }> => {
      try {
        const session = await this.browserstackAutomateService.setTestStatus(
          request.sessionId,
          request.status,
          request.reason
        );
        return { success: true, session };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to set test status' };
      }
    });

    ipcMain.handle('browserstackAutomate:updateSessionName', async (_, request: {
      sessionId: string;
      name: string;
    }): Promise<{
      success: boolean;
      session?: any;
      error?: string;
    }> => {
      try {
        const session = await this.browserstackAutomateService.updateSessionName(
          request.sessionId,
          request.name
        );
        return { success: true, session };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update session name' };
      }
    });

    ipcMain.handle('browserstackTm:listTestRuns', async (_, request: {
      testCaseId?: string;
      page?: number;
      pageSize?: number;
      status?: 'passed' | 'failed' | 'skipped';
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{
      success: boolean;
      testRuns?: Array<{
        id: string;
        identifier: string;
        testCaseId: string;
        status: 'passed' | 'failed' | 'skipped';
        duration?: number;
        error?: string;
        createdAt: string;
        sessionId?: string;
        buildId?: string;
        url: string;
      }>;
      total?: number;
      page?: number;
      pageSize?: number;
      hasMore?: boolean;
      error?: string;
    }> => {
      try {
        const result = await this.browserstackTmService.listTestRuns({
          testCaseId: request.testCaseId,
          page: request.page,
          pageSize: request.pageSize,
          status: request.status,
          dateFrom: request.dateFrom,
          dateTo: request.dateTo,
        });
        return { success: true, testRuns: result.items, ...result };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to list test runs' };
      }
    });

    // Recording Engine Settings
    ipcMain.handle('settings:getRecordingEngine', async (_, request: SettingsGetRecordingEngineRequest): Promise<SettingsGetRecordingEngineResponse> => {
      try {
        const settingsPath = path.join(request.workspacePath, 'workspace-settings.json');
        if (!fs.existsSync(settingsPath)) {
          // Default to 'playwright' for backward compatibility with existing workspaces
          return { success: true, recordingEngine: 'playwright' };
        }
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        const engine = settings.recordingEngine || 'playwright'; // Default to playwright for existing workspaces
        return {
          success: true,
          recordingEngine: engine as RecordingEngine,
        };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get recording engine setting' };
      }
    });

    ipcMain.handle('settings:updateRecordingEngine', async (_, request: SettingsUpdateRecordingEngineRequest): Promise<SettingsUpdateRecordingEngineResponse> => {
      try {
        const settingsPath = path.join(request.workspacePath, 'workspace-settings.json');
        let settings: any = {};
        if (fs.existsSync(settingsPath)) {
          try {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            settings = JSON.parse(content);
          } catch (e) {
            // Ignore parse errors, start fresh
          }
        }
        
        settings.recordingEngine = request.recordingEngine;
        settings.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update recording engine setting' };
      }
    });

    // Dev mode settings
    ipcMain.handle('settings:getDevMode', async (): Promise<{ success: boolean; devMode?: boolean; error?: string }> => {
      try {
        const devMode = this.configManager.getDevMode();
        return { success: true, devMode };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get dev mode' };
      }
    });

    ipcMain.handle('settings:updateDevMode', async (_, request: { devMode: boolean }): Promise<{ success: boolean; error?: string }> => {
      try {
        this.configManager.setDevMode(request.devMode);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update dev mode' };
      }
    });

    // Playwright environment checks & installation
    ipcMain.handle('playwright:checkEnv', async (_event, request: { workspacePath: string }): Promise<{
      success: boolean;
      cliAvailable?: boolean;
      browsersInstalled?: boolean;
      error?: string;
      details?: { version?: string; browsersDir?: string; runtimeType?: string };
    }> => {
      try {
        const projectRoot = this.findProjectRoot();
        
        // Get runtime info to show in UI
        const runtimeInfo = getRuntimeInfo();
        
        let cliAvailable = false;
        let version: string | undefined;

        try {
          // Use the new runtime helper which handles bundled vs system
          const result = await runPlaywrightOnce(['--version'], { 
            cwd: projectRoot,
            timeout: 10000,
          });
          if (result.exitCode === 0) {
            cliAvailable = true;
            const line = result.stdout.trim().split('\n')[0]?.trim();
            version = line || undefined;
          }
        } catch (e: any) {
          // CLI not available or failed
          return {
            success: true,
            cliAvailable: false,
            browsersInstalled: false,
            error: e.message || 'Playwright CLI is not available.',
            details: {
              runtimeType: runtimeInfo.type,
            },
          };
        }

        // Check for browsers - try bundled runtime location first, then project location
        let browsersInstalled = false;
        let browsersDir: string | undefined;
        
        if (hasBundledRuntime()) {
          // Check bundled runtime browsers location
          const runtimePaths = getBundledRuntimePaths();
          if (runtimePaths) {
            browsersDir = runtimePaths.browsersPath;
            try {
              if (fs.existsSync(browsersDir)) {
                const entries = fs.readdirSync(browsersDir);
                browsersInstalled = entries.length > 0;
              }
            } catch {
              // Ignore filesystem errors
            }
          }
        }
        
        // Also check project-level browser installation
        if (!browsersInstalled) {
          const projectBrowsersDir = path.join(projectRoot, 'node_modules', 'playwright', '.local-browsers');
          try {
            if (fs.existsSync(projectBrowsersDir)) {
              const entries = fs.readdirSync(projectBrowsersDir);
              if (entries.length > 0) {
                browsersInstalled = true;
                browsersDir = projectBrowsersDir;
              }
            }
          } catch {
            // Ignore filesystem errors
          }
        }

        return {
          success: true,
          cliAvailable,
          browsersInstalled,
          details: {
            version,
            browsersDir,
            runtimeType: runtimeInfo.type,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to check Playwright environment',
        };
      }
    });

    ipcMain.handle('playwright:install', async (_event, request: { workspacePath: string }): Promise<{
      success: boolean;
      error?: string;
      logPath?: string;
    }> => {
      try {
        const projectRoot = this.findProjectRoot();
        
        // Ensure tmp directory exists under workspace for logs
        const tmpDir = path.join(request.workspacePath, 'tmp');
        fs.mkdirSync(tmpDir, { recursive: true });
        const logPath = path.join(tmpDir, 'playwright-install.log');

        const logStream = fs.createWriteStream(logPath, { flags: 'a' });
        
        // Helper to safely write to log stream
        const safeWrite = (data: string | Buffer) => {
          try {
            if (!logStream.writableEnded && !logStream.destroyed) {
              logStream.write(data);
            }
          } catch (err) {
            // Ignore write errors after stream is closed
            console.error('[Bridge] Log stream write error:', err);
          }
        };
        
        // Helper to safely end log stream
        const safeEnd = () => {
          try {
            if (!logStream.writableEnded && !logStream.destroyed) {
              logStream.end();
            }
          } catch (err) {
            // Ignore end errors
            console.error('[Bridge] Log stream end error:', err);
          }
        };
        
        safeWrite(`Starting Playwright installation at ${new Date().toISOString()}\n`);
        
        const runtimeInfo = getRuntimeInfo();
        safeWrite(`Runtime type: ${runtimeInfo.type}\n`);

        try {
          // Use the new runtime helper which handles bundled vs system
          const child = runPlaywright(['install'], {
            cwd: projectRoot,
          });

          child.stdout?.on('data', (data) => {
            safeWrite(data);
          });

          child.stderr?.on('data', (data) => {
            safeWrite(data);
          });

          const exitCode: number = await new Promise((resolve, reject) => {
            child.on('error', (err: any) => {
              safeWrite(`\nProcess error: ${err.message}\n`);
              safeWrite(`Error code: ${err.code || 'unknown'}\n`);
              safeEnd();
              reject(err);
            });
            child.on('close', (code) => {
              safeWrite(`\nProcess exited with code ${code}\n`);
              safeEnd();
              resolve(code ?? 1);
            });
          });

          if (exitCode !== 0) {
            return {
              success: false,
              error: `Playwright install failed with exit code ${exitCode}. See log for details.`,
              logPath,
            };
          }

          return { success: true, logPath };
        } catch (spawnError: any) {
          safeWrite(`\nSpawn error: ${spawnError.message}\n`);
          safeWrite(`Error code: ${spawnError.code || 'unknown'}\n`);
          safeEnd();

          // Error messages from runPlaywright are already user-friendly
          return {
            success: false,
            error: spawnError.message || 'Playwright installation failed. See log for details.',
            logPath,
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to install Playwright',
        };
      }
    });

    // Runtime Health - comprehensive runtime information
    ipcMain.handle('playwright:runtimeHealth', async (_event, request: { workspacePath: string }): Promise<{
      success: boolean;
      nodeVersion?: string;
      playwrightVersion?: string;
      browsers?: string[];
      runtimeType?: string;
      error?: string;
    }> => {
      try {
        const runtimeInfo = getRuntimeInfo();
        
        // Get Node version
        const nodeVersion = await getNodeVersion();
        
        // Get Playwright version
        let playwrightVersion: string | undefined;
        try {
          const result = await runPlaywrightOnce(['--version'], { 
            cwd: request.workspacePath,
            timeout: 10000,
          });
          if (result.exitCode === 0) {
            const line = result.stdout.trim().split('\n')[0]?.trim();
            playwrightVersion = line || undefined;
          }
        } catch {
          // Playwright version not available
        }
        
        // Get installed browsers
        const browsers = getInstalledBrowsers();
        
        return {
          success: true,
          nodeVersion: nodeVersion || undefined,
          playwrightVersion,
          browsers: browsers.length > 0 ? browsers : undefined,
          runtimeType: runtimeInfo.type,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get runtime health information',
        };
      }
    });

    // Delete workspace files (dev mode only)
    ipcMain.handle('workspace:deleteFiles', async (_, request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        // Check if dev mode is enabled
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled to delete workspace files' };
        }

        const workspacePath = request.workspacePath;
        if (!workspacePath || !fs.existsSync(workspacePath)) {
          return { success: false, error: 'Workspace path does not exist' };
        }

        // Delete all contents in the workspace (tests, data, traces, reports, etc.)
        const dirsToDelete = ['tests', 'data', 'traces', 'runs', 'reports', 'tmp', 'allure-results', 'allure-report'];
        
        for (const dir of dirsToDelete) {
          const dirPath = path.join(workspacePath, dir);
          if (fs.existsSync(dirPath)) {
            safeRemoveSync(dirPath);
          }
        }

        // Recreate empty directory structure
        for (const dir of dirsToDelete) {
          const dirPath = path.join(workspacePath, dir);
          fs.mkdirSync(dirPath, { recursive: true });
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete workspace files' };
      }
    });

    // Dev mode utilities
    ipcMain.handle('dev:openFolder', async (_, request: { path: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        if (!fs.existsSync(request.path)) {
          return { success: false, error: 'Path does not exist' };
        }
        shell.openPath(request.path);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to open folder' };
      }
    });

    ipcMain.handle('dev:clearTempFiles', async (_, request: { workspacePath: string }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const tmpDir = path.join(request.workspacePath, 'tmp');
        let deletedCount = 0;
        if (fs.existsSync(tmpDir)) {
          const files = fs.readdirSync(tmpDir);
          for (const file of files) {
            const filePath = path.join(tmpDir, file);
            try {
              safeRemoveSync(filePath);
              deletedCount++;
            } catch (e) {
              // Continue on error
            }
          }
        }
        return { success: true, deletedCount };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to clear temp files' };
      }
    });

    ipcMain.handle('dev:clearOldTraces', async (_, request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const tracesDir = path.join(request.workspacePath, 'traces');
        const daysToKeep = request.daysToKeep || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        let deletedCount = 0;

        if (fs.existsSync(tracesDir)) {
          const entries = fs.readdirSync(tracesDir, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(tracesDir, entry.name);
            try {
              const stats = fs.statSync(entryPath);
              if (stats.mtime < cutoffDate) {
                safeRemoveSync(entryPath);
                deletedCount++;
              }
            } catch (e) {
              // Continue on error
            }
          }
        }
        return { success: true, deletedCount };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to clear old traces' };
      }
    });

    ipcMain.handle('dev:clearOldReports', async (_, request: { workspacePath: string; daysToKeep?: number }): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const reportsDir = path.join(request.workspacePath, 'reports');
        const daysToKeep = request.daysToKeep || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        let deletedCount = 0;

        if (fs.existsSync(reportsDir)) {
          const entries = fs.readdirSync(reportsDir, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(reportsDir, entry.name);
            try {
              const stats = fs.statSync(entryPath);
              if (stats.mtime < cutoffDate) {
                safeRemoveSync(entryPath);
                deletedCount++;
              }
            } catch (e) {
              // Continue on error
            }
          }
        }
        return { success: true, deletedCount };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to clear old reports' };
      }
    });

    ipcMain.handle('dev:getWorkspaceStats', async (_, request: { workspacePath: string }): Promise<{ success: boolean; stats?: any; error?: string }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const stats: any = {
          tests: { count: 0, size: 0 },
          data: { count: 0, size: 0 },
          traces: { count: 0, size: 0 },
          runs: { count: 0, size: 0 },
          reports: { count: 0, size: 0 },
          tmp: { count: 0, size: 0 },
          total: { count: 0, size: 0 },
        };

        const dirs = ['tests', 'data', 'traces', 'runs', 'reports', 'tmp'];
        
        for (const dir of dirs) {
          const dirPath = path.join(request.workspacePath, dir);
          if (fs.existsSync(dirPath)) {
            const result = this.calculateDirectoryStats(dirPath);
            stats[dir] = result;
            stats.total.count += result.count;
            stats.total.size += result.size;
          }
        }

        return { success: true, stats };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get workspace stats' };
      }
    });

    ipcMain.handle('dev:rebuildWorkspaceStructure', async (_, request: { workspacePath: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const dirs = ['tests', 'data', 'traces', 'runs', 'reports', 'storage_state', 'tmp', 'allure-results', 'allure-report'];
        for (const dir of dirs) {
          const dirPath = path.join(request.workspacePath, dir);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to rebuild workspace structure' };
      }
    });

    ipcMain.handle('dev:getRawConfig', async (): Promise<{ success: boolean; config?: any; error?: string }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const config = this.configManager.getConfig();
        return { success: true, config };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get config' };
      }
    });

    ipcMain.handle('dev:getStorageStatePath', async (): Promise<{ success: boolean; path?: string; error?: string }> => {
      try {
        if (!this.configManager.getDevMode()) {
          return { success: false, error: 'Dev mode must be enabled' };
        }
        const storagePath = this.configManager.getStorageStatePath();
        return { success: true, path: storagePath };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to get storage state path' };
      }
    });

    // ============================================================================
    // v2.0: Electron Self Test / Diagnostics
    // ============================================================================
    ipcMain.handle('electronTest:runAll', async () => {
      return await runAllElectronTests();
    });

    // v2.0: Jira defect creation from run context
    this.registerJiraDefectHandlers();

    // v2.0: BrowserStack TM – explicit sync for a given test bundle
    ipcMain.handle(
      'browserstackTm:syncTestCaseForBundle',
      async (_event, args: { workspacePath: string; testName: string }) => {
        try {
          // Check if BrowserStack TM is configured (uses same credentials as Automate)
          try {
            const browserstackCreds = this.configManager.getBrowserStackCredentials();
            if (!browserstackCreds.username || !browserstackCreds.accessKey) {
              console.warn('[IPCBridge] BrowserStack credentials not configured (used by both Automate and TM), skipping sync');
              return {
                success: false,
                error: 'BrowserStack credentials not configured. Please set username and access key in Settings → BrowserStack (used by both Automate and Test Management).',
              };
            }
          } catch (configError: any) {
            console.warn('[IPCBridge] Failed to check BrowserStack configuration:', configError.message);
            return {
              success: false,
              error: 'BrowserStack Test Management is not configured. Please configure BrowserStack credentials in Settings.',
            };
          }

          const { workspacePath, testName } = args;
          const fileName = testName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          // Reuse the same lookup strategy as TestRunner.updateTestMeta
          let metaPath = path.join(
            workspacePath,
            'tests',
            'd365',
            'specs',
            fileName,
            `${fileName}.meta.json`
          );

          if (!fs.existsSync(metaPath)) {
            const oldModulePath = path.join(
              workspacePath,
              'tests',
              'd365',
              fileName,
              `${fileName}.meta.json`
            );
            if (fs.existsSync(oldModulePath)) {
              metaPath = oldModulePath;
            } else {
              const oldFlatPath = path.join(
                workspacePath,
                'tests',
                `${fileName}.meta.json`
              );
              if (fs.existsSync(oldFlatPath)) {
                metaPath = oldFlatPath;
              } else {
                return { success: false, error: 'meta.json not found for this test' };
              }
            }
          }

          const bundleDir = path.dirname(metaPath);
          const bundleMeta = this.browserstackTmService.readBundleMeta(bundleDir);
          await this.browserstackTmService.syncTestCaseForBundle(bundleMeta);

          return { success: true };
        } catch (error: any) {
          // Log warning but don't crash - TM sync is optional
          console.warn('[IPCBridge] BrowserStack TM sync failed (non-fatal):', error.message);
          return {
            success: false,
            error: error.message || 'Failed to sync with BrowserStack TM. Test generation will continue normally.',
          };
        }
      }
    );
  }

  /**
   * v2.0: Create Jira defect from a failed run context
   */
  private registerJiraDefectHandlers(): void {
    ipcMain.handle('jira:createDefectFromRun', async (_event, context: JiraDefectContext) => {
      try {
        // Check if Jira is configured
        try {
          const jiraConfig = this.configManager.getJiraConfig();
          if (!jiraConfig.email || !jiraConfig.apiToken) {
            return {
              success: false,
              error: 'Jira integration is not configured. Please set Jira email and API token in Settings.',
            };
          }
        } catch (configError: any) {
          return {
            success: false,
            error: 'Jira integration is not configured. Please set Jira URL, project key, and credentials in Settings.',
          };
        }

        // Use provided summary or generate one
        const summary = context.summary || (context.workspaceId
          ? `Failed automated test: ${context.testName} [${context.workspaceId}]`
          : `Failed automated test: ${context.testName}`);

        // Load run metadata if runId is available
        let runMeta: TestRunMeta | null = null;
        let startedAt: string | undefined;
        let finishedAt: string | undefined;
        if (context.runId) {
          try {
            const runResult = await this.handleGetRun({
              workspacePath: context.workspacePath,
              runId: context.runId,
            });
            if (runResult.success && runResult.run) {
              runMeta = runResult.run;
              startedAt = runMeta.startedAt;
              finishedAt = runMeta.finishedAt;
            }
          } catch (error: any) {
            console.warn('[IPCBridge] Failed to load run metadata:', error.message);
          }
        }

        // Load failure artifact to get screenshot paths and additional error details
        const slug = context.testName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        let failureArtifactPath: string | undefined;
        let screenshotPaths: string[] = [];
        
        // Try to find failure artifact
        const possibleFailurePaths = [
          path.join(context.workspacePath, 'tests', 'd365', 'specs', slug, `${slug}_failure.json`),
          path.join(context.workspacePath, 'tests', 'd365', slug, `${slug}_failure.json`),
          path.join(context.workspacePath, 'tests', `${slug}_failure.json`),
        ];
        
        for (const failurePath of possibleFailurePaths) {
          if (fs.existsSync(failurePath)) {
            failureArtifactPath = failurePath;
            try {
              const failureContent = fs.readFileSync(failurePath, 'utf-8');
              const failureData = JSON.parse(failureContent);
              
              // Extract screenshot paths from failure artifact
              if (failureData.screenshot) {
                const screenshotPath = path.isAbsolute(failureData.screenshot)
                  ? failureData.screenshot
                  : path.join(context.workspacePath, failureData.screenshot);
                if (fs.existsSync(screenshotPath)) {
                  screenshotPaths.push(screenshotPath);
                }
              }
              
              // If multiple screenshots exist in test-results, add them
              const testResultsDir = path.join(context.workspacePath, 'test-results');
              if (fs.existsSync(testResultsDir)) {
                const findScreenshots = (dir: string): string[] => {
                  const screenshots: string[] = [];
                  if (!fs.existsSync(dir)) return screenshots;
                  
                  const entries = fs.readdirSync(dir, { withFileTypes: true });
                  for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                      screenshots.push(...findScreenshots(fullPath));
                    } else if (entry.name.match(/\.(png|jpg|jpeg)$/i)) {
                      screenshots.push(fullPath);
                    }
                  }
                  return screenshots;
                };
                
                const allScreenshots = findScreenshots(testResultsDir);
                screenshotPaths.push(...allScreenshots.filter(p => !screenshotPaths.includes(p)));
              }
            } catch (error: any) {
              console.warn('[IPCBridge] Failed to parse failure artifact:', error.message);
            }
            break;
          }
        }

        // Build trace path (use first trace if available)
        let tracePath: string | undefined = context.tracePath;
        if (!tracePath && runMeta?.tracePaths && runMeta.tracePaths.length > 0) {
          tracePath = path.isAbsolute(runMeta.tracePaths[0])
            ? runMeta.tracePaths[0]
            : path.join(context.workspacePath, runMeta.tracePaths[0]);
        }

        // Build report path
        let reportPath: string | undefined = context.playwrightReportPath;
        if (!reportPath && runMeta) {
          if (runMeta.allureReportPath) {
            reportPath = path.isAbsolute(runMeta.allureReportPath)
              ? runMeta.allureReportPath
              : path.join(context.workspacePath, runMeta.allureReportPath);
          } else if (runMeta.reportPath) {
            reportPath = path.isAbsolute(runMeta.reportPath)
              ? runMeta.reportPath
              : path.join(context.workspacePath, runMeta.reportPath);
          }
        }

        // Determine environment info
        const environment = {
          executionProfile: runMeta?.source === 'browserstack' ? 'browserstack' as const : 'local' as const,
          browser: runMeta?.browserstack ? 'Chrome' : undefined, // Could be enhanced with actual browser info
          os: runMeta?.browserstack ? 'Windows' : undefined, // Could be enhanced with actual OS info
        };

        const result = await this.jiraService.createDefect({
          summary,
          description: context.firstFailureMessage || undefined,
          issueType: context.issueType || 'Bug',
          testMeta: {
            workspacePath: context.workspacePath,
            workspaceId: context.workspaceId,
            testName: context.testName,
            module: context.module,
            id: context.workspaceId ? `${context.workspaceId}/${context.testName}` : context.testName,
          },
          links: {
            browserStackSessionUrl: context.browserStackSessionUrl,
            browserStackTmTestCaseUrl: context.browserStackTmTestCaseUrl,
            browserStackTmRunUrl: context.browserStackTmRunUrl,
          },
          attachments: {
            screenshotPath: context.screenshotPath || (screenshotPaths.length > 0 ? screenshotPaths[0] : undefined),
            screenshotPaths: screenshotPaths.length > 1 ? screenshotPaths : undefined,
            tracePath: tracePath,
            playwrightReportPath: reportPath,
            videoPath: undefined, // Videos are currently disabled, but structure supports it
          },
          runId: context.runId,
          startedAt: startedAt,
          finishedAt: finishedAt,
          environment: environment,
        });

        return {
          success: true,
          issueKey: result.issueKey,
          issueUrl: result.issueUrl,
        };
      } catch (error: any) {
        // Return user-friendly error messages
        const errorMessage = error.message || 'Failed to create Jira defect';
        if (errorMessage.includes('not configured') || errorMessage.includes('email') || errorMessage.includes('API token')) {
          return {
            success: false,
            error: 'Jira integration is not configured. Please set Jira URL, project key, and credentials in Settings.',
          };
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    });
  }

  /**
   * Find project root (directory containing package.json)
   * Separate copy from TestExecutor to avoid circular deps.
   */
  private findProjectRoot(): string {
    let currentDir = __dirname;

    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    return process.cwd();
  }

  /**
   * Spawn a one-off process and capture stdout/stderr until completion.
   * Uses cross-platform spawning that works on restricted corporate systems.
   */
  private spawnOnce(command: string, args: string[], options: SpawnOptions & { cwd: string }): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        ...options,
        shell: true,
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err: any) => {
        // Enhance error message for ENOENT (common on restricted systems)
        if (err.code === 'ENOENT' || err.message?.includes('ENOENT')) {
          const enhancedError = new Error(
            `Command not found (ENOENT): ${command}. This often happens on corporate devices with restricted command line access. Original error: ${err.message}`
          );
          (enhancedError as any).code = err.code;
          reject(enhancedError);
        } else {
          reject(err);
        }
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });
    });
  }

  /**
   * Calculate directory statistics (file count and total size)
   */
  private calculateDirectoryStats(dirPath: string): { count: number; size: number } {
    let count = 0;
    let size = 0;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        try {
          if (entry.isDirectory()) {
            const subStats = this.calculateDirectoryStats(entryPath);
            count += subStats.count;
            size += subStats.size;
          } else {
            const stats = fs.statSync(entryPath);
            count++;
            size += stats.size;
          }
        } catch (e) {
          // Skip files we can't access
        }
      }
    } catch (e) {
      // Return zero stats if directory can't be read
    }

    return { count, size };
  }

  /**
   * Handle list runs request
   */
  private async handleListRuns(request: { workspacePath: string; testName?: string }): Promise<{ success: boolean; runs?: TestRunMeta[]; error?: string }> {
    try {
      const indexPath = path.join(request.workspacePath, 'runs', 'index.json');
      
      if (!fs.existsSync(indexPath)) {
        return { success: true, runs: [] };
      }

      const content = fs.readFileSync(indexPath, 'utf-8');
      const index: RunIndex = JSON.parse(content);

      let runs = index.runs || [];

      // Filter by testName if provided
      if (request.testName) {
        runs = runs.filter(r => r.testName === request.testName);
      }

      return { success: true, runs };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to list runs' };
    }
  }

  /**
   * Handle get run request
   */
  private async handleGetRun(request: { workspacePath: string; runId: string }): Promise<{ success: boolean; run?: TestRunMeta; error?: string }> {
    try {
      const indexPath = path.join(request.workspacePath, 'runs', 'index.json');
      
      if (!fs.existsSync(indexPath)) {
        return { success: false, error: 'No runs found' };
      }

      const content = fs.readFileSync(indexPath, 'utf-8');
      const index: RunIndex = JSON.parse(content);

      const run = index.runs?.find((r: TestRunMeta) => r.runId === request.runId);

      if (!run) {
        return { success: false, error: `Run not found: ${request.runId}` };
      }

      return { success: true, run };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get run' };
    }
  }

  /**
   * Handle test list request
   */
  private async handleTestList(request: TestListRequest): Promise<{ success: boolean; tests?: TestSummary[]; error?: string }> {
    try {
      const testsDir = path.join(request.workspacePath, 'tests');
      if (!fs.existsSync(testsDir)) {
        return { success: true, tests: [] };
      }

      const tests: TestSummary[] = [];
      
      // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
      // Recursively find all .spec.ts files in bundle structure
      const specFiles: string[] = [];
      const findSpecFiles = (dir: string, baseDir: string = '') => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(baseDir, entry.name);
          if (entry.isDirectory()) {
            findSpecFiles(fullPath, relativePath);
          } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
            specFiles.push(fullPath);
          }
        }
      };
      findSpecFiles(testsDir);

      for (const specPath of specFiles) {
        // Extract test name from bundle path: tests/d365/specs/<TestName>/<TestName>.spec.ts
        const bundleMatch = specPath.match(/tests[\/\\]d365[\/\\]specs[\/\\]([^\/\\]+)[\/\\][^\/\\]+\.spec\.ts$/);
        const fileName = bundleMatch ? bundleMatch[1] : path.basename(specPath, '.spec.ts');
        const testName = fileName; // Use fileName as testName (already kebab-case)
        
        const specRelPath = path.relative(request.workspacePath, specPath).replace(/\\/g, '/');
        const bundleDir = path.dirname(specPath);
        const metaPath = path.join(bundleDir, `${fileName}.meta.json`);
        const metaRelPath = path.relative(request.workspacePath, metaPath).replace(/\\/g, '/');
        
        // Data file is at tests/d365/data/<TestName>Data.json
        const dataPath = path.join(request.workspacePath, 'tests', 'd365', 'data', `${fileName}Data.json`);
        const dataRelPath = path.relative(request.workspacePath, dataPath).replace(/\\/g, '/');

        // Read meta if exists
        let meta: TestMeta | null = null;
        const fullMetaPath = path.join(request.workspacePath, metaRelPath);
        if (fs.existsSync(fullMetaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(fullMetaPath, 'utf-8'));
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Read data if exists
        let datasetCount = 0;
        const fullDataPath = path.join(request.workspacePath, dataRelPath);
        if (fs.existsSync(fullDataPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(fullDataPath, 'utf-8'));
            datasetCount = Array.isArray(data) ? data.length : 0;
          } catch (e) {
            // Ignore parse errors
          }
        }

        tests.push({
          testName,
          module: meta?.module,
          specPath: specRelPath,
          dataPath: fs.existsSync(fullDataPath) ? dataRelPath : undefined,
          metaPath: fs.existsSync(fullMetaPath) ? metaRelPath : undefined,
          datasetCount,
          lastRunAt: meta?.lastRunAt,
          lastStatus: meta?.lastStatus || 'never_run',
          tags: meta?.tags,
        });
      }

      return { success: true, tests };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to list tests' };
    }
  }

  /**
   * Handle login flow
   */
  private async handleLogin(credentials: { username: string; password: string; d365Url?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const d365Url = credentials.d365Url || this.getD365Url() || process.env.D365_URL;
      if (!d365Url) {
        return { success: false, error: 'D365 URL not configured' };
      }

      const storageStatePath = this.getStorageStatePath();

      // Close browser if already open (to start fresh)
      if (this.browserManager.isOpen()) {
        await this.browserManager.close();
      }

      // Launch browser
      await this.browserManager.launch({ headless: false });

      // Perform login
      await this.browserManager.performLogin(
        d365Url,
        credentials.username,
        credentials.password,
        storageStatePath,
        (message) => {
          // Emit progress events to renderer
          if (this.mainWindow) {
            this.mainWindow.webContents.send('login:progress', message);
          }
          console.log('Login progress:', message);
        }
      );

      // Close browser after login
      await this.browserManager.close();

      // Save storage state path to config (same as createStorageState)
      this.configManager.setStorageStatePath(storageStatePath);

      return { success: true };
    } catch (error: any) {
      // Ensure browser is closed on error
      if (this.browserManager.isOpen()) {
        await this.browserManager.close().catch(() => {});
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle web login flow (for FH web and other web applications)
   */
  private async handleWebLogin(credentials: {
    webUrl: string;
    username: string;
    password: string;
    workspacePath: string;
    loginSelectors?: {
      usernameSelector?: string;
      passwordSelector?: string;
      submitSelector?: string;
      loginButtonSelector?: string;
      waitForSelector?: string;
    };
  }): Promise<{ success: boolean; error?: string; storageStatePath?: string }> {
    try {
      if (!credentials.webUrl) {
        return { success: false, error: 'Web URL is required' };
      }

      // Create workspace-specific storage state path
      const storageStateDir = path.join(credentials.workspacePath, 'storage_state');
      if (!fs.existsSync(storageStateDir)) {
        fs.mkdirSync(storageStateDir, { recursive: true });
      }
      const storageStatePath = path.join(storageStateDir, 'web.json');

      // Close browser if already open (to start fresh)
      if (this.browserManager.isOpen()) {
        await this.browserManager.close();
      }

      // Launch browser
      await this.browserManager.launch({ headless: false });

      // Perform web login
      await this.browserManager.performWebLogin(
        credentials.webUrl,
        credentials.username,
        credentials.password,
        storageStatePath,
        (message) => {
          // Emit progress events to renderer
          if (this.mainWindow) {
            this.mainWindow.webContents.send('web-login:progress', message);
          }
          console.log('Web login progress:', message);
        },
        credentials.loginSelectors
      );

      // Close browser after login
      await this.browserManager.close();

      return { success: true, storageStatePath };
    } catch (error: any) {
      // Ensure browser is closed on error
      if (this.browserManager.isOpen()) {
        await this.browserManager.close().catch(() => {});
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle start session
   */
  private async handleStartSession(config: SessionConfig): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      console.log('[Bridge] Starting session:', config.flowName);
      
      // Get storage state path and D365 URL
      const storageStatePath = config.storageStatePath || this.getStorageStatePath();
      const d365Url = this.getD365Url(config);

      console.log('[Bridge] Storage state path:', storageStatePath);
      console.log('[Bridge] D365 URL:', d365Url);

      // Check if we need authentication
      const authCheck = this.checkAuthentication();
      if (authCheck.needsLogin) {
        console.log('[Bridge] Authentication required');
        return { 
          success: false, 
          error: 'Authentication required. Please login first.' 
        };
      }

      // Create session
      console.log('[Bridge] Creating session...');
      const session = this.sessionManager.startSession(config);
      this.currentSessionId = session.id;
      console.log('[Bridge] Session created:', session.id);

      // Launch browser with storage state
      console.log('[Bridge] Launching browser...');
      const page = await this.browserManager.launch({
        headless: false,
        storageStatePath: storageStatePath,
      });
      console.log('[Bridge] Browser launched');

      // Navigate to D365
      if (d365Url) {
        console.log('[Bridge] Navigating to D365...');
        await this.browserManager.navigateToD365(d365Url);
        console.log('[Bridge] Navigation complete');
      }

      // Create recorder engine with module
      console.log('[Bridge] Creating recorder engine...');
      this.recorderEngine = new RecorderEngine(config.module);
      
      // Start recording
      console.log('[Bridge] Starting recording...');
      await this.recorderEngine.startRecording(page, (step: RecordedStep) => {
        this.sessionManager.addStep(session.id, step);
      });
      console.log('[Bridge] Recording started successfully');

      return { success: true, sessionId: session.id };
    } catch (error: any) {
      console.error('[Bridge] Error starting session:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Handle stop session
   */
  private async handleStopSession(sessionId: string): Promise<{ success: boolean }> {
    try {
      this.recorderEngine.stopRecording();
      this.sessionManager.stopSession(sessionId);
      this.currentSessionId = null;
      return { success: true };
    } catch (error: any) {
      return { success: false };
    }
  }

  /**
   * Handle get steps
   */
  private handleGetSteps(sessionId: string): RecordedStep[] {
    return this.sessionManager.getSessionSteps(sessionId);
  }

  /**
   * Handle update step description
   */
  private handleUpdateStep(sessionId: string, stepOrder: number, description: string): { success: boolean } {
    const success = this.sessionManager.updateStepDescription(sessionId, stepOrder, description);
    return { success };
  }

  /**
   * Handle generate code
   */
  private handleGenerateCode(sessionId: string, outputConfig: OutputConfig): { success: boolean; files?: string[]; error?: string } {
    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const steps = session.steps;
      if (steps.length === 0) {
        return { success: false, error: 'No steps recorded' };
      }

      // Use recordings directory from config if not specified
      const recordingsDir = this.configManager.getOrInitRecordingsDir();
      const pagesDir = outputConfig.pagesDir || path.join(recordingsDir, 'pages');
      const testsDir = outputConfig.testsDir || path.join(recordingsDir, 'tests');

      // Generate POMs
      const pomFiles = this.pomGenerator.generatePOMs(
        steps,
        pagesDir,
        outputConfig.module || session.module
      );

      // Generate spec (now returns path in bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts)
      const specFile = this.specGenerator.generateSpec(
        session.flowName,
        steps,
        testsDir,
        pagesDir,
        outputConfig.module || session.module
      );

      // Create initial data file for data-driven tests
      // Data file is at tests/d365/data/<TestName>Data.json (not in bundle)
      const parameters = this.specGenerator.detectParametersFromSteps(steps);
      const modulePath = outputConfig.module || session.module ? path.join('d365', outputConfig.module || session.module) : 'd365';
      const dataDir = path.join(testsDir, modulePath, 'data');
      const fileName = this.specGenerator.flowNameToFileName(session.flowName);
      const dataFilePath = path.join(dataDir, `${fileName}Data.json`);
      
      // Create data file if it doesn't exist
      if (!fs.existsSync(dataFilePath)) {
        const dataContent = this.specGenerator.generateInitialDataFile(parameters);
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(dataFilePath, dataContent, 'utf-8');
        console.log(`Generated: ${dataFilePath}`);
      }

      // Write POM files
      this.codeFormatter.writeFiles(pomFiles);

      // Create bundle directory and write spec file
      const bundleDir = path.dirname(specFile.path);
      fs.mkdirSync(bundleDir, { recursive: true });
      fs.writeFileSync(specFile.path, specFile.content, 'utf-8');
      console.log(`Generated: ${specFile.path}`);

      // Generate and write meta.json
      const testName = this.specGenerator.formatTestName(session.flowName);
      const metaJsonContent = this.specGenerator.generateMetaJson(
        testName,
        outputConfig.module || session.module,
        dataFilePath,
        specFile.path
      );
      const metaJsonPath = path.join(bundleDir, `${fileName}.meta.json`);
      fs.writeFileSync(metaJsonPath, metaJsonContent, 'utf-8');
      console.log(`Generated: ${metaJsonPath}`);

      // Ensure BrowserStack TM test case exists for this bundle (v2.0 demo)
      // Fire-and-forget; we don't need to block code generation on this.
      try {
        const bundleMeta = this.browserstackTmService.readBundleMeta(bundleDir);
        this.browserstackTmService.ensureTestCaseForBundle(bundleMeta).catch((e: any) => {
          console.warn('[IPCBridge] Failed to sync BrowserStack TM test case:', e.message);
        });
      } catch (e: any) {
        console.warn('[IPCBridge] Failed to read bundle meta for BrowserStack TM:', e.message);
      }

      // Generate and write meta.md
      const metaMdContent = this.specGenerator.generateMetaMd(
        testName,
        session.flowName,
        specFile.content,
        outputConfig.module || session.module
      );
      const metaMdPath = path.join(bundleDir, `${fileName}.meta.md`);
      fs.writeFileSync(metaMdPath, metaMdContent, 'utf-8');
      console.log(`Generated: ${metaMdPath}`);

      // Return all generated files
      const allFiles = [
        ...pomFiles.map(f => f.path),
        specFile.path,
        metaJsonPath,
        metaMdPath,
      ];

      return {
        success: true,
        files: allFiles,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle close browser
   */
  private async handleCloseBrowser(): Promise<{ success: boolean }> {
    try {
      await this.browserManager.close();
      return { success: true };
    } catch (error: any) {
      return { success: false };
    }
  }
}

