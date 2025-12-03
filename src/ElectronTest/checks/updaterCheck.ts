import { ElectronTestResultWithoutDuration } from '../types';
import { UpdaterService } from '../../main/services/updaterService';

export async function updaterCheck(): Promise<ElectronTestResultWithoutDuration> {
  try {
    // We don't need a BrowserWindow for this smoke test – pass null.
    const updater = new UpdaterService(null);
    // This will be a no-op in development and a real check in production.
    updater.checkForUpdates();

    return {
      id: 'updater',
      label: 'Auto-updater',
      status: 'PASS',
      details: 'Updater service initialized and checkForUpdates() invoked without throwing.',
    };
  } catch (err: any) {
    return {
      id: 'updater',
      label: 'Auto-updater',
      status: 'FAIL',
      details: err?.message || String(err),
    };
  }
}

(updaterCheck as any).id = 'updater';
(updaterCheck as any).label = 'Auto-updater';


