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

  // Helper function to extract just the locator part from a full line
  // e.g., "await page.locator('#i0118').fill('value');" -> "page.locator('#i0118')"
  const extractLocatorPart = (selector: string, type: string): string => {
    // Remove "await " prefix if present
    let cleaned = selector.replace(/^await\s+/, '').trim();
    
    // Extract the locator part based on type
    if (type === 'role') {
      // Match: page.getByRole('button', { name: 'Sign in' })
      const match = cleaned.match(/page\.getByRole\([^)]+\)/);
      return match ? match[0] : cleaned;
    } else if (type === 'label') {
      // Match: page.getByLabel('text')
      const match = cleaned.match(/page\.getByLabel\([^)]+\)/);
      return match ? match[0] : cleaned;
    } else if (type === 'text') {
      // Match: page.getByText('text')
      const match = cleaned.match(/page\.getByText\([^)]+\)/);
      return match ? match[0] : cleaned;
    } else if (type === 'placeholder') {
      // Match: page.getByPlaceholder('text')
      const match = cleaned.match(/page\.getByPlaceholder\([^)]+\)/);
      return match ? match[0] : cleaned;
    } else {
      // For CSS, XPath, d365-controlname, testid: match page.locator(...)
      const match = cleaned.match(/page\.locator\([^)]+\)/);
      return match ? match[0] : cleaned;
    }
  };

  const loadLocatorStatuses = async () => {
    if (!workspacePath) return;
    
    try {
      // Load all locators from workspace to get their statuses
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        const statusMap = new Map<string, { state: LocatorStatusState; note?: string }>();
        
        response.locators.forEach((entry: any) => {
          if (entry.status && entry.usedInTests.includes(testName)) {
            // Match locators by extracting the locator part and comparing
            locators.forEach(loc => {
              const locatorPart = extractLocatorPart(loc.selector, loc.type);
              // Match if the extracted locator part matches the entry locator
              if (locatorPart.trim() === entry.locator.trim() || 
                  loc.selector.includes(entry.locator) || 
                  entry.locator.includes(locatorPart)) {
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
      case 'broken': return 'red';
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
      // Extract just the locator part (e.g., "page.locator('#i0118')") from the full line
      const locatorPart = extractLocatorPart(locator.selector, locator.type);
      const locatorKey = `${locator.type}:${locatorPart.trim()}`;
      
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
              { label: 'Broken', value: 'broken' },
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

