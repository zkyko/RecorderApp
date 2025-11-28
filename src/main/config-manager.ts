import Store from 'electron-store';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface ConfigSchema {
  recordingsDir: string;
  workspacePath?: string; // v1.5: workspace root (replaces recordingsDir)
  d365Url: string;
  storageStatePath: string;
  isSetupComplete: boolean;
  browserstackUsername?: string;
  browserstackAccessKey?: string;
  aiProvider?: 'openai' | 'deepseek' | 'custom';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
}

/**
 * Manages persistent application configuration using electron-store
 * Using type assertion to work around TypeScript type issues with electron-store v11
 */
export class ConfigManager {
  private store: Store<ConfigSchema>;
  // Type assertion to access get/set methods
  private storeAccess: {
    get: <K extends keyof ConfigSchema>(key: K) => ConfigSchema[K];
    set: <K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]) => void;
  };

  constructor() {
    this.store = new Store<ConfigSchema>({
      name: 'qa-studio-config',
      defaults: {
        recordingsDir: '',
        d365Url: '',
        storageStatePath: '',
        isSetupComplete: false,
        browserstackUsername: '',
        browserstackAccessKey: '',
      },
    });
    // Type assertion to access get/set methods
    this.storeAccess = this.store as any;
  }

  /**
   * Get or initialize workspace directory (v1.5)
   */
  getOrInitWorkspacePath(): string {
    let workspace = this.storeAccess.get('workspacePath');
    
    if (!workspace || !fs.existsSync(workspace)) {
      // Fallback to recordingsDir for migration
      workspace = this.storeAccess.get('recordingsDir');
      
      if (!workspace || !fs.existsSync(workspace)) {
        // Default to Documents/QA-Studio
        const defaultDir = path.join(
          app.getPath('documents'),
          'QA-Studio'
        );
        fs.mkdirSync(defaultDir, { recursive: true });
        workspace = defaultDir;
      }
      
      this.storeAccess.set('workspacePath', workspace);
    }
    
    // Ensure workspace structure exists
    this.ensureWorkspaceStructure(workspace);
    
    return workspace;
  }

  /**
   * Get or initialize recordings directory (legacy, for migration)
   */
  getOrInitRecordingsDir(): string {
    // For v1.5, return workspace path
    return this.getOrInitWorkspacePath();
  }

  /**
   * Ensure workspace structure exists (/tests, /data, /traces, /reports, /storage_state, /tmp)
   */
  private ensureWorkspaceStructure(workspacePath: string): void {
    const dirs = [
      'tests',
      'data',
      'traces',
      'reports',
      'storage_state',
      'tmp',
    ];

    for (const dir of dirs) {
      const dirPath = path.join(workspacePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create workspace.json if it doesn't exist
    const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
    if (!fs.existsSync(workspaceJsonPath)) {
      const workspaceConfig = {
        name: path.basename(workspacePath),
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      fs.writeFileSync(workspaceJsonPath, JSON.stringify(workspaceConfig, null, 2), 'utf-8');
    }
  }

  /**
   * Set workspace path
   */
  setWorkspacePath(workspacePath: string): void {
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }
    this.storeAccess.set('workspacePath', workspacePath);
    this.ensureWorkspaceStructure(workspacePath);
  }

  /**
   * Get all configuration
   */
  getConfig(): {
    recordingsDir: string; // Legacy, returns workspacePath
    workspacePath: string; // v1.5
    d365Url: string | undefined;
    storageStatePath: string | undefined;
    isSetupComplete: boolean;
  } {
    const workspacePath = this.getOrInitWorkspacePath();
    return {
      recordingsDir: workspacePath, // Legacy compatibility
      workspacePath,
      d365Url: this.storeAccess.get('d365Url') || undefined,
      storageStatePath: this.storeAccess.get('storageStatePath') || undefined,
      isSetupComplete: this.storeAccess.get('isSetupComplete') || false,
    };
  }

  /**
   * Set recordings directory
   */
  setRecordingsDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.storeAccess.set('recordingsDir', dir);
  }

  /**
   * Set D365 URL
   */
  setD365Url(url: string): void {
    this.storeAccess.set('d365Url', url);
  }

  /**
   * Set storage state path
   */
  setStorageStatePath(storagePath: string): void {
    this.storeAccess.set('storageStatePath', storagePath);
  }

  /**
   * Mark setup as complete
   */
  setSetupComplete(complete: boolean = true): void {
    this.storeAccess.set('isSetupComplete', complete);
  }

  /**
   * Get storage state directory (in userData)
   */
  getStorageStateDir(): string {
    const userData = app.getPath('userData');
    const storageDir = path.join(userData, 'storage_state');
    fs.mkdirSync(storageDir, { recursive: true });
    return storageDir;
  }

  /**
   * Get storage state file path
   */
  getStorageStatePath(): string {
    const storageDir = this.getStorageStateDir();
    return path.join(storageDir, 'd365.json');
  }

  /**
   * Get BrowserStack credentials
   */
  getBrowserStackCredentials(): { username: string | undefined; accessKey: string | undefined } {
    return {
      username: this.storeAccess.get('browserstackUsername') || undefined,
      accessKey: this.storeAccess.get('browserstackAccessKey') || undefined,
    };
  }

  /**
   * Set BrowserStack credentials
   */
  setBrowserStackCredentials(username: string, accessKey: string): void {
    this.storeAccess.set('browserstackUsername', username);
    this.storeAccess.set('browserstackAccessKey', accessKey);
  }

  /**
   * Get AI configuration
   */
  getAIConfig(): {
    provider: 'openai' | 'deepseek' | 'custom' | undefined;
    apiKey: string | undefined;
    model: string | undefined;
    baseUrl: string | undefined;
  } {
    return {
      provider: this.storeAccess.get('aiProvider') || undefined,
      apiKey: this.storeAccess.get('aiApiKey') || undefined,
      model: this.storeAccess.get('aiModel') || undefined,
      baseUrl: this.storeAccess.get('aiBaseUrl') || undefined,
    };
  }

  /**
   * Set AI configuration
   */
  setAIConfig(config: {
    provider?: 'openai' | 'deepseek' | 'custom';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }): void {
    if (config.provider !== undefined) {
      this.storeAccess.set('aiProvider', config.provider);
    }
    if (config.apiKey !== undefined) {
      this.storeAccess.set('aiApiKey', config.apiKey);
    }
    if (config.model !== undefined) {
      this.storeAccess.set('aiModel', config.model);
    }
    if (config.baseUrl !== undefined) {
      this.storeAccess.set('aiBaseUrl', config.baseUrl);
    }
  }
}
