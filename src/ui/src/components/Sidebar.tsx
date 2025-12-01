import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Library, 
  CircleDot, 
  PlayCircle, 
  BugPlay, 
  BarChart3, 
  Settings,
  Crosshair,
  LayoutDashboard,
  Camera,
  History,
  Store,
  Cloud,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspace-store';
import './Sidebar.css';

// Check if we're in demo mode (web environment)
const isDemoMode = typeof window !== 'undefined' && !window.electronAPI;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Workspace' },
    { path: '/library', label: 'Test Library', icon: Library, section: 'Workspace' },
    { path: '/record', label: 'Record', icon: Camera, section: 'Workspace' },
    { path: '/runs', label: 'Runs', icon: History, section: 'Tools' },
    { path: '/report', label: 'Report', icon: BarChart3, section: 'Tools' },
    { path: '/browserstack-tm', label: 'BrowserStack TM', icon: Cloud, section: 'Tools' },
    { path: '/locators', label: 'Locator Library', icon: Crosshair, section: 'Tools' },
    ...(isDemoMode ? [{ path: '/marketplace', label: 'Marketplace', icon: Store, section: 'Tools' }] : []),
    { path: '/settings', label: 'Settings', icon: Settings, section: 'Tools' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">QA Studio</span>
        </div>
        {currentWorkspace && (
          <div className="sidebar-workspace" title={currentWorkspace.name}>
            <span className="workspace-name">{currentWorkspace.name}</span>
            <span className="workspace-type">{currentWorkspace.type.toUpperCase()}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="nav-section">
            <div className="nav-section-label">{section}</div>
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.7.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;
