import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import Sidebar from './Sidebar';
import TopToolbar from './TopToolbar';
import HintPanel from './HintPanel';
import './AppLayout.css';

const darkTheme = createTheme({
  colorScheme: 'dark',
  primaryColor: 'blue',
  colors: {
    dark: [
      '#f3f4f6', // 0 - text
      '#9ca3af', // 1 - secondary text
      '#6b7280', // 2 - muted
      '#4b5563', // 3 - borders
      '#374151', // 4 - hover
      '#1f2937', // 5 - cards
      '#111827', // 6 - main bg
      '#0b1020', // 7 - sidebar bg
      '#030712', // 8 - darkest
    ],
  },
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  // Check if we're in demo mode (MantineProvider already provided by layout)
  const isDemoMode = typeof window !== 'undefined' && !window.electronAPI;

  // In demo mode, don't wrap in MantineProvider again (it's in the layout)
  // In Electron mode, provide MantineProvider
  const content = (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopToolbar />
        <div className="app-content">
          <HintPanel />
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );

  if (isDemoMode) {
    // Demo mode: MantineProvider is in the Next.js layout
    return (
      <>
        <Notifications position="top-right" zIndex={1000} />
        {content}
      </>
    );
  }

  // Electron mode: provide MantineProvider here
  return (
    <MantineProvider theme={darkTheme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={1000} />
      {content}
    </MantineProvider>
  );
};

export default AppLayout;

