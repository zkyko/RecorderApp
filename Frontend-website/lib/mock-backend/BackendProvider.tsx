'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { ElectronAPI } from '../../../src/types/electron-api';

interface BackendContextType {
  backend: ElectronAPI;
}

const BackendContext = createContext<BackendContextType | null>(null);

interface BackendProviderProps {
  backend: ElectronAPI;
  children: ReactNode;
}

export function BackendProvider({ backend, children }: BackendProviderProps) {
  return (
    <BackendContext.Provider value={{ backend }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend(): ElectronAPI {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within BackendProvider');
  }
  return context.backend;
}

