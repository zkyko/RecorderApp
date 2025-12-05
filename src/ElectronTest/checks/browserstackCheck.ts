import { ElectronTestResultWithoutDuration } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
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

    // Check if npx is available (required for BrowserStack execution)
    try {
      const npxCheck = spawn('npx', ['--version'], { shell: true, stdio: 'pipe' });
      const npxAvailable = await new Promise<boolean>((resolve) => {
        npxCheck.on('error', () => resolve(false));
        npxCheck.on('close', (code) => resolve(code === 0));
        setTimeout(() => {
          npxCheck.kill();
          resolve(false);
        }, 3000);
      });

      if (!npxAvailable) {
        return {
          id: 'browserstack',
          label: 'BrowserStack Automate',
          status: 'FAIL',
          details: '❌ npx not available. BrowserStack execution requires Node.js/npm to be installed. Install Node.js from https://nodejs.org/',
        };
      }

      // Check if browserstack-node-sdk is available
      const sdkCheck = spawn('npx', ['browserstack-node-sdk', '--version'], { shell: true, stdio: 'pipe' });
      const sdkAvailable = await new Promise<boolean>((resolve) => {
        sdkCheck.on('error', () => resolve(false));
        sdkCheck.on('close', (code) => resolve(code === 0));
        setTimeout(() => {
          sdkCheck.kill();
          resolve(false);
        }, 5000);
      });

      if (!sdkAvailable) {
        return {
          id: 'browserstack',
          label: 'BrowserStack Automate',
          status: 'FAIL',
          details: '❌ browserstack-node-sdk not found. Install it by running: npm install -g browserstack-node-sdk',
        };
      }

      return {
        id: 'browserstack',
        label: 'BrowserStack Automate',
        status: 'PASS',
        details: `✓ Credentials configured for workspace "${current.name}". ✓ npx available. ✓ browserstack-node-sdk installed. Ready for BrowserStack execution.`,
      };
    } catch (err: any) {
      return {
        id: 'browserstack',
        label: 'BrowserStack Automate',
        status: 'FAIL',
        details: `Failed to check BrowserStack prerequisites: ${err?.message || String(err)}`,
      };
    }
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


