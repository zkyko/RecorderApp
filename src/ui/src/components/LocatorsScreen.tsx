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
import { Crosshair, Search, Eye, Pencil, Plus, Compass, AlertTriangle, CheckCircle2, Info, Merge, X } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { LocatorIndexEntry } from '../../../types/v1.5';
import BrowseLocator from './BrowseLocator';
import FilterChip from './FilterChip';
import StatusBadge from './StatusBadge';
import Button from './Button';
import { calculateLocatorHealth, getHealthBadgeVariant, LocatorHealthStatus } from '../utils/locatorHealth';
import { findDuplicates, DuplicateGroup } from '../utils/duplicateDetection';
import { notifications } from '../utils/notifications';
import './LocatorsScreen.css';

const LocatorsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [locators, setLocators] = useState<LocatorIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<LocatorHealthStatus | null>(null);
  const [expandedLocator, setExpandedLocator] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [merging, setMerging] = useState(false);
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
        // Detect duplicates
        const duplicates = findDuplicates(response.locators);
        setDuplicateGroups(duplicates);
      }
    } catch (error) {
      console.error('Failed to load locators:', error);
    } finally {
      setLoading(false);
    }
  };

  const locatorsWithHealth = locators.map(loc => ({
    ...loc,
    health: calculateLocatorHealth(loc),
  }));

  const filteredLocators = locatorsWithHealth.filter(loc => {
    const matchesSearch = !searchQuery || 
      loc.locator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.usedInTests || []).some(test => test.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || loc.type === typeFilter;
    const matchesHealth = !healthFilter || loc.health.status === healthFilter;
    return matchesSearch && matchesType && matchesHealth;
  });

  // Calculate health statistics
  const healthStats = {
    excellent: locatorsWithHealth.filter(l => l.health.status === 'excellent').length,
    good: locatorsWithHealth.filter(l => l.health.status === 'good').length,
    fair: locatorsWithHealth.filter(l => l.health.status === 'fair').length,
    poor: locatorsWithHealth.filter(l => l.health.status === 'poor').length,
    critical: locatorsWithHealth.filter(l => l.health.status === 'critical').length,
  };

  const types = Array.from(new Set(locators.map(l => l.type)));

  const handleViewInTest = (locator: LocatorIndexEntry) => {
    if (locator.usedInTests && locator.usedInTests.length > 0) {
      navigate(`/tests/${locator.usedInTests[0]}`, { state: { initialTab: 'locators', highlightLocator: locator.locator } });
    }
  };

  const openEditModal = (locator: LocatorIndexEntry) => {
    setEditingLocator(locator);
    setEditedSnippet(locator.locator);
    setEditedTests(locator.usedInTests || []);
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
            {duplicateGroups.length > 0 && (
              <Button
                leftSection={<Merge size={16} />}
                onClick={() => setShowDuplicates(!showDuplicates)}
                variant="light"
                color="orange"
              >
                {duplicateGroups.length} Duplicate{duplicateGroups.length !== 1 ? 's' : ''} Found
              </Button>
            )}
          </Group>
        </Group>

        {/* Duplicate Groups Panel */}
        {showDuplicates && duplicateGroups.length > 0 && (
          <Card padding="md" radius="md" withBorder mb="md" style={{ backgroundColor: 'var(--mantine-color-orange-0)' }}>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={600} size="sm" mb="xs">
                  <Merge size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Duplicate Locators Detected
                </Text>
                <Text size="xs" c="dimmed">
                  {duplicateGroups.length} group{duplicateGroups.length !== 1 ? 's' : ''} of similar locators found. Consider merging them.
                </Text>
              </div>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowDuplicates(false)}
              >
                <X size={14} />
              </Button>
            </Group>
            <Stack gap="sm">
              {duplicateGroups.map((group) => (
                <Card key={group.id} padding="sm" radius="sm" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} mb="xs">
                        {group.locators.length} similar locator{group.locators.length !== 1 ? 's' : ''} ({Math.round(group.similarity)}% similar)
                      </Text>
                      <Stack gap="xs">
                        {group.locators.map((loc, idx) => (
                          <Group key={idx} gap="xs">
                            <Badge size="xs" variant="light">{loc.type}</Badge>
                            <Text size="xs" ff="monospace" style={{ flex: 1 }}>
                              {loc.locator.length > 60 ? `${loc.locator.substring(0, 60)}...` : loc.locator}
                            </Text>
                            <Text size="xs" c="dimmed">({loc.testCount} tests)</Text>
                          </Group>
                        ))}
                      </Stack>
                      <Text size="xs" c="dimmed" mt="xs" style={{ fontStyle: 'italic' }}>
                        Recommended: {group.recommendedLocator.length > 50 
                          ? `${group.recommendedLocator.substring(0, 50)}...` 
                          : group.recommendedLocator}
                      </Text>
                    </div>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<Merge size={14} />}
                      onClick={() => {
                        setSelectedGroup(group);
                        setMergeModalOpen(true);
                      }}
                    >
                      Merge
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        )}

        {/* Health Summary */}
        {locatorsWithHealth.length > 0 && (
          <Group gap="md" mb="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
            <div>
              <Text size="xs" c="dimmed" mb={4}>Overall Health</Text>
              <Group gap="xs">
                <Badge color="green" variant="light">{healthStats.excellent} Excellent</Badge>
                <Badge color="blue" variant="light">{healthStats.good} Good</Badge>
                <Badge color="orange" variant="light">{healthStats.fair} Fair</Badge>
                <Badge color="red" variant="light">{healthStats.poor} Poor</Badge>
                <Badge color="dark" variant="light">{healthStats.critical} Critical</Badge>
              </Group>
            </div>
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" mb={4}>Average Score</Text>
              <Text fw={600} size="lg">
                {Math.round(locatorsWithHealth.reduce((sum, l) => sum + l.health.score, 0) / locatorsWithHealth.length)}/100
              </Text>
            </div>
            {healthStats.critical > 0 && (
              <div>
                <Group gap="xs">
                  <AlertTriangle size={16} color="var(--mantine-color-red)" />
                  <Text size="sm" c="red" fw={500}>
                    {healthStats.critical} critical locator{healthStats.critical !== 1 ? 's' : ''} need attention
                  </Text>
                </Group>
              </div>
            )}
          </Group>
        )}

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

        {/* Health Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            label="All Locators"
            active={!healthFilter}
            count={locatorsWithHealth.length}
            onToggle={() => setHealthFilter(null)}
          />
          <FilterChip
            label="Excellent"
            active={healthFilter === 'excellent'}
            count={healthStats.excellent}
            onToggle={() => setHealthFilter(healthFilter === 'excellent' ? null : 'excellent')}
          />
          <FilterChip
            label="Good"
            active={healthFilter === 'good'}
            count={healthStats.good}
            onToggle={() => setHealthFilter(healthFilter === 'good' ? null : 'good')}
          />
          <FilterChip
            label="Fair"
            active={healthFilter === 'fair'}
            count={healthStats.fair}
            onToggle={() => setHealthFilter(healthFilter === 'fair' ? null : 'fair')}
          />
          <FilterChip
            label="Poor"
            active={healthFilter === 'poor'}
            count={healthStats.poor}
            onToggle={() => setHealthFilter(healthFilter === 'poor' ? null : 'poor')}
          />
          <FilterChip
            label="Critical"
            active={healthFilter === 'critical'}
            count={healthStats.critical}
            onToggle={() => setHealthFilter(healthFilter === 'critical' ? null : 'critical')}
          />
        </div>
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
                <Table.Th>Health</Table.Th>
                <Table.Th>Locator Snippet</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Test Count</Table.Th>
                <Table.Th>Used in Tests</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredLocators.map((locator) => {
                const isExpanded = expandedLocator === `${locator.type}-${locator.locator}`;
                return (
                  <React.Fragment key={`${locator.type}-${locator.locator}`}>
                    <Table.Tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedLocator(isExpanded ? null : `${locator.type}-${locator.locator}`)}
                    >
                      <Table.Td>
                        <Tooltip label={`Health Score: ${locator.health.score}/100`}>
                          <div>
                            <Badge
                              variant="light"
                              color={getHealthBadgeVariant(locator.health.status)}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {locator.health.status}
                            </Badge>
                            <Text size="xs" c="dimmed" mt={4}>
                              {locator.health.score}/100
                            </Text>
                          </div>
                        </Tooltip>
                      </Table.Td>
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
                          {(locator.usedInTests || []).slice(0, 3).map(test => (
                            <Chip key={test} size="xs" variant="light">
                              {test}
                            </Chip>
                          ))}
                          {(locator.usedInTests || []).length > 3 && (
                            <Chip size="xs" variant="light">
                              +{(locator.usedInTests || []).length - 3}
                            </Chip>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td onClick={(e) => e.stopPropagation()}>
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
                    {isExpanded && (
                      <Table.Tr>
                        <Table.Td colSpan={6} style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                          <Stack gap="md" p="md">
                            <div>
                              <Text fw={600} size="sm" mb="xs">Health Analysis</Text>
                              <Group gap="md">
                                <div>
                                  <Text size="xs" c="dimmed">Type Score</Text>
                                  <Text fw={500}>{locator.health.factors.type}/40</Text>
                                </div>
                                <div>
                                  <Text size="xs" c="dimmed">Complexity</Text>
                                  <Text fw={500}>{locator.health.factors.complexity}/30</Text>
                                </div>
                                <div>
                                  <Text size="xs" c="dimmed">Stability</Text>
                                  <Text fw={500}>{locator.health.factors.stability}/20</Text>
                                </div>
                                <div>
                                  <Text size="xs" c="dimmed">Usage</Text>
                                  <Text fw={500}>{locator.health.factors.usage}/10</Text>
                                </div>
                              </Group>
                            </div>
                            <div>
                              <Text fw={600} size="sm" mb="xs">Recommendations</Text>
                              <Stack gap="xs">
                                {locator.health.recommendations.map((rec, idx) => (
                                  <Group key={idx} gap="xs" align="flex-start">
                                    <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                    <Text size="sm" style={{ flex: 1 }}>{rec}</Text>
                                  </Group>
                                ))}
                              </Stack>
                            </div>
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </React.Fragment>
                );
              })}
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
              data={(editingLocator.usedInTests || []).map(test => ({ value: test, label: test }))}
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

      {/* Merge Duplicates Modal */}
      <Modal
        opened={mergeModalOpen}
        onClose={() => {
          setMergeModalOpen(false);
          setSelectedGroup(null);
        }}
        title="Merge Duplicate Locators"
        size="lg"
        radius="md"
      >
        {selectedGroup && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              This will replace all duplicate locators with the recommended one across all tests.
            </Text>
            <div>
              <Text fw={500} size="sm" mb="xs">Recommended Locator:</Text>
              <Card padding="sm" radius="sm" withBorder>
                <Group gap="xs">
                  <Badge>{selectedGroup.locators.find(l => l.locator === selectedGroup.recommendedLocator)?.type}</Badge>
                  <Text size="sm" ff="monospace" style={{ flex: 1 }}>
                    {selectedGroup.recommendedLocator}
                  </Text>
                </Group>
              </Card>
            </div>
            <div>
              <Text fw={500} size="sm" mb="xs">Will be replaced:</Text>
              <Stack gap="xs">
                {selectedGroup.locators
                  .filter(l => l.locator !== selectedGroup.recommendedLocator)
                  .map((loc, idx) => (
                    <Card key={idx} padding="sm" radius="sm" withBorder>
                      <Group gap="xs">
                        <Badge variant="light">{loc.type}</Badge>
                        <Text size="sm" ff="monospace" style={{ flex: 1 }}>
                          {loc.locator}
                        </Text>
                        <Text size="xs" c="dimmed">({loc.testCount} tests)</Text>
                      </Group>
                    </Card>
                  ))}
              </Stack>
            </div>
            <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
              {selectedGroup.reason}
            </Text>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setMergeModalOpen(false);
                  setSelectedGroup(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!workspacePath || !selectedGroup) return;
                  setMerging(true);
                  try {
                    // Merge all duplicates to the recommended locator
                    const duplicates = selectedGroup.locators.filter(
                      l => l.locator !== selectedGroup.recommendedLocator
                    );
                    
                    for (const duplicate of duplicates) {
                      const allTests = [...new Set([
                        ...(duplicate.usedInTests || []),
                        ...(selectedGroup.locators.find(l => l.locator === selectedGroup.recommendedLocator)?.usedInTests || [])
                      ])];
                      
                      await ipc.workspace.locatorsUpdate({
                        workspacePath,
                        originalLocator: duplicate.locator,
                        updatedLocator: selectedGroup.recommendedLocator,
                        type: selectedGroup.locators.find(l => l.locator === selectedGroup.recommendedLocator)?.type || duplicate.type,
                        tests: allTests,
                      });
                    }
                    
                    notifications.show({
                      message: `Merged ${duplicates.length} duplicate locator${duplicates.length !== 1 ? 's' : ''}`,
                      color: 'success',
                    });
                    
                    setMergeModalOpen(false);
                    setSelectedGroup(null);
                    await loadLocators();
                  } catch (error: any) {
                    notifications.show({
                      message: `Failed to merge: ${error.message}`,
                      color: 'error',
                    });
                  } finally {
                    setMerging(false);
                  }
                }}
                loading={merging}
                leftSection={<Merge size={16} />}
              >
                Merge Locators
              </Button>
            </Group>
          </Stack>
        )}
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

