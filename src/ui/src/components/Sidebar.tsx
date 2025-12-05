import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Library, 
  BarChart3, 
  Settings,
  Crosshair,
  LayoutDashboard,
  Camera,
  History,
  Store,
  Cloud,
  Bug,
  Activity,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspace-store';
import { ipc } from '../ipc';
import { WorkspaceMeta } from '../../../types/v1.5';
import WorkspaceSelector from './WorkspaceSelector';
import './Sidebar.css';

// Check if we're in demo mode (web environment)
const isDemoMode = typeof window !== 'undefined' && !window.electronAPI;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentWorkspace, setCurrentWorkspace, setWorkspaceSwitching } = useWorkspaceStore();
  const [workspaceSelectorOpen, setWorkspaceSelectorOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>([]);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Reload workspaces when modal closes (in case a new one was created)
  useEffect(() => {
    if (!workspaceSelectorOpen) {
      loadWorkspaces();
    }
  }, [workspaceSelectorOpen]);

  const loadWorkspaces = async () => {
    try {
      const response = await ipc.workspaces.list();
      if (response.success && response.workspaces) {
        // Filter out corrupted entries and legacy types
        const valid = response.workspaces.filter((w) => {
          const hasValidName = typeof w.name === 'string' && w.name.trim().length > 0;
          const supportedType = w.type === 'd365' || w.type === 'web-demo';
          return hasValidName && supportedType;
        });

        // Prefer the most recently updated workspace per type (D365, FH Web)
        const latestByType = new Map<string, WorkspaceMeta>();
        for (const w of valid) {
          const existing = latestByType.get(w.type);
          if (!existing) {
            latestByType.set(w.type, w);
          } else {
            const existingTime = new Date(existing.updatedAt).getTime();
            const currentTime = new Date(w.updatedAt).getTime();
            if (currentTime > existingTime) {
              latestByType.set(w.type, w);
            }
          }
        }

        const filtered = Array.from(latestByType.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setWorkspaces(filtered);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const handleWorkspaceChange = async (workspaceId: string | null) => {
    if (!workspaceId) return;
    
    // Special values to open workspace selector modal
    if (workspaceId === '__create_new__' || workspaceId === '__manage__') {
      setWorkspaceSelectorOpen(true);
      return;
    }
    
    setSwitchingWorkspace(true);
    // Set global switching state so the main shell can show an overlay
    const target = workspaces.find((w) => w.id === workspaceId);
    setWorkspaceSwitching(true, target?.name || null);
    try {
      const response = await ipc.workspaces.setCurrent(workspaceId);
      if (response.success && response.workspace) {
        setCurrentWorkspace(response.workspace);
        // Reload workspaces to get updated list
        await loadWorkspaces();
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    } finally {
      setSwitchingWorkspace(false);
      setWorkspaceSwitching(false);
    }
  };

  const navItems = [
    // WORKSPACE
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'WORKSPACE' },
    { path: '/library', label: 'Test Library', icon: Library, section: 'WORKSPACE' },
    { path: '/record', label: 'Record', icon: Camera, section: 'WORKSPACE' },
    // EXECUTION
    { path: '/runs', label: 'Runs', icon: History, section: 'EXECUTION' },
    { path: '/browserstack-automate', label: 'BrowserStack Automate', icon: Cloud, section: 'EXECUTION' },
    // QUALITY & INSIGHTS
    { path: '/report', label: 'Report', icon: BarChart3, section: 'QUALITY & INSIGHTS' },
    { path: '/browserstack-tm', label: 'BrowserStack TM', icon: Cloud, section: 'QUALITY & INSIGHTS' },
    // TOOLS
    { path: '/jira', label: 'Jira', icon: Bug, section: 'TOOLS' },
    { path: '/locators', label: 'Locator Library', icon: Crosshair, section: 'TOOLS' },
    { path: '/diagnostics', label: 'Diagnostics', icon: Activity, section: 'TOOLS' },
    ...(isDemoMode ? [{ path: '/marketplace', label: 'Marketplace', icon: Store, section: 'TOOLS' }] : []),
    { path: '/settings', label: 'Settings', icon: Settings, section: 'TOOLS' },
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
        <div className="sidebar-workspace">
          <div className="dropdown dropdown-end w-full relative">
            <label
              tabIndex={0}
              className="select select-bordered select-sm w-full bg-base-200 border-base-300 text-base-content hover:border-primary focus:border-primary focus:outline-none pr-20 overflow-hidden [&>svg]:hidden"
            >
              <span className="block truncate">
                {currentWorkspace
                  ? `${currentWorkspace.name} (${currentWorkspace.type === 'web-demo' ? 'FH Web' : currentWorkspace.type.toUpperCase()})`
                  : 'Select workspace'}
              </span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-base-200 border border-base-300 rounded-box w-full max-h-60 overflow-y-auto z-[1000]"
            >
              {workspaces.map((w) => (
                <li key={w.id}>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      handleWorkspaceChange(w.id);
                    }}
                    className={currentWorkspace?.id === w.id ? 'active' : ''}
                  >
                    {w.name} ({w.type === 'web-demo' ? 'FH Web' : w.type.toUpperCase()})
                  </a>
                </li>
              ))}
              {workspaces.length > 0 && <li><hr className="my-1 border-base-300" /></li>}
              <li>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleWorkspaceChange('__create_new__');
                  }}
                >
                  ➕ Create New Workspace...
                </a>
              </li>
              <li>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleWorkspaceChange('__manage__');
                  }}
                >
                  ⚙️ Manage Workspaces...
                </a>
              </li>
            </ul>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWorkspaceSelectorOpen(true);
                }}
                className="btn btn-ghost btn-xs h-6 w-6 min-h-0 p-0 flex items-center justify-center pointer-events-auto"
                title="Manage workspaces"
              >
                <Settings size={12} />
              </button>
              <svg
                className="w-4 h-4 opacity-50 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
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
        <div className="sidebar-credits">
          <div className="sidebar-credit-line">Built by Nischal Bhandari</div>
          <div className="sidebar-credit-line">for Fourhands</div>
        </div>
        <div className="sidebar-footer-meta">
          <span className="sidebar-version">v2.0.0</span>
          <span className="sidebar-update-date">Dec 3, 2025</span>
        </div>
      </div>

      <WorkspaceSelector
        opened={workspaceSelectorOpen}
        onClose={() => {
          setWorkspaceSelectorOpen(false);
          // Reload workspaces when modal closes to get any newly created ones
          loadWorkspaces();
        }}
      />
    </aside>
  );
};

export default Sidebar;
