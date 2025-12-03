import { ElectronTestResultWithoutDuration } from '../types';
import { WorkspaceManager } from '../../main/services/workspace-manager';
import { WorkspaceMeta } from '../../types/v1.5';

export async function workspaceCheck(): Promise<ElectronTestResultWithoutDuration> {
  const manager = new WorkspaceManager();

  const workspaces = await manager.listWorkspaces();

  if (!workspaces.length) {
    return {
      id: 'workspace',
      label: 'Workspaces',
      status: 'FAIL',
      details: 'No workspaces found. Create at least one D365 workspace from Settings.',
    };
  }

  const currentId = manager.getCurrentWorkspaceId();
  if (!currentId) {
    return {
      id: 'workspace',
      label: 'Workspaces',
      status: 'FAIL',
      details: 'No active workspace selected. Choose a workspace in Settings.',
    };
  }

  const current = workspaces.find((w: WorkspaceMeta) => w.id === currentId);
  if (!current) {
    return {
      id: 'workspace',
      label: 'Workspaces',
      status: 'FAIL',
      details: `Current workspace id "${currentId}" not found. Try switching workspace in Settings.`,
    };
  }

  try {
    const migrated = await manager.ensureWorkspaceMigrated(current);
    return {
      id: 'workspace',
      label: 'Workspaces',
      status: 'PASS',
      details: `Active workspace "${migrated.name}" at ${migrated.workspacePath}`,
    };
  } catch (err: any) {
    return {
      id: 'workspace',
      label: 'Workspaces',
      status: 'FAIL',
      details: `Failed to load active workspace: ${err?.message || String(err)}`,
    };
  }
}

(workspaceCheck as any).id = 'workspace';
(workspaceCheck as any).label = 'Workspaces';


