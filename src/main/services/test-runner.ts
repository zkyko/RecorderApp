import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';
import { TestRunRequest, TestRunEvent, TestRunMeta, RunIndex, TestMeta } from '../../types/v1.5';
import { getReporterPath, getReporterSourcePath } from '../utils/path-resolver';
import { LocatorMaintenanceService } from './locator-maintenance';
import { runPlaywright } from '../utils/playwrightRuntime';
import { BrowserStackTmService } from './browserstackTmService';

interface AssertionSummary {
  total: number;
  passed: number;
  failed: number;
  firstFailureMessage?: string;
}

interface RunResultForTM {
  workspacePath: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  assertionSummary: AssertionSummary;
  bsSessionId?: string;
  bsBuildId?: string;
  bsSessionUrl?: string;
  screenshotPath?: string;
  tracePath?: string;
  playwrightReportPath?: string;
  environment?: {
    browser?: string;
    os?: string;
    executionProfile?: 'local' | 'browserstack';
  };
}

/**
 * Service for running Playwright tests with streaming output
 * v1.5: Uses workspace root as execution context, not dev repo
 */
export class TestRunner {
  private currentProcess: ChildProcess | null = null;
  private mainWindow: BrowserWindow | null = null;
  private locatorMaintenance: LocatorMaintenanceService | null = null;
  private browserStackTMService: BrowserStackTmService;

  constructor(mainWindow: BrowserWindow | null, locatorMaintenance?: LocatorMaintenanceService, browserStackTMService?: BrowserStackTmService) {
    this.mainWindow = mainWindow;
    this.locatorMaintenance = locatorMaintenance || null;
    this.browserStackTMService = browserStackTMService || new BrowserStackTmService(new (require('../config-manager').ConfigManager)());
  }


  /**
   * Resolve spec path from test name or spec path
   * Handles both old structure (tests/<TestName>.spec.ts) and new bundle structure (tests/d365/specs/<TestName>/<TestName>.spec.ts)
   */
  private resolveSpecPath(workspacePath: string, specPathOrTestName: string): string | null {
    // If it's already an absolute path, use it
    if (path.isAbsolute(specPathOrTestName)) {
      return fs.existsSync(specPathOrTestName) ? specPathOrTestName : null;
    }

    // Try to extract test name from spec path (e.g., "tests/CreateSalesOrder.spec.ts" -> "CreateSalesOrder")
    let testName: string;
    if (specPathOrTestName.includes('/') || specPathOrTestName.includes('\\')) {
      // It's a path, extract the test name
      const fileName = path.basename(specPathOrTestName, '.spec.ts');
      testName = fileName;
    } else {
      // It's just a test name
      testName = specPathOrTestName;
    }

    // Convert test name to file name - try multiple variations
    const fileNameVariations = [
      // All lowercase, no dashes (for camelCase like "CreateSalesOrder" -> "createsalesorder")
      testName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      // All lowercase with dashes (for names with spaces like "Create Sales Order" -> "create-sales-order")
      testName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      // Original test name (in case it's already in the right format)
      testName,
    ];

    // Try each variation in the new bundle structure first
    for (const fileName of fileNameVariations) {
      // New bundle structure: tests/<platform>/specs/<TestName>/<TestName>.spec.ts
      const d365BundleSpecPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.spec.ts`);
      if (fs.existsSync(d365BundleSpecPath)) {
        return d365BundleSpecPath;
      }

      const webBundleSpecPath = path.join(workspacePath, 'tests', 'web', 'specs', fileName, `${fileName}.spec.ts`);
      if (fs.existsSync(webBundleSpecPath)) {
        return webBundleSpecPath;
      }

      // Old module structure: tests/d365/<TestName>/<TestName>.spec.ts
      const oldModuleSpecPath = path.join(workspacePath, 'tests', 'd365', fileName, `${fileName}.spec.ts`);
      if (fs.existsSync(oldModuleSpecPath)) {
        return oldModuleSpecPath;
      }

      // Even older structure: tests/<TestName>.spec.ts
      const oldFlatSpecPath = path.join(workspacePath, 'tests', `${fileName}.spec.ts`);
      if (fs.existsSync(oldFlatSpecPath)) {
        return oldFlatSpecPath;
      }
    }

    // If specPathOrTestName was a path, try it as-is
    const directPath = path.join(workspacePath, specPathOrTestName);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    return null;
  }

  /**
   * Run a test and stream events
   * v1.5: Executes from workspace root with workspace-based config
   */
  async run(request: TestRunRequest): Promise<{ runId: string }> {
    const runId = randomUUID();
    const startedAt = new Date().toISOString();

    // Kill existing process if any
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }

    try {
      // Resolve spec path intelligently (handles both old and new structures)
      const workspaceSpecPath = this.resolveSpecPath(request.workspacePath, request.specPath);

      if (!workspaceSpecPath) {
        this.emitEvent(runId, {
          type: 'error',
          runId,
          message: `Test file not found. Tried to resolve: ${request.specPath}. Please ensure the test exists in the workspace.`,
          timestamp: new Date().toISOString(),
        });
        return { runId };
      }

      // Extract test name from spec path
      const testName = path.basename(workspaceSpecPath, '.spec.ts');
      const specRelPath = path.relative(request.workspacePath, workspaceSpecPath).replace(/\\/g, '/');

      // Determine workspace type by checking workspace.json (needed for storage state and config)
      let workspaceType: string | undefined;
      try {
        const workspaceJsonPath = path.join(request.workspacePath, 'workspace.json');
        if (fs.existsSync(workspaceJsonPath)) {
          const workspaceMeta = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8'));
          workspaceType = workspaceMeta.type;
        }
      } catch (e) {
        // If we can't read workspace.json, assume D365
        console.warn('[TestRunner] Could not determine workspace type, defaulting to D365');
      }

      // Ensure workspace has playwright.config.ts (skip browser install for BrowserStack)
      await this.ensureWorkspaceConfig(request.workspacePath, runId, request.runMode === 'browserstack', workspaceType);

      // Prepare run directories
      const tracesDir = path.join(request.workspacePath, 'traces', runId);
      fs.mkdirSync(tracesDir, { recursive: true });

      // Copy storage state to workspace if needed
      await this.ensureStorageState(request.workspacePath, workspaceType);

      // Create initial run metadata
      const runMeta: TestRunMeta = {
        runId,
        testName,
        specRelPath,
        status: 'running',
        startedAt,
        source: request.runMode || 'local', // v1.6: track execution source
      };
      this.saveRunMeta(request.workspacePath, runMeta);

      // v1.6: Handle BrowserStack mode
      let env: NodeJS.ProcessEnv | undefined = undefined;
      let command: string;
      let args: string[];
      
      if (request.runMode === 'browserstack') {
        console.log('[TestRunner] BrowserStack mode requested');
        console.log('[TestRunner] Target:', request.target || 'Not specified');
        
        // Load BrowserStack settings from workspace
        const browserstackSettings = this.loadBrowserStackSettings(request.workspacePath);
        if (!browserstackSettings.username || !browserstackSettings.accessKey) {
          this.emitEvent(runId, {
            type: 'error',
            runId,
            message: 'BrowserStack credentials not configured. Please set them in Settings → BrowserStack.',
            timestamp: new Date().toISOString(),
          });
          return { runId };
        }
        
        // Ensure BrowserStack config exists
        await this.ensureBrowserStackConfig(request.workspacePath, browserstackSettings, request.target);
        
        // Set environment variables for BrowserStack
        env = {
          ...process.env,
          BROWSERSTACK_USERNAME: browserstackSettings.username,
          BROWSERSTACK_ACCESS_KEY: browserstackSettings.accessKey,
          BROWSERSTACK_LOCAL: 'true', // Enable Local Testing for storage state access
          D365_URL: process.env.D365_URL || 'https://fourhands-test.sandbox.operations.dynamics.com/',
          STORAGE_STATE_PATH: path.join(request.workspacePath, 'storage_state', workspaceType === 'web-demo' ? 'web.json' : 'd365.json'),
        };
        
        // Use BrowserStack config - BrowserStack wrapper requires npx directly
        // Note: BrowserStack wrapper may not work with bundled runtime, so we use npx
        command = 'npx';
        args = [
          'browserstack-node-sdk',
          'playwright',
          'test',
          specRelPath,
          '--config=playwright.browserstack.config.ts',
        ];
        
        console.log('[TestRunner] Running test on BrowserStack');
        
        // For BrowserStack, use direct spawn (wrapper may not work with bundled runtime)
        this.currentProcess = spawn(command, args, {
          cwd: request.workspacePath, // Execute from workspace root
          shell: true,
          env: env,
        });
      } else {
        // Local execution - use bundled runtime if available
        const testArgs = [
          'test',
          specRelPath, // Path relative to workspace root
          '--config=playwright.config.ts',
        ];
        
        // Use the new runtime helper for local execution
        this.currentProcess = runPlaywright(testArgs, {
          cwd: request.workspacePath,
          env: env,
        });
      }
      
      console.log('[TestRunner] Running test from workspace:', request.workspacePath);
      console.log('[TestRunner] Test file:', specRelPath);

      // Emit started event after process is spawned
      this.emitEvent(runId, {
        type: 'status',
        runId,
        status: 'started',
        timestamp: new Date().toISOString(),
      });
      
      console.log('[TestRunner] Spawned process, PID:', this.currentProcess.pid);

      // Collect BrowserStack metadata from output
      let browserstackMetadata: {
        sessionId?: string;
        buildId?: string;
        dashboardUrl?: string;
      } = {};

      // Handle stdout
      this.currentProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        
        // Parse BrowserStack session information from output
        if (request.runMode === 'browserstack') {
          // Look for BrowserStack session URLs and IDs in output
          const sessionMatch = output.match(/browserstack\.com\/automate\/builds\/([^\/]+)\/sessions\/([^\s\)]+)/i);
          if (sessionMatch) {
            browserstackMetadata.buildId = sessionMatch[1];
            browserstackMetadata.sessionId = sessionMatch[2];
            browserstackMetadata.dashboardUrl = `https://automate.browserstack.com/builds/${sessionMatch[1]}/sessions/${sessionMatch[2]}`;
          }
          
          // Alternative pattern: session ID in logs
          const sessionIdMatch = output.match(/session[_\s]id[:\s=]+([a-f0-9-]+)/i);
          if (sessionIdMatch && !browserstackMetadata.sessionId) {
            browserstackMetadata.sessionId = sessionIdMatch[1];
          }
        }
        
        this.emitEvent(runId, {
          type: 'log',
          runId,
          message: output,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle stderr
      this.currentProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        
        // Also check stderr for BrowserStack metadata
        if (request.runMode === 'browserstack') {
          const sessionMatch = error.match(/browserstack\.com\/automate\/builds\/([^\/]+)\/sessions\/([^\s\)]+)/i);
          if (sessionMatch) {
            browserstackMetadata.buildId = sessionMatch[1];
            browserstackMetadata.sessionId = sessionMatch[2];
            browserstackMetadata.dashboardUrl = `https://automate.browserstack.com/builds/${sessionMatch[1]}/sessions/${sessionMatch[2]}`;
          }
          
          // Detect BrowserStack Local Testing errors
          if (error.toLowerCase().includes('local') && 
              (error.toLowerCase().includes('failed') || 
               error.toLowerCase().includes('error') || 
               error.toLowerCase().includes('timeout') ||
               error.toLowerCase().includes('connection'))) {
            this.emitEvent(runId, {
              type: 'error',
              runId,
              message: `⚠️ BrowserStack Local Testing Error Detected:\n${error}\n\n` +
                'If you\'re using storage state files, ensure BrowserStack Local binary is running.\n' +
                'Download from: https://www.browserstack.com/docs/local-testing/getting-started\n' +
                'OR disable Local Testing if not needed (set enableLocalTesting: false in workspace settings)',
              timestamp: new Date().toISOString(),
            });
            // Don't emit the error twice, return early
            return;
          }
        }
        
        this.emitEvent(runId, {
          type: 'error',
          runId,
          message: error,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle process close
      this.currentProcess.on('close', async (code) => {
        const finishedAt = new Date().toISOString();
        const status = code === 0 ? 'passed' : 'failed';
        
        // Move traces from test-results to traces/<runId>/<testName>.zip
        const tracePaths = await this.moveTracesToRunDir(
          request.workspacePath, 
          runId, 
          testName,
          tracesDir
        );
        
        // Generate Allure report
        const allureReportPath = await this.generateAllureReport(request.workspacePath, runId);

        // Load assertion failures from failure artifact if test failed
        let assertionFailures: Array<{ assertionType: string; target: string; expected?: string; actual?: string; line?: number }> | undefined;
        if (status === 'failed') {
          try {
            const bundlePath = path.join(request.workspacePath, 'tests', 'd365', 'specs', testName);
            const failureFilePath = path.join(bundlePath, `${testName}_failure.json`);
            if (fs.existsSync(failureFilePath)) {
              const failureContent = fs.readFileSync(failureFilePath, 'utf-8');
              const failureData = JSON.parse(failureContent);
              if (failureData.assertionFailure) {
                assertionFailures = [{
                  assertionType: failureData.assertionFailure.assertionType,
                  target: failureData.assertionFailure.target,
                  expected: failureData.assertionFailure.expected,
                  actual: failureData.assertionFailure.actual,
                  line: failureData.error?.location?.line,
                }];
              }
            }
          } catch (error: any) {
            console.warn(`[TestRunner] Failed to load assertion failures: ${error.message}`);
          }
        }

        // Update run metadata - always set tracePaths (empty array if none found)
        const updatedRunMeta: TestRunMeta = {
          ...runMeta,
          status,
          finishedAt,
          tracePaths: tracePaths.length > 0 ? tracePaths : [], // Always set, even if empty
          allureReportPath: allureReportPath || undefined,
          // Add BrowserStack metadata if available
          browserstack: request.runMode === 'browserstack' && Object.keys(browserstackMetadata).length > 0
            ? browserstackMetadata
            : undefined,
          // Add assertion failures if available
          assertionFailures,
        };
        this.saveRunMeta(request.workspacePath, updatedRunMeta);

        // Prepare BrowserStack TM run payload
        try {
          const assertionFailures = updatedRunMeta.assertionFailures || [];
          const firstFailure = assertionFailures[0];

          const assertionSummary: AssertionSummary = {
            total: assertionFailures.length,
            passed: assertionFailures.length === 0 && status === 'passed' ? 1 : 0,
            failed: assertionFailures.length,
            firstFailureMessage: firstFailure
              ? `${firstFailure.assertionType} on ${firstFailure.target}: expected ${firstFailure.expected}, actual ${firstFailure.actual}`
              : undefined,
          };

          const runResultForTM: RunResultForTM = {
            workspacePath: request.workspacePath,
            testName,
            status,
            durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
            assertionSummary,
            bsSessionId: updatedRunMeta.browserstack?.sessionId,
            bsSessionUrl: updatedRunMeta.browserstack?.dashboardUrl,
            screenshotPath: undefined,
            tracePath: (updatedRunMeta.tracePaths && updatedRunMeta.tracePaths[0]) || undefined,
            playwrightReportPath: updatedRunMeta.allureReportPath || updatedRunMeta.reportPath,
            environment: {
              executionProfile: request.runMode === 'browserstack' ? 'browserstack' : 'local',
            },
          };

          const bundleDir = this.getBundleDirForTest(request.workspacePath, testName);
          if (bundleDir) {
            try {
              const bundleMeta = this.browserStackTMService.readBundleMeta(bundleDir);
              await this.browserStackTMService.publishRunFromBundle(bundleMeta);
            } catch (e: any) {
              console.warn('[TestRunner] Failed to read bundle meta for BrowserStack TM:', e.message);
            }
          }
        } catch (e: any) {
          console.warn('[TestRunner] Failed to publish run to BrowserStack TM:', e.message);
        }

        // Update TestMeta with last run status and timestamp
        this.updateTestMeta(request.workspacePath, testName, status, finishedAt, runId);
        
        // If test failed, process failure artifacts and update locator status
        if (status === 'failed') {
          await this.processFailureArtifacts(request.workspacePath, testName);
        }
        
        console.log('[TestRunner] Run completed:', {
          runId,
          testName,
          status,
          traceCount: tracePaths.length,
          hasAllureReport: !!allureReportPath,
        });

        this.emitEvent(runId, {
          type: 'finished',
          runId,
          status,
          exitCode: code || undefined,
          timestamp: finishedAt,
        });
        this.currentProcess = null;
      });

      // Handle process error
      this.currentProcess.on('error', (error) => {
        const finishedAt = new Date().toISOString();
        const updatedRunMeta: TestRunMeta = {
          ...runMeta,
          status: 'failed',
          finishedAt,
        };
        this.saveRunMeta(request.workspacePath, updatedRunMeta);
        
        // Update TestMeta with failed status
        this.updateTestMeta(request.workspacePath, testName, 'failed', finishedAt, runId);

        this.emitEvent(runId, {
          type: 'error',
          runId,
          message: `Process error: ${error.message}`,
          timestamp: new Date().toISOString(),
        });
        this.currentProcess = null;
      });

      return { runId };
    } catch (error: any) {
      const finishedAt = new Date().toISOString();
      const testName = path.basename(request.specPath, '.spec.ts');
      const specRelPath = request.specPath;
      
      const runMeta: TestRunMeta = {
        runId,
        testName,
        specRelPath,
        status: 'failed',
        startedAt,
        finishedAt,
      };
      this.saveRunMeta(request.workspacePath, runMeta);

      this.emitEvent(runId, {
        type: 'error',
        runId,
        message: error.message || 'Failed to start test',
        timestamp: new Date().toISOString(),
      });
      return { runId };
    }
  }

  /**
   * Copy ErrorGrabber reporter to workspace runtime directory
   * Uses path resolver to find the reporter source in both dev and production modes
   */
  private copyReporterToWorkspace(workspacePath: string): void {
    try {
      const runtimeDir = path.join(workspacePath, 'runtime', 'reporters');
      fs.mkdirSync(runtimeDir, { recursive: true });
      
      // Use path resolver to get the correct source paths for both dev and production
      const sourceReporterJs = getReporterPath();
      const sourceReporterTs = getReporterSourcePath();
      
      const destReporterJs = path.join(runtimeDir, 'ErrorGrabber.js');
      const destReporterTs = path.join(runtimeDir, 'ErrorGrabber.ts');
      
      // Try compiled JavaScript version first
      if (fs.existsSync(sourceReporterJs)) {
        fs.copyFileSync(sourceReporterJs, destReporterJs);
        console.log(`[TestRunner] Copied ErrorGrabber reporter (JS) to workspace from: ${sourceReporterJs}`);
      } 
      // Fallback to TypeScript source (for development or if not compiled)
      else if (fs.existsSync(sourceReporterTs)) {
        fs.copyFileSync(sourceReporterTs, destReporterTs);
        // Also update config to use .ts extension
        console.log(`[TestRunner] Copied ErrorGrabber reporter (TS) to workspace from: ${sourceReporterTs}`);
        // Note: Config will need to reference .ts if source is used
      } else {
        console.warn('[TestRunner] ErrorGrabber reporter not found at expected paths, skipping copy');
        console.warn(`[TestRunner] Checked JS: ${sourceReporterJs}`);
        console.warn(`[TestRunner] Checked TS: ${sourceReporterTs}`);
      }
    } catch (error: any) {
      console.warn(`[TestRunner] Failed to copy ErrorGrabber reporter: ${error.message}`);
      // Don't fail config generation if reporter copy fails
    }
  }

  /**
   * Ensure workspace has playwright.config.ts and Playwright installed
   */
  private async ensureWorkspaceConfig(workspacePath: string, runId: string, skipBrowserInstall: boolean = false, workspaceType?: string): Promise<void> {
    // Ensure package.json exists in workspace
    const packageJsonPath = path.join(workspacePath, 'package.json');
    let needsInstall = false;
    
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: 'qa-studio-workspace',
        version: '1.0.0',
        private: true,
        dependencies: {
          '@playwright/test': '^1.40.0',
          'dotenv': '^16.0.0',
          'allure-playwright': '^2.13.0',
          'allure-commandline': '^2.30.0',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      console.log('[TestRunner] Created package.json in workspace');
      needsInstall = true;
    } else {
      // Check if dependencies are missing
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const hasPlaywright = packageJson.dependencies?.['@playwright/test'] || packageJson.devDependencies?.['@playwright/test'];
        const hasDotenv = packageJson.dependencies?.['dotenv'] || packageJson.devDependencies?.['dotenv'];
        const hasAllurePlaywright = packageJson.dependencies?.['allure-playwright'] || packageJson.devDependencies?.['allure-playwright'];
        const hasAllureCommandline = packageJson.dependencies?.['allure-commandline'] || packageJson.devDependencies?.['allure-commandline'];
        
        // Always ensure all required packages are in package.json
        if (!packageJson.dependencies) packageJson.dependencies = {};
        let needsUpdate = false;
        
        if (!hasPlaywright) {
          packageJson.dependencies['@playwright/test'] = '^1.40.0';
          needsUpdate = true;
        }
        if (!hasDotenv) {
          packageJson.dependencies['dotenv'] = '^16.0.0';
          needsUpdate = true;
        }
        // Always add Allure reporter (required for v1.5)
        if (!hasAllurePlaywright) {
          packageJson.dependencies['allure-playwright'] = '^2.13.0';
          needsUpdate = true;
        }
        if (!hasAllureCommandline) {
          packageJson.dependencies['allure-commandline'] = '^2.30.0';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
          needsInstall = true;
        }
        
        // Also check if node_modules exists and has the Allure packages
        const nodeModulesPath = path.join(workspacePath, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          const hasAllureInNodeModules = fs.existsSync(path.join(nodeModulesPath, 'allure-playwright'));
          if (!hasAllureInNodeModules) {
            console.log('[TestRunner] allure-playwright not found in node_modules, will install');
            needsInstall = true;
          }
        } else {
          needsInstall = true;
        }
      } catch (error) {
        console.warn('[TestRunner] Failed to parse package.json, will install dependencies');
        needsInstall = true;
      }
    }

    // Check if node_modules exists, if not, install dependencies
    const nodeModulesPath = path.join(workspacePath, 'node_modules', '@playwright', 'test');
    if (!fs.existsSync(nodeModulesPath) || needsInstall) {
      console.log('[TestRunner] Installing dependencies in workspace...');
      const installProcess = spawn('npm', ['install'], {
        cwd: workspacePath,
        shell: true,
        env: { ...process.env },
        stdio: 'pipe', // Use pipe instead of inherit to avoid blocking
      });
      
      // Stream output for debugging
      installProcess.stdout?.on('data', (data) => {
        console.log('[TestRunner] npm install:', data.toString().trim());
      });
      
      installProcess.stderr?.on('data', (data) => {
        console.warn('[TestRunner] npm install stderr:', data.toString().trim());
      });
      
      await new Promise<void>((resolve, reject) => {
        installProcess.on('close', async (code) => {
          if (code === 0) {
            console.log('[TestRunner] Dependencies installed in workspace');
            // After npm install, install Playwright browsers (skip for BrowserStack)
            if (!skipBrowserInstall) {
              await this.installPlaywrightBrowsers(workspacePath);
            } else {
              console.log('[TestRunner] Skipping browser installation (BrowserStack mode)');
            }
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
        installProcess.on('error', reject);
      });
    } else {
      // Even if node_modules exists, check if browsers are installed (skip for BrowserStack)
      if (!skipBrowserInstall) {
        await this.ensurePlaywrightBrowsers(workspacePath);
      } else {
        console.log('[TestRunner] Skipping browser check (BrowserStack mode)');
      }
    }

    const configPath = path.join(workspacePath, 'playwright.config.ts');
    
    // Always regenerate config to ensure it uses Allure reporter
    // Generate workspace-specific playwright config
    const configContent = this.generateWorkspaceConfig(workspacePath, runId, workspaceType);
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('[TestRunner] Created/updated playwright.config.ts in workspace');
  }

  /**
   * Install Playwright browsers (installed globally, not per-workspace)
   */
  private async installPlaywrightBrowsers(workspacePath: string): Promise<void> {
    console.log('[TestRunner] Installing Playwright browsers (this may take a few minutes)...');
    // Use the new runtime helper which handles bundled vs system runtime
    const installProcess = runPlaywright(['install', 'chromium'], {
      cwd: workspacePath, // Run from workspace, but browsers install globally
      stdio: 'pipe',
    });

    installProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log('[TestRunner] playwright install:', output);
      }
    });

    installProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      // Filter out progress messages that are sent to stderr
      if (output && !output.includes('Downloading') && !output.includes('Installing')) {
        console.warn('[TestRunner] playwright install stderr:', output);
      }
    });

    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[TestRunner] Playwright browsers installed successfully');
          resolve();
        } else {
          // Don't fail the test run if browser install fails - user can install manually
          console.warn(`[TestRunner] playwright install exited with code ${code}. Browsers may not be installed.`);
          console.warn('[TestRunner] You may need to run: npx playwright install');
          resolve(); // Resolve instead of reject to allow test to continue
        }
      });
      installProcess.on('error', (error: any) => {
        if (error.code === 'ENOENT' || error.message?.includes('ENOENT')) {
          console.warn('[TestRunner] Playwright install failed: System command line is restricted. This often happens on corporate devices.');
        } else {
          console.warn('[TestRunner] Failed to run playwright install:', error.message);
        }
        console.warn('[TestRunner] You may need to run: npx playwright install');
        resolve(); // Resolve instead of reject
      });
    });
  }

  /**
   * Ensure Playwright browsers are installed (check and install if needed)
   * Browsers are installed globally in %LOCALAPPDATA%\ms-playwright\ on Windows
   */
  private async ensurePlaywrightBrowsers(workspacePath: string): Promise<void> {
    const playwrightDir = path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'ms-playwright'
    );

    if (!fs.existsSync(playwrightDir)) {
      console.log('[TestRunner] Playwright browsers directory not found, installing...');
      await this.installPlaywrightBrowsers(workspacePath);
      return;
    }

    // Check if chromium directory exists
    try {
      const entries = fs.readdirSync(playwrightDir);
      const chromiumDirs = entries.filter(dir => dir.startsWith('chromium-'));
      if (chromiumDirs.length === 0) {
        console.log('[TestRunner] Chromium browser not found, installing...');
        await this.installPlaywrightBrowsers(workspacePath);
      } else {
        // Verify chromium executable exists
        const chromiumDir = chromiumDirs[0];
        const chromeExe = path.join(playwrightDir, chromiumDir, 'chrome-win64', 'chrome.exe');
        if (!fs.existsSync(chromeExe)) {
          console.log('[TestRunner] Chromium executable not found, installing...');
          await this.installPlaywrightBrowsers(workspacePath);
        }
      }
    } catch (error) {
      // If we can't check, try installing anyway
      console.log('[TestRunner] Could not verify browser installation, attempting install...');
      await this.installPlaywrightBrowsers(workspacePath);
    }
  }

  /**
   * Load BrowserStack settings from workspace
   */
  private loadBrowserStackSettings(workspacePath: string): { username: string; accessKey: string; project?: string; buildPrefix?: string } {
    const settingsPath = path.join(workspacePath, 'workspace-settings.json');
    if (!fs.existsSync(settingsPath)) {
      return { username: '', accessKey: '', project: '', buildPrefix: '' };
    }
    
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return {
        username: settings.browserstack?.username || '',
        accessKey: settings.browserstack?.accessKey || '',
        project: settings.browserstack?.project || '',
        buildPrefix: settings.browserstack?.buildPrefix || '',
      };
    } catch (error) {
      console.warn('[TestRunner] Failed to load BrowserStack settings:', error);
      return { username: '', accessKey: '', project: '', buildPrefix: '' };
    }
  }

  /**
   * Ensure BrowserStack config file exists in workspace
   */
  private async ensureBrowserStackConfig(
    workspacePath: string,
    settings: { username: string; accessKey: string; project?: string; buildPrefix?: string },
    target?: string
  ): Promise<void> {
    const configPath = path.join(workspacePath, 'playwright.browserstack.config.ts');
    
    // Determine browser/OS from target (default to Chrome on Windows 11)
    const browserName = target?.toLowerCase().includes('edge') ? 'Edge' : 'Chrome';
    const osName = target?.toLowerCase().includes('mac') ? 'OS X' : 'Windows';
    const osVersion = target?.toLowerCase().includes('mac') ? 'Ventura' : '11';
    
    const buildName = settings.buildPrefix 
      ? `${settings.buildPrefix}-${new Date().toISOString().split('T')[0]}`
      : `D365-Recorder-${new Date().toISOString().split('T')[0]}`;
    
    const configContent = this.generateBrowserStackConfig(browserName, osName, osVersion, settings.project || 'D365 Auto-Recorder', buildName);
    
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('[TestRunner] Created/updated playwright.browserstack.config.ts');
  }

  /**
   * Generate BrowserStack Playwright config
   */
  private generateBrowserStackConfig(
    browserName: string,
    osName: string,
    osVersion: string,
    projectName: string,
    buildName: string
  ): string {
    return `import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Playwright configuration for BrowserStack execution
 * Uses Chrome DevTools Protocol (CDP) to connect to BrowserStack
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests sequentially on BrowserStack */
  fullyParallel: false,
  workers: 1,
  
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  reporter: [
    ['list'],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: false,
    }],
    ['./runtime/reporters/ErrorGrabber.js'],
  ],
  
  use: {
    baseURL: process.env.D365_URL || 'https://fourhands-test.sandbox.operations.dynamics.com/',
    trace: 'on',
    screenshot: 'on',
    video: 'off',
    storageState: process.env.STORAGE_STATE_PATH || 'storage_state/d365.json', // Will be overridden by STORAGE_STATE_PATH env var
    viewport: { width: 1920, height: 1080 },
    // BrowserStack connection via CDP
    connectOptions: {
      wsEndpoint: getBrowserStackEndpoint(),
    },
  },

  projects: [
    {
      name: 'browserstack',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});

/**
 * Construct BrowserStack CDP endpoint URL
 * Requires BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables
 */
function getBrowserStackEndpoint(): string {
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;

  if (!username || !accessKey) {
    throw new Error(
      'BrowserStack credentials not found. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.'
    );
  }

  const enableLocalTesting = process.env.BROWSERSTACK_LOCAL === 'true';
  
  const caps = {
    browserName: '${browserName}',
    browserVersion: 'latest',
    os: '${osName}',
    osVersion: '${osVersion}',
    name: 'D365 Test Execution',
    build: '${buildName}',
    'browserstack.username': username,
    'browserstack.accessKey': accessKey,
    'browserstack.local': enableLocalTesting ? 'true' : 'false',
    'browserstack.networkLogs': 'true',
    'browserstack.console': 'info',
  };

  // Encode capabilities as base64
  const capsString = Buffer.from(JSON.stringify(caps)).toString('base64');
  
  return \`wss://cdp.browserstack.com/playwright?caps=\${encodeURIComponent(capsString)}\`;
}
`;
  }

  /**
   * Generate workspace-specific Playwright config
   * v1.5: Uses Allure reporter instead of HTML
   */
  private generateWorkspaceConfig(workspacePath: string, runId: string, workspaceType?: string): string {
    // Copy ErrorGrabber reporter to workspace runtime directory
    this.copyReporterToWorkspace(workspacePath);
    
    const storageStatePath = workspaceType === 'web-demo' ? 'storage_state/web.json' : 'storage_state/d365.json';
    
    return `import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['list'],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: false,
    }],
    ['./runtime/reporters/ErrorGrabber.js'],
  ],
  
  use: {
    baseURL: process.env.D365_URL || 'https://fourhands-test.sandbox.operations.dynamics.com/',
    trace: 'on',              // Always trace for QA Studio runs
    screenshot: 'on',          // Capture screenshots
    video: 'off',             // Disable video to save space
    storageState: '${storageStatePath}',
    headless: false,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
  }

  /**
   * Ensure storage state exists in workspace
   */
  private async ensureStorageState(workspacePath: string, workspaceType?: string): Promise<void> {
    // For web-demo workspaces, use web.json instead of d365.json
    const storageStateFileName = workspaceType === 'web-demo' ? 'web.json' : 'd365.json';
    const workspaceStorageState = path.join(workspacePath, 'storage_state', storageStateFileName);
    
    if (fs.existsSync(workspaceStorageState)) {
      return; // Already exists
    }

    // For D365 workspaces, copy from default location
    if (workspaceType !== 'web-demo') {
      // Try default QA Studio location
      const defaultStorageState = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'QA-Studio',
        'storage_state',
        'd365.json'
      );

      if (fs.existsSync(defaultStorageState)) {
        const workspaceStorageStateDir = path.join(workspacePath, 'storage_state');
        fs.mkdirSync(workspaceStorageStateDir, { recursive: true });
        fs.copyFileSync(defaultStorageState, workspaceStorageState);
        console.log('[TestRunner] Copied storage state to workspace');
      } else {
        console.warn('[TestRunner] Storage state not found. Tests may fail without authentication.');
      }
    } else {
      // For web-demo, storage state is optional (user can login via UI)
      console.log('[TestRunner] Web storage state not found. User can login via Record screen to save authentication.');
    }
  }

  /**
   * Move traces from test-results to traces/<runId>/<testName>.zip
   * Returns array of workspace-relative trace paths
   */
  private async moveTracesToRunDir(
    workspacePath: string, 
    runId: string, 
    testName: string,
    targetTracesDir: string
  ): Promise<string[]> {
    const testResultsDir = path.join(workspacePath, 'test-results');
    const tracePaths: string[] = [];
    
    if (!fs.existsSync(testResultsDir)) {
      console.log('[TestRunner] No test-results directory found');
      return tracePaths; // No traces generated
    }

    // Find all trace zip files in test-results
    const findTraceFiles = (dir: string): string[] => {
      const files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findTraceFiles(fullPath));
        } else if (entry.name.endsWith('.zip')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const traceFiles = findTraceFiles(testResultsDir);
    
    if (traceFiles.length === 0) {
      console.log('[TestRunner] No trace zip files found in test-results');
      return tracePaths; // No trace files found
    }

    // Move trace files to target directory with proper naming
    for (let i = 0; i < traceFiles.length; i++) {
      const traceFile = traceFiles[i];
      const fileName = traceFiles.length === 1 
        ? `${testName}.zip` 
        : `${testName}-${i + 1}.zip`;
      const targetPath = path.join(targetTracesDir, fileName);
      
      try {
        // Ensure target directory exists
        fs.mkdirSync(targetTracesDir, { recursive: true });
        
        // Move the file
        fs.renameSync(traceFile, targetPath);
        
        // Calculate workspace-relative path
        const relPath = path.relative(workspacePath, targetPath).replace(/\\/g, '/');
        tracePaths.push(relPath);
        
        console.log('[TestRunner] Moved trace:', fileName, '→', relPath);
      } catch (error) {
        console.warn('[TestRunner] Failed to move trace:', error);
      }
    }

    return tracePaths;
  }

  /**
   * Generate Allure static report for this run
   * Returns workspace-relative path to the report index.html, or null if generation failed
   */
  private async generateAllureReport(workspacePath: string, runId: string): Promise<string | null> {
    const allureResultsDir = path.join(workspacePath, 'allure-results');
    const allureReportDir = path.join(workspacePath, 'allure-report', runId);
    
    // Check if allure-results exists and has files
    if (!fs.existsSync(allureResultsDir)) {
      console.log('[TestRunner] No allure-results directory found');
      return null;
    }

    const resultsFiles = fs.readdirSync(allureResultsDir);
    if (resultsFiles.length === 0) {
      console.log('[TestRunner] allure-results directory is empty');
      return null;
    }

    console.log('[TestRunner] Generating Allure report for run:', runId);
    
    try {
      // Run allure generate command
      const args = [
        'allure',
        'generate',
        'allure-results',
        '--clean',
        '-o',
        `allure-report/${runId}`,
      ];

      const generateProcess = spawn('npx', args, {
        cwd: workspacePath,
        shell: true,
        env: { ...process.env },
        stdio: 'pipe',
      });

      // Stream output for debugging
      generateProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log('[TestRunner] allure generate:', output);
        }
      });

      generateProcess.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('Report successfully generated')) {
          console.warn('[TestRunner] allure generate stderr:', output);
        }
      });

      await new Promise<void>((resolve, reject) => {
        generateProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Allure generation failed with code ${code}`));
          }
        });
        generateProcess.on('error', reject);
      });

      // Verify report was generated
      const reportIndexPath = path.join(allureReportDir, 'index.html');
      if (fs.existsSync(reportIndexPath)) {
        const relPath = path.relative(workspacePath, reportIndexPath).replace(/\\/g, '/');
        console.log('[TestRunner] Allure report generated at:', relPath);
        return relPath;
      } else {
        console.warn('[TestRunner] Allure report index.html not found after generation');
        return null;
      }
    } catch (error: any) {
      console.error('[TestRunner] Failed to generate Allure report:', error.message);
      return null;
    }
  }

  /**
   * Find report index.html path
   */
  private findReportPath(reportsDir: string, workspacePath: string): string | null {
    const reportIndexPath = path.join(reportsDir, 'index.html');
    
    if (fs.existsSync(reportIndexPath)) {
      return path.relative(workspacePath, reportIndexPath).replace(/\\/g, '/');
    }

    return null;
  }

  /**
   * Save or update run metadata in runs/index.json
   */
  private saveRunMeta(workspacePath: string, runMeta: TestRunMeta): void {
    const runsDir = path.join(workspacePath, 'runs');
    fs.mkdirSync(runsDir, { recursive: true });
    
    const indexPath = path.join(runsDir, 'index.json');
    let index: RunIndex = { runs: [] };

    // Load existing index
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf-8');
        index = JSON.parse(content);
      } catch (error) {
        console.warn('[TestRunner] Failed to parse runs/index.json, creating new one');
        index = { runs: [] };
      }
    }

    // Update or add run
    const existingIndex = index.runs.findIndex(r => r.runId === runMeta.runId);
    if (existingIndex >= 0) {
      index.runs[existingIndex] = runMeta;
    } else {
      index.runs.push(runMeta);
    }

    // Sort by startedAt descending (newest first)
    index.runs.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Save
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Stop current test execution
   */
  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }

  /**
   * Emit an event to the renderer
   */
  private emitEvent(runId: string, event: TestRunEvent): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('test:run:events', event);
    }
  }

  /**
   * Update TestMeta with last run status and timestamp
   * Updates the .meta.json file in the test bundle: tests/d365/specs/<TestName>/<TestName>.meta.json
   */
  private updateTestMeta(workspacePath: string, testName: string, status: 'passed' | 'failed', finishedAt: string, runId: string): void {
    try {
      // Convert test name to file name (kebab-case, lowercase)
      const fileName = testName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Try new bundle structure first: tests/d365/specs/<TestName>/<TestName>.meta.json
      let metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);
      
      // Fallback to old structures if bundle doesn't exist
      if (!fs.existsSync(metaPath)) {
        // Old module structure: tests/d365/<TestName>/<TestName>.meta.json
        const oldModulePath = path.join(workspacePath, 'tests', 'd365', fileName, `${fileName}.meta.json`);
        if (fs.existsSync(oldModulePath)) {
          metaPath = oldModulePath;
        } else {
          // Even older structure: tests/<TestName>.meta.json
          const oldFlatPath = path.join(workspacePath, 'tests', `${fileName}.meta.json`);
          if (fs.existsSync(oldFlatPath)) {
            metaPath = oldFlatPath;
          } else {
            // If no meta file exists, use bundle structure (will be created)
            metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);
          }
        }
      }
      
      let meta: any = {
        name: testName,
        createdAt: new Date().toISOString(),
        lastRunAt: finishedAt,
        lastStatus: status,
        lastRunId: runId,
      };

      // Load existing meta if it exists
      if (fs.existsSync(metaPath)) {
        try {
          const existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          meta = {
            ...existingMeta,
            lastRunAt: finishedAt,
            lastStatus: status,
            lastRunId: runId,
            updatedAt: finishedAt,
          };
        } catch (e) {
          console.warn(`[TestRunner] Failed to parse existing meta for ${testName}, creating new one`);
        }
      }

      // Ensure directory exists
      const metaDir = path.dirname(metaPath);
      fs.mkdirSync(metaDir, { recursive: true });

      // Save updated meta
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      console.log(`[TestRunner] Updated test meta: ${path.relative(workspacePath, metaPath)}`);
      
      // Emit IPC event to notify frontend
      this.emitTestUpdate(workspacePath, testName, status, finishedAt, runId);
    } catch (error: any) {
      console.error(`[TestRunner] Failed to update TestMeta for ${testName}:`, error.message);
    }
  }

  /**
   * Emit IPC event to notify frontend that test status has been updated
   */
  private emitTestUpdate(workspacePath: string, testName: string, status: 'passed' | 'failed', finishedAt: string, runId: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('test:update', {
        workspacePath,
        testName,
        status,
        lastRunAt: finishedAt,
        lastRunId: runId,
      });
    }
  }

  /**
   * Resolve bundle directory for a given test name based on meta.json location.
   * Uses the same slugging and fallback logic as updateTestMeta.
   */
  private getBundleDirForTest(workspacePath: string, testName: string): string | null {
    try {
      const fileName = testName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // New bundle structure: tests/d365/specs/<TestName>/<TestName>.meta.json
      let metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);

      if (!fs.existsSync(metaPath)) {
        // Old module structure: tests/d365/<TestName>/<TestName>.meta.json
        const oldModulePath = path.join(workspacePath, 'tests', 'd365', fileName, `${fileName}.meta.json`);
        if (fs.existsSync(oldModulePath)) {
          metaPath = oldModulePath;
        } else {
          // Even older structure: tests/<TestName>.meta.json
          const oldFlatPath = path.join(workspacePath, 'tests', `${fileName}.meta.json`);
          if (fs.existsSync(oldFlatPath)) {
            metaPath = oldFlatPath;
          } else {
            // If no meta file exists, fall back to new bundle structure
            metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);
          }
        }
      }

      return path.dirname(metaPath);
    } catch (e: any) {
      console.warn('[TestRunner] Failed to resolve bundle directory for test:', testName, e.message);
      return null;
    }
  }

  /**
   * Process failure artifacts and update locator status for failed locators
   */
  private async processFailureArtifacts(workspacePath: string, testName: string): Promise<void> {
    if (!this.locatorMaintenance) {
      console.log('[TestRunner] LocatorMaintenanceService not available, skipping locator status update');
      return;
    }

    try {
      // Resolve bundle path: prefer new bundle structure for D365 and Web workspaces
      let bundlePath = path.join(workspacePath, 'tests', 'd365', 'specs', testName);
      if (!fs.existsSync(bundlePath)) {
        const webBundlePath = path.join(workspacePath, 'tests', 'web', 'specs', testName);
        if (fs.existsSync(webBundlePath)) {
          bundlePath = webBundlePath;
        }
      }
      const failureFilePath = path.join(bundlePath, `${testName}_failure.json`);

      if (!fs.existsSync(failureFilePath)) {
        console.log(`[TestRunner] No failure artifact found at: ${failureFilePath}`);
        return;
      }

      // Read failure artifact
      const failureContent = fs.readFileSync(failureFilePath, 'utf-8');
      const failureData = JSON.parse(failureContent);

      // Check if failure artifact has failed locator info
      if (failureData.failedLocator && failureData.failedLocator.locatorKey) {
        const { locatorKey, locator, type } = failureData.failedLocator;
        const errorMessage = failureData.error?.message || 'Test failed';

        console.log(`[TestRunner] Marking locator as failing: ${locatorKey}`);

        // Update locator status to 'failing' (red)
        await this.locatorMaintenance.setLocatorStatus(
          {
            workspacePath,
            locatorKey,
            status: 'failing',
            note: `Failed in test "${testName}": ${errorMessage.substring(0, 200)}`,
            testName,
          },
          this.mainWindow || undefined
        );

        console.log(`[TestRunner] Successfully marked locator as failing: ${locatorKey}`);
      } else {
        console.log(`[TestRunner] Failure artifact does not contain failed locator info`);
      }

      // Extract assertion failures and store in run metadata
      if (failureData.assertionFailure) {
        console.log(`[TestRunner] Found assertion failure: ${failureData.assertionFailure.assertionType}`);
        // This will be stored in the run metadata when we update it
      }
    } catch (error: any) {
      // Don't fail the test run if we can't process failure artifacts
      console.error(`[TestRunner] Failed to process failure artifacts: ${error.message}`);
    }
  }
}
