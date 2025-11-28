import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Group } from '@mantine/core';
import { 
  Plus, 
  Play, 
  Filter, 
  CircleDot, 
  Square, 
  Save, 
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';
import './TopToolbar.css';

const TopToolbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getToolbarContent = () => {
    const path = location.pathname;

    // Dashboard
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'Dashboard',
        left: null,
        right: (
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/record')}
            variant="filled"
            color="blue"
          >
            New Test
          </Button>
        ),
      };
    }

    // Test Library
    if (path === '/library') {
      return {
        title: 'Test Library',
        left: null,
        right: (
          <Group gap="xs">
            <Button
              leftSection={<Filter size={16} />}
              variant="subtle"
              color="gray"
            >
              Filter
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => navigate('/record')}
              variant="filled"
              color="blue"
            >
              New Test
            </Button>
          </Group>
        ),
      };
    }

    // Record
    if (path.startsWith('/record')) {
      return {
        title: 'Record Flow',
        left: null,
        right: (
          <Group gap="xs">
            <Button
              leftSection={<CircleDot size={16} />}
              variant="filled"
              color="green"
            >
              Start Recording
            </Button>
            <Button
              leftSection={<Square size={16} />}
              variant="filled"
              color="red"
            >
              Stop Recording
            </Button>
          </Group>
        ),
      };
    }

    // Runs
    if (path.startsWith('/runs')) {
      return {
        title: 'Test Runs',
        left: null,
        right: (
          <Group gap="xs">
            <Button
              leftSection={<RefreshCw size={16} />}
              variant="subtle"
              color="gray"
            >
              Refresh
            </Button>
            <Button
              leftSection={<Play size={16} />}
              variant="filled"
              color="blue"
            >
              Run Tests
            </Button>
          </Group>
        ),
      };
    }

    // Data Editor
    if (path.includes('/data')) {
      return {
        title: 'Data Editor',
        left: null,
        right: (
          <Group gap="xs">
            <Button
              leftSection={<Plus size={16} />}
              variant="subtle"
              color="gray"
            >
              Add Row
            </Button>
            <Button
              leftSection={<Save size={16} />}
              variant="filled"
              color="blue"
            >
              Save Changes
            </Button>
          </Group>
        ),
      };
    }

    // Report
    if (path === '/report') {
      return {
        title: 'Test Report',
        left: null,
        right: (
          <Group gap="xs">
            <Button
              leftSection={<Download size={16} />}
              variant="subtle"
              color="gray"
            >
              Export
            </Button>
            <Button
              leftSection={<RefreshCw size={16} />}
              variant="subtle"
              color="gray"
            >
              Refresh
            </Button>
          </Group>
        ),
      };
    }

    // Settings
    if (path === '/settings') {
      return {
        title: 'Settings',
        left: null,
        right: (
          <Button
            leftSection={<Save size={16} />}
            variant="filled"
            color="blue"
          >
            Save Settings
          </Button>
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
          {right}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;

