import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import Sidebar from './Sidebar';
import TopToolbar from './TopToolbar';
import HintPanel from './HintPanel';
import { useThemeStore } from '../store/theme-store';
import './AppLayout.css';

// Mantine themes for both modes
const darkTheme = createTheme({
  colorScheme: 'dark',
  primaryColor: 'blue',
  colors: {
    dark: [
      '#e2e8f0', // 0 - text
      '#cbd5e1', // 1 - secondary text
      '#94a3b8', // 2 - muted
      '#64748b', // 3 - borders
      '#475569', // 4 - hover
      '#334155', // 5 - cards
      '#252b3d', // 6 - main bg
      '#1a1f2e', // 7 - sidebar bg
      '#0f1419', // 8 - darkest
      '#0a0f14', // 9 - extra
    ],
  },
});

const lightTheme = createTheme({
  colorScheme: 'light',
  primaryColor: 'blue',
  colors: {
    gray: [
      '#f8fafc', // 0 - lightest
      '#f1f5f9', // 1
      '#e2e8f0', // 2
      '#cbd5e1', // 3
      '#94a3b8', // 4
      '#64748b', // 5
      '#475569', // 6
      '#334155', // 7
      '#1e293b', // 8
      '#0f172a', // 9 - darkest
    ],
  },
});

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'qa-studio-dark';

  // Apply theme to HTML element on mount and theme change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <MantineProvider theme={isDark ? darkTheme : lightTheme} defaultColorScheme={isDark ? 'dark' : 'light'}>
      <div className="app-layout" data-theme={theme}>
        <Sidebar />
        <div className="app-main">
          <TopToolbar />
          <div className="app-content">
            <HintPanel />
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </MantineProvider>
  );
};

export default AppLayout;

