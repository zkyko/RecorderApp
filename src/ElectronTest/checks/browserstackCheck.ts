import { ElectronTestResultWithoutDuration } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from '../../main/services/workspace-manager';
import { WorkspaceMeta } from '../../types/v1.5';

export async function browserstackCheck(): Promise<ElectronTestResultWithoutDuration> {
  const manager = new WorkspaceManager();
  const currentId = manager.getCurrentWorkspaceId();
  const workspaces = await manager.listWorkspaces();
  const current = currentId ? workspaces.find((w: WorkspaceMeta) => w.id === currentId) : null;

  if (!current) {
    return {
      id: 'browserstack',
      label: 'BrowserStack Automate',
      status: 'SKIP',
      details: 'No active workspace; BrowserStack configuration is workspace-specific.',
    };
  }

  const settingsPath = path.join(current.workspacePath, 'workspace-settings.json');
  if (!fs.existsSync(settingsPath)) {
    return {
      id: 'browserstack',
      label: 'BrowserStack Automate',
      status: 'SKIP',
      details: 'BrowserStack not configured. Save credentials in Settings → BrowserStack.',
    };
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const json = JSON.parse(raw);
    const username = json.browserstack?.username || '';
    const accessKey = json.browserstack?.accessKey || '';

    if (!username || !accessKey) {
      return {
        id: 'browserstack',
        label: 'BrowserStack Automate',
        status: 'SKIP',
        details: 'BrowserStack username/access key missing. Configure them in Settings → BrowserStack.',
      };
    }

    return {
      id: 'browserstack',
      label: 'BrowserStack Automate',
      status: 'PASS',
      details: `Credentials present for workspace "${current.name}".`,
    };
  } catch (err: any) {
    return {
      id: 'browserstack',
      label: 'BrowserStack Automate',
      status: 'FAIL',
      details: `Failed to read BrowserStack settings: ${err?.message || String(err)}`,
    };
  }
}

(browserstackCheck as any).id = 'browserstack';
(browserstackCheck as any).label = 'BrowserStack Automate';


