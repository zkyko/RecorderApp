'use client';

/**
 * Demo wrapper for QA Studio UI
 * Sets up backend getter and renders the Electron app's UI components
 * 
 * Note: App.tsx already provides HashRouter, so we don't wrap with another router here
 */

import React, { useEffect, useState } from 'react';
import { setBackendGetter } from '../../../src/ui/src/ipc-backend';
import { mockElectronAPI } from '@/lib/mock-backend/mock-electron-api';
import { DesktopOnlyModal } from '@/components/demo/DesktopOnlyModal';
import { DemoTour } from '@/components/demo/DemoTour';
import { isDesktopOnlyError } from '@/lib/mock-backend/errors';
import App from '../../../src/ui/src/App';

// IMPORTANT: Set the backend getter at module scope (before App renders)
// This ensures getBackend() returns mockElectronAPI immediately when App mounts
setBackendGetter(() => mockElectronAPI);

/**
 * Demo App component
 * App.tsx already provides HashRouter, so we just render it directly
 */
export default function DemoApp() {
  const [showDesktopOnlyModal, setShowDesktopOnlyModal] = useState(false);
  const [desktopOnlyMessage, setDesktopOnlyMessage] = useState<string>('');
  const [showTour, setShowTour] = useState(false);

  // Show tour on first visit (check localStorage) or when triggered
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('qa-studio-demo-tour-seen');
    if (!hasSeenTour) {
      // Small delay to let the app load
      setTimeout(() => {
        setShowTour(true);
        localStorage.setItem('qa-studio-demo-tour-seen', 'true');
      }, 2000);
    }

    // Listen for manual tour trigger
    const handleStartTour = () => {
      setShowTour(true);
    };
    window.addEventListener('start-demo-tour', handleStartTour);

    return () => {
      window.removeEventListener('start-demo-tour', handleStartTour);
    };
  }, []);

  // Global error handler for DesktopOnlyError
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      if (isDesktopOnlyError(error)) {
        event.preventDefault();
        setDesktopOnlyMessage(error.message);
        setShowDesktopOnlyModal(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (isDesktopOnlyError(error)) {
        event.preventDefault();
        setDesktopOnlyMessage(error.message);
        setShowDesktopOnlyModal(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      <App />
      <DesktopOnlyModal
        opened={showDesktopOnlyModal}
        onClose={() => setShowDesktopOnlyModal(false)}
        message={desktopOnlyMessage}
      />
      <DemoTour
        opened={showTour}
        onClose={() => setShowTour(false)}
        autoPlay={false}
      />
    </>
  );
}

