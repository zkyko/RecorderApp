import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';
import { TestRunRequest, TestRunEvent, TestRunMeta, RunIndex } from '../../types/v1.5';

/**
 * Service for running Playwright tests with streaming output
 * v1.5: Uses workspace root as execution context, not dev repo
 */
export class TestRunner {
  private currentProcess: ChildProcess | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
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
      // Resolve spec path in workspace
      const workspaceSpecPath = path.isAbsolute(request.specPath)
        ? request.specPath
        : path.join(request.workspacePath, request.specPath);

      if (!fs.existsSync(workspaceSpecPath)) {
        this.emitEvent(runId, {
          type: 'error',
          runId,
          message: `Test file not found: ${workspaceSpecPath}`,
          timestamp: new Date().toISOString(),
        });
        return { runId };
      }

      // Extract test name from spec path
      const testName = path.basename(workspaceSpecPath, '.spec.ts');
      const specRelPath = path.relative(request.workspacePath, workspaceSpecPath).replace(/\\/g, '/');

      // Ensure workspace has playwright.config.ts
      await this.ensureWorkspaceConfig(request.workspacePath, runId);

      // Prepare run directories
      const tracesDir = path.join(request.workspacePath, 'traces', runId);
      fs.mkdirSync(tracesDir, { recursive: true });

      // Copy storage state to workspace if needed
      await this.ensureStorageState(request.workspacePath);

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

      // v1.6: Handle BrowserStack mode (stub for now)
      if (request.runMode === 'browserstack') {
        console.log('[TestRunner] BrowserStack mode requested');
        console.log('[TestRunner] Target:', request.target || 'Not specified');
        console.log('[TestRunner] Note: Real BrowserStack integration will be implemented later');
        // For now, continue with local execution but log the intent
      }

      // Spawn playwright test command from workspace root
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = [
        'playwright',
        'test',
        specRelPath, // Path relative to workspace root
        '--config=playwright.config.ts',
      ];
      
      console.log('[TestRunner] Running test from workspace:', request.workspacePath);
      console.log('[TestRunner] Test file:', specRelPath);

      this.currentProcess = spawn(command, args, {
        cwd: request.workspacePath, // Execute from workspace root
        shell: process.platform === 'win32',
      });

      // Emit started event after process is spawned
      this.emitEvent(runId, {
        type: 'status',
        runId,
        status: 'started',
        timestamp: new Date().toISOString(),
      });
      
      console.log('[TestRunner] Spawned process, PID:', this.currentProcess.pid);

      // Handle stdout
      this.currentProcess.stdout?.on('data', (data) => {
        const output = data.toString();
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

        // Update run metadata - always set tracePaths (empty array if none found)
        const updatedRunMeta: TestRunMeta = {
          ...runMeta,
          status,
          finishedAt,
          tracePaths: tracePaths.length > 0 ? tracePaths : [], // Always set, even if empty
          allureReportPath: allureReportPath || undefined,
        };
        this.saveRunMeta(request.workspacePath, updatedRunMeta);
        
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
   * Ensure workspace has playwright.config.ts and Playwright installed
   */
  private async ensureWorkspaceConfig(workspacePath: string, runId: string): Promise<void> {
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
      const installCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const installProcess = spawn(installCommand, ['install'], {
        cwd: workspacePath,
        shell: process.platform === 'win32',
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
            // After npm install, install Playwright browsers
            await this.installPlaywrightBrowsers(workspacePath);
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
        installProcess.on('error', reject);
      });
    } else {
      // Even if node_modules exists, check if browsers are installed
      await this.ensurePlaywrightBrowsers(workspacePath);
    }

    const configPath = path.join(workspacePath, 'playwright.config.ts');
    
    // Always regenerate config to ensure it uses Allure reporter
    // Generate workspace-specific playwright config
    const configContent = this.generateWorkspaceConfig(workspacePath, runId);
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('[TestRunner] Created/updated playwright.config.ts in workspace');
  }

  /**
   * Install Playwright browsers (installed globally, not per-workspace)
   */
  private async installPlaywrightBrowsers(workspacePath: string): Promise<void> {
    console.log('[TestRunner] Installing Playwright browsers (this may take a few minutes)...');
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const installProcess = spawn(command, ['playwright', 'install', 'chromium'], {
      cwd: workspacePath, // Run from workspace, but browsers install globally
      shell: process.platform === 'win32',
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
      installProcess.on('error', (error) => {
        console.warn('[TestRunner] Failed to run playwright install:', error.message);
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
   * Generate workspace-specific Playwright config
   * v1.5: Uses Allure reporter instead of HTML
   */
  private generateWorkspaceConfig(workspacePath: string, runId: string): string {
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
  ],
  
  use: {
    baseURL: process.env.D365_URL || 'https://fourhands-test.sandbox.operations.dynamics.com/',
    trace: 'on',              // Always trace for QA Studio runs
    screenshot: 'on',          // Capture screenshots
    video: 'off',             // Disable video to save space
    storageState: 'storage_state/d365.json',
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
  private async ensureStorageState(workspacePath: string): Promise<void> {
    const workspaceStorageState = path.join(workspacePath, 'storage_state', 'd365.json');
    
    if (fs.existsSync(workspaceStorageState)) {
      return; // Already exists
    }

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
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = [
        'allure',
        'generate',
        'allure-results',
        '--clean',
        '-o',
        `allure-report/${runId}`,
      ];

      const generateProcess = spawn(command, args, {
        cwd: workspacePath,
        shell: process.platform === 'win32',
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
}
