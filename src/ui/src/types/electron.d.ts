// Re-export from shared location so old imports keep working
export type { ElectronAPI } from '../../../types/electron-api';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
