import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';
import { ConfigManager } from './config-manager';

export interface TestExecutionOptions {
  specFile: string;
  onOutput?: (data: string) => void;
  onError?: (data: string) => void;
  onClose?: (code: number | null) => void;
  useBrowserStack?: boolean;
}

/**
 * Executes Playwright tests in a child process
 */
export class TestExecutor {
  private configManager: ConfigManager;
  private currentProcess: ChildProcess | null = null;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Sync test files from workspace to project directory (v1.5 - simplified, no POMs)
   * This ensures tests can run from the project root where Playwright config exists
   */
  private async syncTestFiles(specFile: string): Promise<string> {
    const workspacePath = this.configManager.getOrInitWorkspacePath();
    const projectRoot = this.findProjectRoot();
    const projectTestsDir = path.join(projectRoot, 'tests');
    
    // Ensure project test directory exists
    fs.mkdirSync(projectTestsDir, { recursive: true });
    
    // Resolve source spec path
    const sourceSpecPath = path.isAbsolute(specFile)
      ? specFile
      : path.join(workspacePath, 'tests', specFile);
    
    if (!fs.existsSync(sourceSpecPath)) {
      throw new Error(`Test spec file not found: ${sourceSpecPath}`);
    }
    
    // Calculate relative path from workspace/tests to preserve structure
    const workspaceTestsDir = path.join(workspacePath, 'tests');
    const relativeSpecPath = path.relative(workspaceTestsDir, sourceSpecPath);
    const destSpecPath = path.join(projectTestsDir, relativeSpecPath);
    
    // Copy spec file
    fs.mkdirSync(path.dirname(destSpecPath), { recursive: true });
    fs.copyFileSync(sourceSpecPath, destSpecPath);
    
    // Read spec to find data file dependency
    const specContent = fs.readFileSync(sourceSpecPath, 'utf-8');
    
    // Copy data file if referenced (flat structure: ../data/<TestName>.json)
    const dataImportMatch = specContent.match(/import\s+data\s+from\s+['"](.+?)['"]/);
    if (dataImportMatch) {
      const dataRelativePath = dataImportMatch[1];
      const specDir = path.dirname(sourceSpecPath);
      const sourceDataPath = path.resolve(specDir, dataRelativePath);
      
      if (fs.existsSync(sourceDataPath)) {
        // Copy to project data directory
        const projectDataDir = path.join(projectRoot, 'data');
        fs.mkdirSync(projectDataDir, { recursive: true });
        const dataFileName = path.basename(sourceDataPath);
        const destDataPath = path.join(projectDataDir, dataFileName);
        fs.copyFileSync(sourceDataPath, destDataPath);
      }
    }
    
    // Copy storage state file to project storage_state directory
    const config = this.configManager.getConfig();
    const storageStatePath = config.storageStatePath;
    
    if (storageStatePath && fs.existsSync(storageStatePath)) {
      const projectStorageStateDir = path.join(projectRoot, 'storage_state');
      fs.mkdirSync(projectStorageStateDir, { recursive: true });
      const destStorageState = path.join(projectStorageStateDir, 'd365.json');
      fs.copyFileSync(storageStatePath, destStorageState);
    }
    
    // Return relative path from project testDir for Playwright
    return path.relative(projectTestsDir, destSpecPath);
  }

  /**
   * Run test locally
   */
  async runLocal(options: TestExecutionOptions): Promise<void> {
    const { specFile, onOutput, onError, onClose } = options;
    
    // Sync files to project directory first
    const relativeSpecPath = await this.syncTestFiles(specFile);
    
    // Get project root (where package.json is)
    const projectRoot = this.findProjectRoot();
    
    // Spawn playwright test command
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      'playwright',
      'test',
      relativeSpecPath, // Use relative path from project testDir
      '--config=playwright.config.ts',
    ];

    this.spawnProcess(command, args, projectRoot, onOutput, onError, onClose);
  }

  /**
   * Run test on BrowserStack
   */
  async runBrowserStack(options: TestExecutionOptions): Promise<void> {
    const { specFile, onOutput, onError, onClose } = options;
    
    // Get BrowserStack credentials
    const credentials = this.configManager.getBrowserStackCredentials();
    if (!credentials.username || !credentials.accessKey) {
      throw new Error('BrowserStack credentials not configured. Please set them in settings.');
    }

    // Sync files to project directory first
    const relativeSpecPath = await this.syncTestFiles(specFile);
    
    // Get project root
    const projectRoot = this.findProjectRoot();
    
    // Spawn playwright test command wrapped with BrowserStack Node SDK for observability
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      'browserstack-node-sdk',
      'playwright',
      'test',
      relativeSpecPath, // Use relative path from project testDir
      '--config=playwright.browserstack.config.ts',
    ];

    // Get storage state path from config
    const config = this.configManager.getConfig();
    const storageStatePath = config.storageStatePath || 'storage_state/d365.json';
    
    // Set environment variables
    const env = {
      ...process.env,
      BROWSERSTACK_USERNAME: credentials.username,
      BROWSERSTACK_ACCESS_KEY: credentials.accessKey,
      STORAGE_STATE_PATH: storageStatePath,
      // Enable BrowserStack Local Testing to access local files
      BROWSERSTACK_LOCAL: 'true',
    };

    this.spawnProcess(command, args, projectRoot, onOutput, onError, onClose, env);
  }

  /**
   * Spawn a child process and handle output
   */
  private spawnProcess(
    command: string,
    args: string[],
    cwd: string,
    onOutput?: (data: string) => void,
    onError?: (data: string) => void,
    onClose?: (code: number | null) => void,
    env?: NodeJS.ProcessEnv
  ): void {
    // Kill existing process if any
    if (this.currentProcess) {
      this.currentProcess.kill();
    }

    this.currentProcess = spawn(command, args, {
      cwd,
      env: env || process.env,
      shell: process.platform === 'win32',
    });

    // Handle stdout
    this.currentProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (onOutput) {
        onOutput(output);
      }
    });

    // Handle stderr
    this.currentProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      if (onError) {
        onError(error);
      }
    });

    // Handle process close
    this.currentProcess.on('close', (code) => {
      this.currentProcess = null;
      if (onClose) {
        onClose(code);
      }
    });

    // Handle process error
    this.currentProcess.on('error', (error) => {
      if (onError) {
        onError(`Process error: ${error.message}`);
      }
      this.currentProcess = null;
    });
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
   * Find project root (directory containing package.json)
   */
  private findProjectRoot(): string {
    let currentDir = __dirname;
    
    // Go up from dist/main to project root
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to current working directory
    return process.cwd();
  }
}

