import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { WorkspaceMeta, WorkspaceType, CURRENT_WORKSPACE_VERSION } from '../../types/v1.5';

/**
 * Manages workspace metadata, creation, and migration
 */
export class WorkspaceManager {
  private workspaceRoot: string;

  constructor() {
    // Default workspace root: ~/Documents/QA-Studio
    this.workspaceRoot = path.join(app.getPath('documents'), 'QA-Studio');
  }

  /**
   * Returns the root directory where workspaces live
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Lists all workspaces by reading subfolders and workspace.json
   */
  async listWorkspaces(): Promise<WorkspaceMeta[]> {
    if (!fs.existsSync(this.workspaceRoot)) {
      return [];
    }

    const workspaces: WorkspaceMeta[] = [];
    const entries = fs.readdirSync(this.workspaceRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const workspacePath = path.join(this.workspaceRoot, entry.name);
        const meta = await this.loadWorkspace(workspacePath);
        if (meta) {
          workspaces.push(meta);
        }
      }
    }

    return workspaces.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Loads a single workspace meta by path
   */
  async loadWorkspace(workspacePath: string): Promise<WorkspaceMeta | null> {
    const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
    
    if (!fs.existsSync(workspaceJsonPath)) {
      // Check if this is an existing v1.5 workspace without workspace.json
      // Adopt it by creating workspace.json
      if (this.isLegacyWorkspace(workspacePath)) {
        return await this.adoptLegacyWorkspace(workspacePath);
      }
      return null;
    }

    try {
      const content = fs.readFileSync(workspaceJsonPath, 'utf-8');
      const meta = JSON.parse(content) as Omit<WorkspaceMeta, 'workspacePath'>;
      
      // Add workspacePath (not stored in JSON)
      return {
        ...meta,
        workspacePath,
      };
    } catch (error) {
      console.error('[WorkspaceManager] Failed to load workspace:', error);
      return null;
    }
  }

  /**
   * Creates a new workspace folder + workspace.json
   */
  async createWorkspace(opts: { name: string; type?: WorkspaceType }): Promise<WorkspaceMeta> {
    const defaultType: WorkspaceType = opts.type || 'd365';
    const id = this.generateWorkspaceId(defaultType);
    const workspacePath = path.join(this.workspaceRoot, id);

    // Create workspace directory
    fs.mkdirSync(workspacePath, { recursive: true });

    // Create workspace structure
    const dirs = ['tests', 'data', 'traces', 'runs', 'reports', 'tmp', 'allure-results', 'allure-report'];
    
    // Add workspace-type-specific directories
    if (defaultType === 'd365') {
      dirs.push('storage_state', 'runtime');
      // Create D365-specific structure: tests/d365/specs/
      const d365SpecsDir = path.join(workspacePath, 'tests', 'd365', 'specs');
      fs.mkdirSync(d365SpecsDir, { recursive: true });
    } else if (defaultType === 'web-demo') {
      // Web demo structure: tests/web-demo/
      const webDemoSpecsDir = path.join(workspacePath, 'tests', 'web-demo');
      fs.mkdirSync(webDemoSpecsDir, { recursive: true });
    }
    
    for (const dir of dirs) {
      fs.mkdirSync(path.join(workspacePath, dir), { recursive: true });
    }

    // Create workspace.json
    const now = new Date().toISOString();
    const appVersion = app.getVersion() || '1.5.0';
    
    // Set default settings based on workspace type
    const settings: Record<string, unknown> = {};
    if (defaultType === 'web-demo') {
      // Default URL for web-demo workspaces
      settings.baseUrl = 'https://fh-test-fourhandscom.azurewebsites.net/';
    } else if (defaultType === 'd365') {
      // D365 workspaces use d365Url from global config
      settings.baseUrl = undefined; // Will use global d365Url
    }
    
    const meta: Omit<WorkspaceMeta, 'workspacePath'> = {
      id,
      name: opts.name,
      type: defaultType,
      version: CURRENT_WORKSPACE_VERSION,
      createdWith: appVersion,
      lastOpenedWith: appVersion,
      createdAt: now,
      updatedAt: now,
      settings: Object.keys(settings).length > 0 ? settings : undefined,
    };

    await this.saveWorkspaceMeta({
      ...meta,
      workspacePath,
    });

    return {
      ...meta,
      workspacePath,
    };
  }

  /**
   * Updates and persists workspace meta
   */
  async saveWorkspaceMeta(meta: WorkspaceMeta): Promise<void> {
    const workspaceJsonPath = path.join(meta.workspacePath, 'workspace.json');
    
    // Don't store workspacePath in JSON
    const { workspacePath, ...metaToSave } = meta;
    
    fs.writeFileSync(
      workspaceJsonPath,
      JSON.stringify(metaToSave, null, 2),
      'utf-8'
    );
  }

  /**
   * Ensures migrations for a given workspace, returns updated meta
   */
  async ensureWorkspaceMigrated(meta: WorkspaceMeta): Promise<WorkspaceMeta> {
    if (meta.version === CURRENT_WORKSPACE_VERSION) {
      // Already up to date, just update lastOpenedWith
      const appVersion = app.getVersion() || '1.5.0';
      if (meta.lastOpenedWith !== appVersion) {
        const updated = {
          ...meta,
          lastOpenedWith: appVersion,
          updatedAt: new Date().toISOString(),
        };
        await this.saveWorkspaceMeta(updated);
        return updated;
      }
      return meta;
    }

    // Run migrations
    return await this.migrateWorkspace(meta);
  }

  /**
   * Migrates a workspace to the current version
   */
  private async migrateWorkspace(meta: WorkspaceMeta): Promise<WorkspaceMeta> {
    let updated = { ...meta };

    // Migration logic based on version
    switch (meta.version) {
      case '1.5.0':
        // No-op for now. Future: migrate15to16(updated);
        break;
      default:
        // For now, treat unknown versions as compatible. Maybe log a warning.
        console.warn(`[WorkspaceManager] Unknown workspace version: ${meta.version}, treating as compatible`);
        break;
    }

    // Update to current version
    const appVersion = app.getVersion() || '1.5.0';
    updated.version = CURRENT_WORKSPACE_VERSION;
    updated.lastOpenedWith = appVersion;
    updated.updatedAt = new Date().toISOString();

    await this.saveWorkspaceMeta(updated);
    return updated;
  }

  /**
   * Generates a stable workspace ID
   */
  private generateWorkspaceId(type: WorkspaceType): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${type}-${timestamp}-${random}`;
  }

  /**
   * Checks if a directory is a legacy v1.5 workspace (has tests/ or data/ but no workspace.json)
   */
  private isLegacyWorkspace(workspacePath: string): boolean {
    const hasTests = fs.existsSync(path.join(workspacePath, 'tests'));
    const hasData = fs.existsSync(path.join(workspacePath, 'data'));
    return hasTests || hasData;
  }

  /**
   * Adopts a legacy workspace by creating workspace.json
   */
  private async adoptLegacyWorkspace(workspacePath: string): Promise<WorkspaceMeta> {
    const folderName = path.basename(workspacePath);
    const id = folderName || this.generateWorkspaceId('d365');
    const now = new Date().toISOString();
    const appVersion = app.getVersion() || '1.5.0';

    const meta: WorkspaceMeta = {
      id,
      name: folderName || 'D365 Workspace',
      type: 'd365',
      version: CURRENT_WORKSPACE_VERSION,
      createdWith: '1.5.0', // Assume it was created with v1.5
      lastOpenedWith: appVersion,
      createdAt: now,
      updatedAt: now,
      workspacePath,
    };

    await this.saveWorkspaceMeta(meta);
    return meta;
  }

  /**
   * Gets the current workspace ID from global settings
   */
  getCurrentWorkspaceId(): string | null {
    const settingsPath = path.join(this.workspaceRoot, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return settings.currentWorkspaceId || null;
    } catch (error) {
      console.error('[WorkspaceManager] Failed to read settings:', error);
      return null;
    }
  }

  /**
   * Sets the current workspace ID in global settings
   */
  async setCurrentWorkspaceId(workspaceId: string): Promise<void> {
    const settingsPath = path.join(this.workspaceRoot, 'settings.json');
    
    let settings: any = {};
    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {
        console.warn('[WorkspaceManager] Failed to parse settings, creating new');
      }
    }

    settings.currentWorkspaceId = workspaceId;
    settings.updatedAt = new Date().toISOString();

    fs.writeFileSync(
      settingsPath,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );
  }
}

