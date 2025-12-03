import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Select,
  TextInput,
  Stack,
  Group,
  Text,
  Badge,
  Card,
  ActionIcon,
  Tooltip,
  Divider,
} from '@mantine/core';
import { Folder, Plus, Check, X, Globe } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { WorkspaceMeta, WorkspaceType } from '../../../types/v1.5';
import { notifications } from '@mantine/notifications';

interface WorkspaceSelectorProps {
  opened: boolean;
  onClose: () => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ opened, onClose }) => {
  const { currentWorkspace, setCurrentWorkspace, setWorkspaceSwitching } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>('d365');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (opened) {
      loadWorkspaces();
    }
  }, [opened]);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await ipc.workspaces.list();
      if (response.success && response.workspaces) {
        // Keep this list in sync with the sidebar: only valid D365 / FH Web workspaces
        const valid = response.workspaces.filter((w) => {
          const hasValidName = typeof w.name === 'string' && w.name.trim().length > 0;
          const supportedType = w.type === 'd365' || w.type === 'web-demo';
          return hasValidName && supportedType;
        });

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
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load workspaces',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a workspace name',
        color: 'red',
      });
      return;
    }

    setCreating(true);
    try {
      const response = await ipc.workspaces.create({
        name: newWorkspaceName.trim(),
        type: newWorkspaceType,
      });

      if (response.success && response.workspace) {
        notifications.show({
          title: 'Success',
          message: `Workspace "${response.workspace.name}" created`,
          color: 'green',
        });
        setNewWorkspaceName('');
        await loadWorkspaces();
        // Switch to the new workspace
        await handleSwitchWorkspace(response.workspace.id);
        // Close the modal after creating and switching
        onClose();
      } else {
        notifications.show({
          title: 'Error',
          message: response.error || 'Failed to create workspace',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create workspace',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    setSwitching(true);
    setWorkspaceSwitching(true);
    try {
      const response = await ipc.workspaces.setCurrent({ workspaceId });
      if (response.success && response.workspace) {
        setCurrentWorkspace(response.workspace);
        notifications.show({
          title: 'Success',
          message: `Switched to workspace "${response.workspace.name}"`,
          color: 'green',
        });
        onClose();
      } else {
        notifications.show({
          title: 'Error',
          message: response.error || 'Failed to switch workspace',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to switch workspace',
        color: 'red',
      });
    } finally {
      setSwitching(false);
      setWorkspaceSwitching(false);
    }
  };

  const getWorkspaceTypeIcon = (type: WorkspaceType) => {
    switch (type) {
      case 'web-demo':
        return <Globe size={16} />;
      case 'd365':
        return <Folder size={16} />;
      default:
        return <Folder size={16} />;
    }
  };

  const getWorkspaceTypeColor = (type: WorkspaceType) => {
    switch (type) {
      case 'web-demo':
        return 'blue';
      case 'd365':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Folder size={20} />
          <Text fw={600}>Workspace Manager</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Current Workspace */}
        {currentWorkspace && (
          <Card padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <Group gap="xs">
                {getWorkspaceTypeIcon(currentWorkspace.type)}
                <div>
                  <Text fw={600}>{currentWorkspace.name}</Text>
                  <Text size="sm" c="dimmed">
                    {currentWorkspace.workspacePath}
                  </Text>
                </div>
              </Group>
              <Badge color={getWorkspaceTypeColor(currentWorkspace.type)}>
                {currentWorkspace.type.toUpperCase()}
              </Badge>
            </Group>
          </Card>
        )}

        <Divider label="Switch Workspace" labelPosition="center" />

        {/* Workspace List */}
        <Select
          label="Select Workspace"
          placeholder={loading ? 'Loading workspaces...' : 'Choose a workspace'}
          data={workspaces.map((w) => ({
            value: w.id,
            label: `${w.name} (${w.type.toUpperCase()})`,
          }))}
          value={currentWorkspace?.id || null}
          onChange={(value) => value && handleSwitchWorkspace(value)}
          searchable
          disabled={loading || switching}
        />

        <Divider label="Create New Workspace" labelPosition="center" />

        {/* Create Workspace Form */}
        <Stack gap="xs">
          <TextInput
            label="Workspace Name"
            placeholder="Enter workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
          <Select
            label="Workspace Type"
            value={newWorkspaceType}
            onChange={(value) => setNewWorkspaceType((value as WorkspaceType) || 'd365')}
            data={[
              { value: 'd365', label: 'D365 (Dynamics 365)' },
              { value: 'web-demo', label: 'FH Web (Web Testing)' },
              { value: 'generic', label: 'Generic' },
            ]}
          />
          <Button
            leftSection={<Plus size={16} />}
            onClick={handleCreateWorkspace}
            loading={creating}
            disabled={!newWorkspaceName.trim()}
            fullWidth
          >
            Create Workspace
          </Button>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default WorkspaceSelector;

