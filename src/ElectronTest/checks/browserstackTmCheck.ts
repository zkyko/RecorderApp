import { ElectronTestResultWithoutDuration } from '../types';
import { ConfigManager } from '../../main/config-manager';

export async function browserstackTmCheck(): Promise<ElectronTestResultWithoutDuration> {
  const configManager = new ConfigManager();
  
  // BrowserStack TM now uses the same credentials as Automate
  const browserstackCreds = configManager.getBrowserStackCredentials();
  const tmConfig = configManager.getBrowserStackTmConfig();

  const projectId = tmConfig.projectId;

  if (!browserstackCreds.username || !browserstackCreds.accessKey) {
    return {
      id: 'browserstack-tm',
      label: 'BrowserStack Test Management',
      status: 'SKIP',
      details: 'BrowserStack credentials not configured. Set username and access key in Settings → BrowserStack (used by both Automate and Test Management).',
    };
  }

  if (!projectId) {
    return {
      id: 'browserstack-tm',
      label: 'BrowserStack Test Management',
      status: 'SKIP',
      details: 'BrowserStack TM project ID not configured. Set project ID in Settings → BrowserStack Test Management.',
    };
  }

  // For now we treat configuration presence as a basic PASS to avoid creating
  // noise entries in TM. A future enhancement can add a real ping call.
  return {
    id: 'browserstack-tm',
    label: 'BrowserStack Test Management',
    status: 'PASS',
    details: `✓ Using BrowserStack Automate credentials. ✓ Project ID ${projectId} configured.`,
  };
}

(browserstackTmCheck as any).id = 'browserstack-tm';
(browserstackTmCheck as any).label = 'BrowserStack Test Management';


