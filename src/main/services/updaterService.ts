import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';

/**
 * Auto-updater service for QA Studio
 * Handles checking for updates and notifying the UI
 */
export class UpdaterService {
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  /**
   * Set up auto-updater event handlers
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Let user decide when to download
    autoUpdater.autoInstallOnAppQuit = true; // Install on quit after download

    // Check for updates on startup (with delay to not block app launch)
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000); // Wait 5 seconds after app launch

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for updates...');
      this.sendToRenderer('update-checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] Update available:', info.version);

      // Estimate total update size (sum of all file sizes if available)
      let totalSize = 0;
      const anyInfo: any = info as any;
      if (Array.isArray(anyInfo.files)) {
        totalSize = anyInfo.files.reduce((sum: number, file: any) => {
          const size = typeof file?.size === 'number' ? file.size : 0;
          return sum + size;
        }, 0);
      }

      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
        // Size in bytes (may be 0/undefined if not provided by electron-updater)
        sizeBytes: totalSize || undefined,
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] Update not available. Current version:', info.version);
      this.sendToRenderer('update-not-available', {
        version: info.version,
      });
    });

    autoUpdater.on('error', (error) => {
      console.error('[Updater] Error:', error);
      this.sendToRenderer('update-error', {
        message: error.message,
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log('[Updater] Download progress:', Math.round(progress.percent), '%');
      this.sendToRenderer('update-download-progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] Update downloaded:', info.version);
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });
  }

  /**
   * Check for updates
   */
  checkForUpdates(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Updater] Skipping update check in development mode');
      return;
    }

    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('[Updater] Failed to check for updates:', error);
    }
  }

  /**
   * Download the available update
   */
  downloadUpdate(): void {
    try {
      autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[Updater] Failed to download update:', error);
      this.sendToRenderer('update-error', {
        message: error instanceof Error ? error.message : 'Failed to download update',
      });
    }
  }

  /**
   * Install the downloaded update and restart
   */
  quitAndInstall(): void {
    try {
      autoUpdater.quitAndInstall(false, true); // isSilent, isForceRunAfter
    } catch (error) {
      console.error('[Updater] Failed to install update:', error);
    }
  }

  /**
   * Send message to renderer process
   */
  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Register IPC handlers for updater control from UI
   */
  registerHandlers(): void {
    ipcMain.handle('updater:check', () => {
      this.checkForUpdates();
    });

    ipcMain.handle('updater:download', () => {
      this.downloadUpdate();
    });

    ipcMain.handle('updater:install', () => {
      this.quitAndInstall();
    });
  }
}

