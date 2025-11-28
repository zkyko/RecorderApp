import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Table,
  Badge,
  Button,
  Code,
  Center,
  ActionIcon,
  Tooltip,
  Textarea,
  Modal,
  SegmentedControl,
  Stack,
  Group,
} from '@mantine/core';
import { Edit2, Check, X, Flag } from 'lucide-react';
import { LocatorInfo } from '../../../types/v1.5';
import { ipc } from '../ipc';
import { LocatorStatusState } from '../../../types/v1.5';

interface TestDetailsLocatorsTabProps {
  locators: LocatorInfo[];
  testName: string;
  workspacePath: string;
  onLocatorUpdate: () => Promise<void>;
}

const TestDetailsLocatorsTab: React.FC<TestDetailsLocatorsTabProps> = ({
  locators,
  testName,
  workspacePath,
  onLocatorUpdate,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedSelector, setEditedSelector] = useState<string>('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetIndex, setStatusTargetIndex] = useState<number | null>(null);
  const [statusState, setStatusState] = useState<LocatorStatusState>('healthy');
  const [statusNote, setStatusNote] = useState<string>('');
  const [locatorStatuses, setLocatorStatuses] = useState<Map<string, { state: LocatorStatusState; note?: string }>>(new Map());
  const [saving, setSaving] = useState(false);

  // Load locator statuses
  useEffect(() => {
    if (locators.length > 0 && workspacePath) {
      loadLocatorStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locators, workspacePath, testName]);

  const loadLocatorStatuses = async () => {
    if (!workspacePath) return;
    
    try {
      // Load all locators from workspace to get their statuses
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        const statusMap = new Map<string, { state: LocatorStatusState; note?: string }>();
        
        response.        response.locators.forEach((entry: any) => {
          if (entry.status && entry.usedInTests.includes(testName)) {
            // Match locators by selector - check if the locator snippet matches
            locators.forEach(loc => {
              // Match if entry locator is contained in locator selector or vice versa
              if (loc.selector.includes(entry.locator) || entry.locator.includes(loc.selector) || 
                  loc.selector.trim() === entry.locator.trim()) {
                statusMap.set(loc.selector, {
                  state: entry.status.state || 'healthy',
                  note: entry.status.note,
                });
              }
            });
          }
        });
        
        setLocatorStatuses(statusMap);
      }
    } catch (error) {
      console.error('Failed to load locator statuses:', error);
    }
  };

  const getStatusForLocator = (locator: LocatorInfo) => {
    return locatorStatuses.get(locator.selector) || { state: 'healthy' as LocatorStatusState };
  };

  const statusColor = (state?: LocatorStatusState) => {
    switch (state) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'failing': return 'red';
      default: return 'gray';
    }
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditedSelector(locators[index].selector);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditedSelector('');
  };

  const handleEditSave = async () => {
    if (editingIndex === null || !testName || !workspacePath) return;
    
    const locator = locators[editingIndex];
    if (locator.selector === editedSelector.trim()) {
      handleEditCancel();
      return;
    }

    setSaving(true);
    try {
      const response = await ipc.workspace.locatorsUpdate({
        workspacePath,
        originalLocator: locator.selector,
        updatedLocator: editedSelector.trim(),
        type: locator.type,
        tests: [testName],
      });

      if (response.success) {
        // Reload test data
        await onLocatorUpdate();
        setEditingIndex(null);
        setEditedSelector('');
      } else {
        alert(`Failed to update locator: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to update locator'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusOpen = (index: number) => {
    const locator = locators[index];
    const status = getStatusForLocator(locator);
    setStatusTargetIndex(index);
    setStatusState(status.state);
    setStatusNote(status.note || '');
    setStatusModalOpen(true);
  };

  const handleStatusSave = async () => {
    if (statusTargetIndex === null || !testName || !workspacePath) return;

    const locator = locators[statusTargetIndex];
    setSaving(true);
    try {
      const locatorKey = `${locator.type}:${locator.selector}`;
      const response = await ipc.workspace.locatorsSetStatus({
        workspacePath,
        locatorKey,
        status: statusState,
        note: statusNote,
        testName,
      });

      if (response.success) {
        await loadLocatorStatuses();
        setStatusModalOpen(false);
        setStatusTargetIndex(null);
      } else {
        alert(`Failed to update status: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to update status'}`);
    } finally {
      setSaving(false);
    }
  };

  if (locators.length === 0) {
    return (
      <Card padding="lg" radius="md" withBorder>
        <Center py="xl">
          <Text c="dimmed">No locators found in this test.</Text>
        </Center>
      </Card>
    );
  }

  return (
    <>
      <Card padding="lg" radius="md" withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Selector / API</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Used Lines</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {locators.map((locator, index) => {
              const isEditing = editingIndex === index;
              const status = getStatusForLocator(locator);

              return (
                <Table.Tr key={index}>
                  <Table.Td>
                    {isEditing ? (
                      <Textarea
                        value={editedSelector}
                        onChange={(e) => setEditedSelector(e.target.value)}
                        minRows={2}
                        style={{ width: '100%', maxWidth: 500 }}
                      />
                    ) : (
                      <Code block style={{ maxWidth: 500, fontSize: '0.75rem' }}>
                        {locator.selector}
                      </Code>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{locator.type}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{locator.lines.join(', ')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(status.state)} variant="light">
                      {status.state.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {isEditing ? (
                      <Group gap="xs">
                        <Tooltip label="Save">
                          <ActionIcon color="green" onClick={handleEditSave} loading={saving}>
                            <Check size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Cancel">
                          <ActionIcon color="red" onClick={handleEditCancel}>
                            <X size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ) : (
                      <Group gap="xs">
                        <Tooltip label="Edit locator">
                          <ActionIcon variant="subtle" onClick={() => handleEditStart(index)}>
                            <Edit2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Update status">
                          <ActionIcon variant="subtle" onClick={() => handleStatusOpen(index)}>
                            <Flag size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Locator Status"
        radius="md"
      >
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            value={statusState}
            onChange={(value: LocatorStatusState) => setStatusState(value)}
            data={[
              { label: 'Healthy', value: 'healthy' },
              { label: 'Warning', value: 'warning' },
              { label: 'Failing', value: 'failing' },
            ]}
          />
          <Textarea
            label="Notes"
            placeholder="Add context (e.g., which test failed)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            minRows={2}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusSave} loading={saving}>
              Save Status
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default TestDetailsLocatorsTab;

