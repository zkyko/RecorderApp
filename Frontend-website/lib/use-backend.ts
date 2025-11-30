/**
 * Backend hook for accessing ElectronAPI
 * In desktop app: uses window.electronAPI
 * In web demo: uses mock backend from context
 */

'use client';

import { useBackend as useBackendContext } from './mock-backend/BackendProvider';
import type { ElectronAPI } from '../../src/types/electron-api';

/**
 * Hook to get the backend API
 * In demo mode, expects BackendProvider to be set up
 * In desktop mode, falls back to window.electronAPI
 */
export function useBackend(): ElectronAPI {
  // Try to use context first (for web demo)
  try {
    return useBackendContext();
  } catch {
    // Context not available - we're in desktop app or outside provider
    // Use window.electronAPI if available
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI;
    }
    // Fallback: throw error to indicate backend not available
    throw new Error('Backend not available. Ensure BackendProvider is set up or window.electronAPI is available.');
  }
}

