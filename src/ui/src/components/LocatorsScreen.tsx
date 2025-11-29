import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Table,
  Group,
  Badge,
  Button,
  TextInput,
  Select,
  Loader,
  Center,
  Chip,
  Breadcrumbs,
  Anchor,
  Modal,
  Textarea,
  MultiSelect,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { Crosshair, Search, Eye, Pencil, Plus, Compass } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { LocatorIndexEntry } from '../../../types/v1.5';
import BrowseLocator from './BrowseLocator';
import './LocatorsScreen.css';

const LocatorsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [locators, setLocators] = useState<LocatorIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocator, setEditingLocator] = useState<LocatorIndexEntry | null>(null);
  const [editedSnippet, setEditedSnippet] = useState('');
  const [editedTests, setEditedTests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLocatorSnippet, setNewLocatorSnippet] = useState('');
  const [newLocatorType, setNewLocatorType] = useState<string>('css');
  const [newLocatorTests, setNewLocatorTests] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [browseLocatorOpen, setBrowseLocatorOpen] = useState(false);

  useEffect(() => {
    if (workspacePath) {
      loadLocators();
    }
  }, [workspacePath]);

  // Listen for locator status updates
  useEffect(() => {
    if (!workspacePath) return;

    const handleStatusUpdate = (data: { workspacePath: string; locatorKey: string; status: any }) => {
      // Only refresh if the update is for the current workspace
      if (data.workspacePath === workspacePath) {
        console.log('[LocatorsScreen] Locator status updated, refreshing...');
        loadLocators();
      }
    };

    ipc.locator.onStatusUpdated(handleStatusUpdate);

    return () => {
      ipc.locator.removeStatusUpdatedListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePath]);

  const loadLocators = async () => {
    if (!workspacePath) return;

    setLoading(true);
    try {
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        setLocators(response.locators);
      }
    } catch (error) {
      console.error('Failed to load locators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocators = locators.filter(loc => {
    const matchesSearch = !searchQuery || 
      loc.locator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.usedInTests.some(test => test.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || loc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const types = Array.from(new Set(locators.map(l => l.type)));

  const handleViewInTest = (locator: LocatorIndexEntry) => {
    if (locator.usedInTests.length > 0) {
      navigate(`/tests/${locator.usedInTests[0]}`, { state: { initialTab: 'locators', highlightLocator: locator.locator } });
    }
  };

  const openEditModal = (locator: LocatorIndexEntry) => {
    setEditingLocator(locator);
    setEditedSnippet(locator.locator);
    setEditedTests(locator.usedInTests);
    setEditModalOpen(true);
  };

  const saveLocatorEdit = async () => {
    if (!workspacePath || !editingLocator) return;
    setSaving(true);
    try {
      const response = await ipc.workspace.locatorsUpdate({
        workspacePath,
        originalLocator: editingLocator.locator,
        updatedLocator: editedSnippet,
        type: editingLocator.type,
        tests: editedTests,
      });
      if (response.success) {
        setEditModalOpen(false);
        await loadLocators();
      } else {
        console.error('Failed to update locator:', response.error);
      }
    } catch (error) {
      console.error('Failed to update locator:', error);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Locators' },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        if (item.href) navigate(item.href);
      }}
    >
      {item.title}
    </Anchor>
  ));

  return (
    <div className="locators-screen">
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="xl" fw={700} mb="xs">Locator Library</Text>
            <Text size="sm" c="dimmed">
              Review, edit, and track the health of every locator across your tests.
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<Compass size={16} />}
              onClick={() => setBrowseLocatorOpen(true)}
              variant="filled"
              color="blue"
            >
              Browse Locator
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Locator
            </Button>
          </Group>
        </Group>

        <Group gap="md" mb="md">
          <TextInput
            placeholder="Search locators or tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<Search size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="All Types"
            data={types.map(t => ({ value: t, label: t }))}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      {filteredLocators.length === 0 ? (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">🎯</Text>
              <Text size="xl" fw={600} mb="xs">No locators found</Text>
              <Text c="dimmed">
                {searchQuery || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Record tests to populate this list'}
              </Text>
            </div>
          </Center>
        </Card>
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Locator Snippet</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Test Count</Table.Th>
                <Table.Th>Used in Tests</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredLocators.map((locator) => (
                <Table.Tr key={`${locator.type}-${locator.locator}`}>
                  <Table.Td>
                    <Text size="sm" ff="monospace" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {locator.locator}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{locator.type}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{locator.testCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {locator.usedInTests.slice(0, 3).map(test => (
                        <Chip key={test} size="xs" variant="light">
                          {test}
                        </Chip>
                      ))}
                      {locator.usedInTests.length > 3 && (
                        <Chip size="xs" variant="light">
                          +{locator.usedInTests.length - 3}
                        </Chip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View in test">
                        <ActionIcon variant="light" onClick={() => handleViewInTest(locator)}>
                          <Eye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit locator">
                        <ActionIcon variant="light" onClick={() => openEditModal(locator)}>
                          <Pencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Locator"
        size="lg"
        radius="md"
      >
        {editingLocator && (
          <Stack gap="md">
            <Textarea
              label="Locator snippet"
              description="Update the Playwright locator snippet. This will replace all occurrences in the selected tests."
              value={editedSnippet}
              onChange={(e) => setEditedSnippet(e.target.value)}
              minRows={3}
            />
            <MultiSelect
              label="Apply to tests"
              data={editingLocator.usedInTests.map(test => ({ value: test, label: test }))}
              value={editedTests}
              onChange={setEditedTests}
              description="Choose which tests should be updated."
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveLocatorEdit}
                loading={saving}
                disabled={!editedSnippet.trim() || editedTests.length === 0}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setNewLocatorSnippet('');
          setNewLocatorType('css');
          setNewLocatorTests([]);
        }}
        title="Add New Locator"
        size="lg"
        radius="md"
      >
        <Stack gap="md">
          <Textarea
            label="Locator snippet"
            description="Enter the Playwright locator snippet (e.g., await page.locator('#myId').click();)"
            value={newLocatorSnippet}
            onChange={(e) => setNewLocatorSnippet(e.currentTarget.value)}
            placeholder="await page.locator('#myId').click();"
            minRows={3}
          />
          <Select
            label="Locator Type"
            data={[
              { value: 'css', label: 'CSS' },
              { value: 'role', label: 'Role' },
              { value: 'label', label: 'Label' },
              { value: 'text', label: 'Text' },
              { value: 'xpath', label: 'XPath' },
              { value: 'placeholder', label: 'Placeholder' },
              { value: 'testid', label: 'Test ID' },
            ]}
            value={newLocatorType}
            onChange={(value) => setNewLocatorType(value || 'css')}
            description="Select the type of locator."
          />
          <Text size="sm" c="dimmed">
            Note: Custom locators are saved to locators/status.json and can be used across your workspace.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => {
                setAddModalOpen(false);
                setNewLocatorSnippet('');
                setNewLocatorType('css');
                setNewLocatorTests([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!workspacePath || !newLocatorSnippet.trim()) return;
                setAdding(true);
                try {
                  const response = await ipc.workspace.locatorsAdd({
                    workspacePath,
                    locator: newLocatorSnippet.trim(),
                    type: newLocatorType as LocatorIndexEntry['type'],
                    tests: newLocatorTests,
                  });
                  if (response.success) {
                    setAddModalOpen(false);
                    setNewLocatorSnippet('');
                    setNewLocatorType('css');
                    setNewLocatorTests([]);
                    await loadLocators();
                  } else {
                    console.error('Failed to add locator:', response.error);
                    alert(response.error || 'Failed to add locator');
                  }
                } catch (error) {
                  console.error('Failed to add locator:', error);
                  alert('Failed to add locator');
                } finally {
                  setAdding(false);
                }
              }}
              loading={adding}
              disabled={!newLocatorSnippet.trim()}
            >
              Add Locator
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Browse Locator Modal */}
      <BrowseLocator
        opened={browseLocatorOpen}
        onClose={() => {
          setBrowseLocatorOpen(false);
          loadLocators(); // Refresh locators after closing
        }}
      />
    </div>
  );
};

export default LocatorsScreen;

