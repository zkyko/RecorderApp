import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { ExecutionProvider } from './ExecutionProvider';
import { ExecutionContext } from '../../../types/execution-context';
import { WorkspaceMeta } from '../../../types/v1.5';
import { TestRunRequest } from '../../../types/v1.5';
import { ConfigManager } from '../../config-manager';
import { BrowserStackCapabilityMapper } from './BrowserStackCapabilityMapper';
import { BrowserCapability } from '../../../types/capabilities';
import { getReporterPath, getReporterSourcePath } from '../../utils/path-resolver';

interface BrowserStackSettings {
  username?: string;
  accessKey?: string;
  project?: string;
  buildPrefix?: string;
}

/**
 * Execution provider for BrowserStack Automate
 */
export class BrowserStackExecutionProvider implements ExecutionProvider {
  private workspacePath: string = '';
  private workspaceType?: string;
  private credentials: { username: string; accessKey: string } = { username: '', accessKey: '' };
  private project: string = '';
  private buildPrefix: string = '';
  private capability?: BrowserCapability;
  private buildName: string = '';
  private sessionName: string = '';
  private env: NodeJS.ProcessEnv = {};
  private metadata: {
    sessionId?: string;
    buildId?: string;
    dashboardUrl?: string;
  } = {};

  constructor(private configManager: ConfigManager) {}

  async prepare(workspace: WorkspaceMeta, request: TestRunRequest): Promise<void> {
    this.workspacePath = workspace.workspacePath;
    this.workspaceType = workspace.type;
    this.capability = request.capability;

    // Load BrowserStack settings from workspace
    const workspaceSettings = this.loadWorkspaceSettings();

    // Hardcode credentials for web workspaces (web-demo and generic)
    if (this.workspaceType === 'web-demo' || this.workspaceType === 'generic') {
      // Hardcoded service account credentials for web-only workspaces
      this.credentials = {
        username: 'qatest_ZJ012P',
        accessKey: 'EbNNuoEyqqYA4uxuziyg',
      };
    } else {
      // Resolve credentials for other workspace types (workspace -> global -> error)
      const globalCreds = this.configManager.getBrowserStackCredentials();
      this.credentials = {
        username: workspaceSettings.username || globalCreds.username || '',
        accessKey: workspaceSettings.accessKey || globalCreds.accessKey || '',
      };
    }

    if (!this.credentials.username || !this.credentials.accessKey) {
      throw new Error(
        'BrowserStack credentials not found. Please configure them in Settings or Workspace Settings.'
      );
    }

    // Load project and buildPrefix from workspace settings
    this.project = workspaceSettings.project || '';
    if (!this.project) {
      throw new Error(
        'BrowserStack project name not configured in workspace settings. Please set it in Workspace Settings → BrowserStack.'
      );
    }

    this.buildPrefix = workspaceSettings.buildPrefix || 'FourHands';

    // Default capability if not provided
    if (!this.capability) {
      this.capability = {
        browser: 'chrome',
        version: 'latest',
        os: 'windows',
        osVersion: '11',
      };
    }

    // Generate build name and session name (will be set in generateConfig when we have specRelPath)
    // For now, we'll generate them when we have the spec path
  }

  async generateConfig(): Promise<void> {
    // If build name is not set yet, it will be set in run() and config regenerated
    // This allows generateConfig() to be called before run() without errors
    if (!this.buildName) {
      // Use a placeholder that will be replaced when we have the spec path
      return;
    }

    // Copy ErrorGrabber reporter
    this.copyReporterToWorkspace();

    const configPath = path.join(this.workspacePath, 'playwright.browserstack.config.ts');
    const configContent = this.generateBrowserStackConfig();
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('[BrowserStackExecutionProvider] Created/updated playwright.browserstack.config.ts');
    console.log('[BrowserStackExecutionProvider] Project:', this.project);
    console.log('[BrowserStackExecutionProvider] Build:', this.buildName);
  }

  async run(specRelPath: string): Promise<ChildProcess> {
    // Generate build name and session name from spec path
    const specName = path.basename(specRelPath, '.spec.ts');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.buildName = `${this.buildPrefix} | ${specName}.spec.ts | ${timestamp}`;
    this.sessionName = specName;

    // Generate config now that we have the build name
    await this.generateConfig();

    // Set up environment variables
    this.env = this.getEnvironmentVariables();

    // Spawn BrowserStack process
    const command = 'npx';
    const args = [
      'browserstack-node-sdk',
      'playwright',
      'test',
      specRelPath,
      '--config=playwright.browserstack.config.ts',
    ];

    console.log('[BrowserStackExecutionProvider] Running on BrowserStack');
    console.log('[BrowserStackExecutionProvider] Project:', this.project);
    console.log('[BrowserStackExecutionProvider] Build:', this.buildName);

    const process = spawn(command, args, {
      cwd: this.workspacePath,
      shell: true,
      env: this.env,
    });

    // Set up output handlers to collect metadata
    this.setupOutputHandlers(process);

    return process;
  }

  async collectResults(_runId: string): Promise<ExecutionContext> {
    // Metadata is collected in setupOutputHandlers as output streams
    // Convert to ExecutionContext format
    const context: ExecutionContext = {
      provider: 'browserstack',
      browser: this.capability?.browser || 'chrome',
      browserVersion: this.capability?.version || 'latest',
      os: this.capability?.os || 'windows',
      osVersion: this.capability?.osVersion,
      device: this.capability?.device,
      realMobile: this.capability?.realMobile,
      sessionId: this.metadata.sessionId,
      buildId: this.metadata.buildId,
      sessionUrl: this.metadata.dashboardUrl,
      projectName: this.project,
      buildName: this.buildName,
    };
    return context;
  }

  getEnvironmentVariables(): NodeJS.ProcessEnv {
    // Determine storage state path based on workspace type
    const storageStateFileName = this.workspaceType === 'web-demo' 
      ? 'web.json' 
      : this.workspaceType === 'salesforce'
      ? 'd365.json' // Salesforce shares D365 storage state
      : 'd365.json';
    const storageStatePath = path.join(this.workspacePath, 'storage_state', storageStateFileName);

    return {
      ...process.env,
      BROWSERSTACK_USERNAME: this.credentials.username,
      BROWSERSTACK_ACCESS_KEY: this.credentials.accessKey,
      BROWSERSTACK_PROJECT: this.project,
      BROWSERSTACK_BUILD: this.buildName,
      QA_STUDIO_TEST_NAME: this.sessionName,
      BROWSERSTACK_LOCAL: 'true', // Enable Local Testing for storage state access
      STORAGE_STATE_PATH: storageStatePath,
    };
  }

  /**
   * Load BrowserStack settings from workspace-settings.json
   */
  private loadWorkspaceSettings(): BrowserStackSettings {
    const settingsPath = path.join(this.workspacePath, 'workspace-settings.json');
    if (!fs.existsSync(settingsPath)) {
      return {};
    }

    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return {
        username: settings.browserstack?.username,
        accessKey: settings.browserstack?.accessKey,
        project: settings.browserstack?.project,
        buildPrefix: settings.browserstack?.buildPrefix,
      };
    } catch (error) {
      console.warn('[BrowserStackExecutionProvider] Failed to load workspace settings:', error);
      return {};
    }
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
        console.log(`[BrowserStackExecutionProvider] Copied ErrorGrabber reporter (JS) to workspace`);
      } else if (fs.existsSync(sourceReporterTs)) {
        fs.copyFileSync(sourceReporterTs, destReporterTs);
        console.log(`[BrowserStackExecutionProvider] Copied ErrorGrabber reporter (TS) to workspace`);
      } else {
        console.warn('[BrowserStackExecutionProvider] ErrorGrabber reporter not found at expected paths');
      }
    } catch (error: any) {
      console.warn(`[BrowserStackExecutionProvider] Failed to copy ErrorGrabber reporter: ${error.message}`);
    }
  }

  /**
   * Set up output handlers to collect BrowserStack metadata
   */
  private setupOutputHandlers(process: ChildProcess): void {
    process.stdout?.on('data', (data) => {
      const output = data.toString();
      this.parseBrowserStackMetadata(output);
    });

    process.stderr?.on('data', (data) => {
      const output = data.toString();
      this.parseBrowserStackMetadata(output);
    });
  }

  /**
   * Parse BrowserStack session/build IDs from output
   */
  private parseBrowserStackMetadata(output: string): void {
    // Look for BrowserStack session URLs and IDs in output
    const sessionMatch = output.match(/browserstack\.com\/automate\/builds\/([^\/]+)\/sessions\/([^\s\)]+)/i);
    if (sessionMatch) {
      this.metadata.buildId = sessionMatch[1];
      this.metadata.sessionId = sessionMatch[2];
      this.metadata.dashboardUrl = `https://automate.browserstack.com/builds/${sessionMatch[1]}/sessions/${sessionMatch[2]}`;
    }
    
    // Alternative pattern: session ID in logs
    const sessionIdMatch = output.match(/session[_\s]id[:\s=]+([a-f0-9-]+)/i);
    if (sessionIdMatch && !this.metadata.sessionId) {
      this.metadata.sessionId = sessionIdMatch[1];
    }
  }

  /**
   * Generate BrowserStack Playwright config file content
   */
  private generateBrowserStackConfig(): string {
    // Convert capability to BrowserStack format
    const bsCaps = BrowserStackCapabilityMapper.toBrowserStackCaps(this.capability!);

    // Escape strings for use in template
    const browserName = bsCaps.browserName.replace(/'/g, "\\'");
    const browserVersion = bsCaps.browserVersion.replace(/'/g, "\\'");
    const os = bsCaps.os.replace(/'/g, "\\'");
    const osVersion = bsCaps.osVersion ? bsCaps.osVersion.replace(/'/g, "\\'") : '';
    const device = bsCaps.device ? bsCaps.device.replace(/'/g, "\\'") : '';
    const realMobile = bsCaps.realMobile !== undefined ? bsCaps.realMobile : null;

    // Build capabilities object for CDP endpoint
    // All values will come from env vars at runtime, except browser/OS which come from capability
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
    storageState: process.env.STORAGE_STATE_PATH || 'storage_state/d365.json',
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
 * Requires BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY, BROWSERSTACK_PROJECT,
 * BROWSERSTACK_BUILD, and QA_STUDIO_TEST_NAME environment variables
 */
function getBrowserStackEndpoint(): string {
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  const project = process.env.BROWSERSTACK_PROJECT;
  const build = process.env.BROWSERSTACK_BUILD;
  const testName = process.env.QA_STUDIO_TEST_NAME;

  if (!username || !accessKey) {
    throw new Error(
      'BrowserStack credentials not found. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.'
    );
  }

  if (!project || !build || !testName) {
    throw new Error(
      'BrowserStack configuration incomplete. Please ensure BROWSERSTACK_PROJECT, BROWSERSTACK_BUILD, and QA_STUDIO_TEST_NAME are set.'
    );
  }

  const enableLocalTesting = process.env.BROWSERSTACK_LOCAL === 'true';
  
  // Browser/OS capabilities from configured capability
  const browserName = '${browserName}';
  const browserVersion = '${browserVersion}';
  const os = '${os}';
  const osVersion = ${osVersion ? `'${osVersion}'` : 'undefined'};
  const device = ${device ? `'${device}'` : 'undefined'};
  const realMobile = ${realMobile !== null ? (realMobile ? 'true' : 'false') : 'undefined'};
  
  const caps: any = {
    browserName,
    browserVersion,
    os,
    name: testName,
    build,
    project,
    'browserstack.username': username,
    'browserstack.accessKey': accessKey,
    'browserstack.local': enableLocalTesting ? 'true' : 'false',
    'browserstack.networkLogs': 'true',
    'browserstack.console': 'info',
  };

  if (osVersion !== undefined) {
    caps.osVersion = osVersion;
  }

  if (device !== undefined) {
    caps.device = device;
  }

  if (realMobile !== undefined) {
    caps.realMobile = realMobile;
  }

  // Encode capabilities as base64
  const capsString = Buffer.from(JSON.stringify(caps)).toString('base64');
  
  return \`wss://cdp.browserstack.com/playwright?caps=\${encodeURIComponent(capsString)}\`;
}
`;
  }
}

