import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Select } from '@mantine/core';
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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Workspace' },
    { path: '/library', label: 'Test Library', icon: Library, section: 'Workspace' },
    { path: '/record', label: 'Record', icon: Camera, section: 'Workspace' },
    { path: '/runs', label: 'Runs', icon: History, section: 'Tools' },
    { path: '/report', label: 'Report', icon: BarChart3, section: 'Tools' },
    { path: '/browserstack-tm', label: 'BrowserStack TM', icon: Cloud, section: 'Tools' },
    { path: '/browserstack-automate', label: 'BrowserStack Automate', icon: Cloud, section: 'Tools' },
    { path: '/jira', label: 'Jira', icon: Bug, section: 'Tools' },
    { path: '/locators', label: 'Locator Library', icon: Crosshair, section: 'Tools' },
    { path: '/diagnostics', label: 'Diagnostics', icon: Activity, section: 'Tools' },
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
        <div className="sidebar-workspace">
          <Select
            placeholder="Select workspace"
            value={currentWorkspace?.id || null}
            onChange={handleWorkspaceChange}
            data={[
              ...workspaces.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.type === 'web-demo' ? 'FH Web' : w.type.toUpperCase()})`,
              })),
              { value: '__divider__', label: '──────────', disabled: true },
              { value: '__create_new__', label: '➕ Create New Workspace...' },
              { value: '__manage__', label: '⚙️ Manage Workspaces...' },
            ]}
            searchable
            disabled={switchingWorkspace}
            size="xs"
            styles={{
              input: {
                backgroundColor: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid #374151',
                color: '#f3f4f6',
                fontSize: '0.875rem',
                '&:hover': {
                  borderColor: '#4b5563',
                },
              },
              dropdown: {
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
              },
              option: {
                backgroundColor: '#1f2937',
                color: '#f3f4f6',
                '&:hover': {
                  backgroundColor: '#374151',
                },
                '&[data-selected]': {
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                },
                '&[data-disabled]': {
                  color: '#6b7280',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                },
              },
            }}
            rightSection={
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWorkspaceSelectorOpen(true);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 10,
                }}
                title="Manage workspaces"
              >
                <Settings size={14} />
              </button>
            }
          />
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
