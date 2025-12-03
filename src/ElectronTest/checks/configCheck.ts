import { ElectronTestResultWithoutDuration } from '../types';
import { ConfigManager } from '../../main/config-manager';
import * as fs from 'fs';
import * as path from 'path';

export async function configCheck(): Promise<ElectronTestResultWithoutDuration> {
  const configManager = new ConfigManager();
  const cfg = configManager.getConfig() as any;

  const workspacePath: string | undefined = cfg.workspacePath;
  const recordingsDir: string | undefined = cfg.recordingsDir;

  // Prefer workspacePath when present, fall back to recordingsDir (older configs)
  const basePath = workspacePath || recordingsDir;

  if (!basePath) {
    return {
      id: 'config',
      label: 'Core Configuration',
      status: 'FAIL',
      details: 'No workspace or recordings directory configured. Complete initial setup in Settings.',
    };
  }

  const resolved = path.resolve(basePath);

  if (!fs.existsSync(resolved)) {
    return {
      id: 'config',
      label: 'Core Configuration',
      status: 'FAIL',
      details: `Configured path does not exist: ${resolved}`,
    };
  }

  try {
    // Basic writeability check: attempt to access directory for write
    fs.accessSync(resolved, fs.constants.W_OK);
  } catch {
    return {
      id: 'config',
      label: 'Core Configuration',
      status: 'FAIL',
      details: `QA Studio cannot write to configured path: ${resolved}`,
    };
  }

  return {
    id: 'config',
    label: 'Core Configuration',
    status: 'PASS',
    details: `Configuration OK. Base workspace directory: ${resolved}`,
  };
}

(configCheck as any).id = 'config';
(configCheck as any).label = 'Core Configuration';


