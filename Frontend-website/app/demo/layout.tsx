'use client';

import React, { useState, useEffect } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { BackendProvider } from '@/lib/mock-backend/BackendProvider';
import { mockElectronAPI } from '@/lib/mock-backend/mock-electron-api';
import { DemoBanner } from '@/components/demo/DemoBanner';

const darkTheme = createTheme({
  primaryColor: 'blue',
  colors: {
    dark: [
      '#f3f4f6', // 0 - text
      '#9ca3af', // 1 - secondary text
      '#6b7280', // 2 - muted
      '#4b5563', // 3 - borders
      '#1f2937', // 4 - hover
      '#111827', // 5 - cards
      '#0b1020', // 6 - main bg
      '#030712', // 7 - sidebar bg
      '#000000', // 8 - darkest
      '#000000', // 9 - extra (required by Mantine)
    ],
  },
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

/**
 * Demo layout - provides backend context and MantineProvider
 * MantineProvider must be here because DemoBanner uses Mantine components
 */
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Auto-dismiss banner after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setBannerDismissed(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <MantineProvider theme={darkTheme} defaultColorScheme="dark">
      <BackendProvider backend={mockElectronAPI}>
        {/* Notifications is provided by AppLayout to ensure it's in the HashRouter tree */}
        {!bannerDismissed && (
          <DemoBanner onDismiss={() => setBannerDismissed(true)} />
        )}
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          overflow: 'hidden',
          paddingTop: bannerDismissed ? 0 : '60px' // Adjust for banner height
        }}>
          {children}
        </div>
      </BackendProvider>
    </MantineProvider>
  );
}

