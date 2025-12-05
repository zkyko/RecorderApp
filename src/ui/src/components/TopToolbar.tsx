import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  Filter, 
  CircleDot, 
  Square, 
  Save, 
  RefreshCw,
  FileText,
  Download,
  Home
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import './TopToolbar.css';

// Check if we're in demo mode (web environment)
const isDemoMode = typeof window !== 'undefined' && !window.electronAPI;

// Helper to get base path for GitHub Pages
function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  // If hosted on GitHub Pages or pathname starts with /RecorderApp
  if (hostname.includes('github.io') || pathname.startsWith('/RecorderApp')) {
    return '/RecorderApp';
  }
  return '';
}

const TopToolbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getBasePath();

  const getToolbarContent = () => {
    const path = location.pathname;

    // Dashboard
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'Dashboard',
        left: null,
        right: (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/record')}
          >
            <Plus size={16} />
            New Test
          </button>
        ),
      };
    }

    // Test Library
    if (path === '/library') {
      return {
        title: 'Test Library',
        left: null,
        right: (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">
              <Filter size={16} />
              Filter
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/record')}
            >
              <Plus size={16} />
              New Test
            </button>
          </div>
        ),
      };
    }

    // Record - show status instead of buttons (buttons are in main panel)
    if (path.startsWith('/record')) {
      return {
        title: 'Record',
        left: null,
        right: null, // Status will be shown in the main panel, not toolbar
      };
    }

    // Runs
    if (path.startsWith('/runs')) {
      return {
        title: 'Test Runs',
        left: null,
        right: (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm">
              <Play size={16} />
              Run Tests
            </button>
          </div>
        ),
      };
    }

    // Data Editor
    if (path.includes('/data')) {
      return {
        title: 'Data Editor',
        left: null,
        right: (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">
              <Plus size={16} />
              Add Row
            </button>
            <button className="btn btn-primary btn-sm">
              <Save size={16} />
              Save Changes
            </button>
          </div>
        ),
      };
    }

    // Report
    if (path === '/report') {
      return {
        title: 'Test Report',
        left: null,
        right: (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">
              <Download size={16} />
              Export
            </button>
            <button className="btn btn-ghost btn-sm">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        ),
      };
    }

    // Settings
    if (path === '/settings') {
      return {
        title: 'Settings',
        left: null,
        right: (
          <button className="btn btn-primary btn-sm">
            <Save size={16} />
            Save Settings
          </button>
        ),
      };
    }

    // Default
    return {
      title: 'QA Studio',
      left: null,
      right: null,
    };
  };

  const { title, left, right } = getToolbarContent();

  return (
    <div className="top-toolbar">
      <div className="toolbar-content">
        <div className="toolbar-left">
          {left || <h2 className="toolbar-title">{title}</h2>}
        </div>
        <div className="toolbar-right">
          {isDemoMode && (
            <>
              <a
                href={`${basePath}/`}
                className="btn btn-ghost btn-sm mr-2"
              >
                <Home size={16} />
                Exit Demo
              </a>
              <a
                href={`${basePath}/download`}
                target="_blank"
                className="btn btn-primary btn-sm"
                style={{ marginRight: right ? '8px' : 0 }}
              >
                <Download size={16} />
                Download Desktop App
              </a>
            </>
          )}
          <NotificationCenter />
          <ThemeToggle />
          {right}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;

