import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess } from 'child_process';
import { ExecutionProvider } from './ExecutionProvider';
import { ExecutionContext } from '../../../types/execution-context';
import { WorkspaceMeta } from '../../../types/v1.5';
import { TestRunRequest } from '../../../types/v1.5';
import { ConfigManager } from '../../config-manager';
import { runPlaywright } from '../../utils/playwrightRuntime';
import { getReporterPath, getReporterSourcePath } from '../../utils/path-resolver';

/**
 * Execution provider for local Playwright execution
 */
export class LocalPlaywrightProvider implements ExecutionProvider {
  private workspacePath: string = '';
  private workspaceType?: string;
  private runId: string = '';
  private capability?: import('../../../types/capabilities').BrowserCapability;

  constructor(private configManager: ConfigManager) {}

  async prepare(workspace: WorkspaceMeta, request: TestRunRequest): Promise<void> {
    this.workspacePath = workspace.workspacePath;
    this.workspaceType = workspace.type;
    this.capability = request.capability;
    // Store runId for later use if needed
    this.runId = request.specPath; // Will be set properly when we have runId from TestRunner
  }

  async generateConfig(): Promise<void> {
    // Copy ErrorGrabber reporter to workspace runtime directory
    this.copyReporterToWorkspace();

    const configPath = path.join(this.workspacePath, 'playwright.config.ts');
    const configContent = this.generateWorkspaceConfig();
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('[LocalPlaywrightProvider] Created/updated playwright.config.ts in workspace');
  }

  async run(specRelPath: string): Promise<ChildProcess> {
    const testArgs = [
      'test',
      specRelPath,
      '--config=playwright.config.ts',
    ];

    // Use the runtime helper for local execution
    const process = runPlaywright(testArgs, {
      cwd: this.workspacePath,
      env: this.getEnvironmentVariables(),
    });

    return process;
  }

  async collectResults(_runId: string): Promise<ExecutionContext> {
    // Local execution: extract browser/os from capability or use defaults
    const context: ExecutionContext = {
      provider: 'local',
      browser: this.capability?.browser || 'chromium',
      browserVersion: this.capability?.version,
      os: this.capability?.os,
      osVersion: this.capability?.osVersion,
      device: this.capability?.device,
      realMobile: this.capability?.realMobile,
    };
    return context;
  }

  getEnvironmentVariables(): NodeJS.ProcessEnv {
    // Local execution uses minimal env vars
    return {
      ...process.env,
    };
  }

  /**
   * Copy ErrorGrabber reporter to workspace runtime directory
   */
  private copyReporterToWorkspace(): void {
    try {
      const runtimeDir = path.join(this.workspacePath, 'runtime', 'reporters');
      fs.mkdirSync(runtimeDir, { recursive: true });
      
      const sourceReporterJs = getReporterPath();
      const sourceReporterTs = getReporterSourcePath();
      
      const destReporterJs = path.join(runtimeDir, 'ErrorGrabber.js');
      const destReporterTs = path.join(runtimeDir, 'ErrorGrabber.ts');
      
      if (fs.existsSync(sourceReporterJs)) {
        fs.copyFileSync(sourceReporterJs, destReporterJs);
        console.log(`[LocalPlaywrightProvider] Copied ErrorGrabber reporter (JS) to workspace`);
      } else if (fs.existsSync(sourceReporterTs)) {
        fs.copyFileSync(sourceReporterTs, destReporterTs);
        console.log(`[LocalPlaywrightProvider] Copied ErrorGrabber reporter (TS) to workspace`);
      } else {
        console.warn('[LocalPlaywrightProvider] ErrorGrabber reporter not found at expected paths');
      }
    } catch (error: any) {
      console.warn(`[LocalPlaywrightProvider] Failed to copy ErrorGrabber reporter: ${error.message}`);
    }
  }

  /**
   * Generate workspace-specific Playwright config
   */
  private generateWorkspaceConfig(): string {
    const storageStatePath = this.workspaceType === 'web-demo' 
      ? 'storage_state/web.json' 
      : this.workspaceType === 'salesforce'
      ? 'storage_state/d365.json' // Salesforce shares D365 storage state
      : 'storage_state/d365.json';
    
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
    trace: 'on',              // Always trace for FourHands Automation Suite runs
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
}

