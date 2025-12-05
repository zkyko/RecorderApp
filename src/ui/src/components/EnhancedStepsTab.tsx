import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Textarea,
  Modal,
  Stack,
  ScrollArea,
  Code,
  ActionIcon,
  Tooltip,
  Badge,
  Select,
  TextInput,
  Switch,
  Tabs,
  Alert,
  Divider,
} from '@mantine/core';
import {
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { LocatorIndexEntry } from '../../../types/v1.5';
import { notifications } from '../utils/notifications';
import VisualTestBuilder from './VisualTestBuilder';

interface Step {
  index: number;
  description: string;
  line: number;
  content: string; // Full line content
  originalContent: string; // For tracking changes
}

interface EnhancedStepsTabProps {
  specContent: string | null;
  testName: string;
  onSpecUpdate?: () => void;
}

const EnhancedStepsTab: React.FC<EnhancedStepsTabProps> = ({ specContent, testName, onSpecUpdate }) => {
  const { workspacePath } = useWorkspaceStore();
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addStepModalOpen, setAddStepModalOpen] = useState(false);
  const [newStepContent, setNewStepContent] = useState('');
  const [newStepAfterLine, setNewStepAfterLine] = useState<number | undefined>(undefined);
  const [locatorPickerOpen, setLocatorPickerOpen] = useState(false);
  const [availableLocators, setAvailableLocators] = useState<LocatorIndexEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('steps');
  const [visualBuilderOpen, setVisualBuilderOpen] = useState(false);

  // Parse steps from spec content
  useEffect(() => {
    if (specContent) {
      const lines = specContent.split('\n');
      const parsedSteps: Step[] = [];
      let stepIndex = 1;

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('await page.') || trimmed.startsWith('page.')) {
          let description = trimmed;
          if (description.length > 60) {
            description = description.substring(0, 60) + '...';
          }
          parsedSteps.push({
            index: stepIndex++,
            description,
            line: index + 1,
            content: line, // Preserve original indentation
            originalContent: line,
          });
        }
      });

      setSteps(parsedSteps);
      setHasChanges(false);
    }
  }, [specContent]);

  // Load available locators
  const loadLocators = useCallback(async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        setAvailableLocators(response.locators);
      }
    } catch (error) {
      console.error('Failed to load locators:', error);
    }
  }, [workspacePath]);

  useEffect(() => {
    if (locatorPickerOpen) {
      loadLocators();
    }
  }, [locatorPickerOpen, loadLocators]);

  const handleEditStep = (step: Step) => {
    setEditingStep(step);
    setEditContent(step.content.trim());
  };

  const handleSaveEdit = async () => {
    if (!workspacePath || !editingStep) return;

    setSaving(true);
    try {
      const response = await ipc.test.updateSpec({
        workspacePath,
        testName,
        updates: [{
          line: editingStep.line,
          originalContent: editingStep.originalContent,
          newContent: editContent,
        }],
      });

      if (response.success) {
        // Update local state
        setSteps(steps.map(s => 
          s.line === editingStep.line 
            ? { ...s, content: editContent, originalContent: editContent, description: editContent.trim().substring(0, 60) }
            : s
        ));
        setEditingStep(null);
        setHasChanges(true);
        notifications.show({
          title: 'Step Updated',
          message: 'Step has been updated successfully.',
          color: 'green',
        });
        if (onSpecUpdate) {
          await onSpecUpdate();
        }
      } else {
        notifications.show({
          title: 'Update Failed',
          message: response.error || 'Failed to update step',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update step',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async (step: Step) => {
    if (!workspacePath) return;
    if (!confirm(`Delete step ${step.index}?`)) return;

    setSaving(true);
    try {
      const response = await ipc.test.deleteStep({
        workspacePath,
        testName,
        line: step.line,
      });

      if (response.success) {
        notifications.show({
          title: 'Step Deleted',
          message: 'Step has been deleted successfully.',
          color: 'green',
        });
        if (onSpecUpdate) {
          await onSpecUpdate();
        }
      } else {
        notifications.show({
          title: 'Delete Failed',
          message: response.error || 'Failed to delete step',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete step',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!workspacePath || !newStepContent.trim()) return;

    setSaving(true);
    try {
      const response = await ipc.test.addStep({
        workspacePath,
        testName,
        afterLine: newStepAfterLine,
        stepContent: newStepContent.trim(),
      });

      if (response.success) {
        notifications.show({
          title: 'Step Added',
          message: 'Step has been added successfully.',
          color: 'green',
        });
        setAddStepModalOpen(false);
        setNewStepContent('');
        setNewStepAfterLine(undefined);
        if (onSpecUpdate) {
          await onSpecUpdate();
        }
      } else {
        notifications.show({
          title: 'Add Failed',
          message: response.error || 'Failed to add step',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add step',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectLocator = (locator: LocatorIndexEntry) => {
    // Generate step code from locator
    const stepCode = `await ${locator.locator};`;
    setNewStepContent(stepCode);
    setLocatorPickerOpen(false);
  };

  return (
    <div>
      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Group>
            <Text fw={600} size="lg">Test Steps Editor</Text>
            {hasChanges && (
              <Badge color="orange" variant="light">Unsaved Changes</Badge>
            )}
          </Group>
          <Group>
            <Switch
              label="Edit Mode"
              checked={editMode}
              onChange={(e) => setEditMode(e.currentTarget.checked)}
            />
            {editMode && (
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => setAddStepModalOpen(true)}
                variant="light"
              >
                Add Step
              </Button>
            )}
            <Button
              leftSection={<Sparkles size={16} />}
              onClick={() => setVisualBuilderOpen(true)}
              variant="light"
              color="violet"
            >
              Visual Builder <Badge size="xs" ml="xs" color="violet">BETA</Badge>
            </Button>
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'steps')}>
          <Tabs.List>
            <Tabs.Tab value="steps" leftSection={<Code2 size={16} />}>
              Steps
            </Tabs.Tab>
            <Tabs.Tab value="preview" leftSection={<Eye size={16} />}>
              Code Preview
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="steps" pt="md">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <div style={{ flex: '0 0 400px' }}>
                <Text fw={600} mb="md">Test Steps</Text>
                {steps.length === 0 ? (
                  <Text c="dimmed">No steps found in spec file.</Text>
                ) : (
                  <ScrollArea h="calc(100vh - 400px)">
                    <Stack gap="xs">
                      {steps.map((step) => (
                        <Card
                          key={step.index}
                          padding="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            backgroundColor: selectedLine === step.line ? 'rgba(59, 130, 246, 0.1)' : undefined,
                          }}
                          onClick={() => setSelectedLine(step.line)}
                        >
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Group gap="xs" mb="xs">
                                <Badge variant="light" size="sm">
                                  Step {step.index}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                  Line {step.line}
                                </Text>
                              </Group>
                              <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
                                {step.description}
                              </Text>
                            </div>
                            {editMode && (
                              <Group gap="xs">
                                <Tooltip label="Edit">
                                  <ActionIcon
                                    variant="light"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditStep(step);
                                    }}
                                  >
                                    <Edit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete">
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteStep(step);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            )}
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </div>
              {specContent && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} mb="md">Code Preview</Text>
                  <ScrollArea h="calc(100vh - 400px)">
                    <Code block style={{
                      fontSize: '0.75rem',
                      background: '#1e1e1e',
                      padding: '16px',
                      borderRadius: '8px',
                    }}>
                      {specContent.split('\n').map((line, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: selectedLine === index + 1 ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                            padding: '2px 4px',
                            margin: selectedLine === index + 1 ? '2px 0' : '0',
                            borderRadius: selectedLine === index + 1 ? '4px' : '0',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          {line || ' '}
                        </div>
                      ))}
                    </Code>
                  </ScrollArea>
                </div>
              )}
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="preview" pt="md">
            {specContent && (
              <ScrollArea h="calc(100vh - 300px)">
                <Code block style={{
                  fontSize: '0.875rem',
                  background: '#1e1e1e',
                  padding: '16px',
                  borderRadius: '8px',
                }}>
                  {specContent}
                </Code>
              </ScrollArea>
            )}
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Edit Step Modal */}
      <Modal
        opened={!!editingStep}
        onClose={() => setEditingStep(null)}
        title="Edit Step"
        size="lg"
      >
        <Stack gap="md">
          <Textarea
            label="Step Code"
            value={editContent}
            onChange={(e) => setEditContent(e.currentTarget.value)}
            minRows={3}
            autosize
            styles={{ input: { fontFamily: 'monospace' } }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setEditingStep(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Step Modal */}
      <Modal
        opened={addStepModalOpen}
        onClose={() => {
          setAddStepModalOpen(false);
          setNewStepContent('');
          setNewStepAfterLine(undefined);
        }}
        title="Add New Step"
        size="lg"
      >
        <Stack gap="md">
          <Group>
            <TextInput
              label="Insert After Line"
              type="number"
              value={newStepAfterLine || ''}
              onChange={(e) => setNewStepAfterLine(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty to add at beginning"
              style={{ flex: 1 }}
            />
            <Button
              variant="light"
              onClick={() => setLocatorPickerOpen(true)}
              style={{ marginTop: '24px' }}
            >
              Pick from Locator Library
            </Button>
          </Group>
          <Textarea
            label="Step Code"
            value={newStepContent}
            onChange={(e) => setNewStepContent(e.currentTarget.value)}
            placeholder="await page.locator('#myId').click();"
            minRows={3}
            autosize
            styles={{ input: { fontFamily: 'monospace' } }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => {
              setAddStepModalOpen(false);
              setNewStepContent('');
              setNewStepAfterLine(undefined);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddStep} loading={saving} disabled={!newStepContent.trim()}>
              Add Step
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Locator Picker Modal */}
      <Modal
        opened={locatorPickerOpen}
        onClose={() => setLocatorPickerOpen(false)}
        title="Select Locator"
        size="xl"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a locator from your library to insert as a step
          </Text>
          <ScrollArea h={400}>
            <Stack gap="xs">
              {availableLocators.map((locator) => (
                <Card
                  key={`${locator.type}-${locator.locator}`}
                  padding="sm"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectLocator(locator)}
                >
                  <Group justify="space-between">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Badge variant="light" size="sm">{locator.type}</Badge>
                        {locator.status && (
                          <Badge
                            size="xs"
                            color={
                              locator.status.state === 'healthy' ? 'green' :
                              locator.status.state === 'warning' ? 'yellow' :
                              'red'
                            }
                          >
                            {locator.status.state}
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
                        {locator.locator}
                      </Text>
                      {locator.usedInTests.length > 0 && (
                        <Text size="xs" c="dimmed" mt="xs">
                          Used in {locator.usedInTests.length} test(s)
                        </Text>
                      )}
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>

      {/* Visual Test Builder (BETA) */}
      {workspacePath && (
        <VisualTestBuilder
          opened={visualBuilderOpen}
          onClose={() => setVisualBuilderOpen(false)}
          testName={testName}
          workspacePath={workspacePath}
          onStepsGenerated={async (steps) => {
            // Add all generated steps sequentially
            for (const step of steps) {
              const response = await ipc.test.addStep({
                workspacePath,
                testName,
                stepContent: step,
              });
              if (!response.success) {
                notifications.show({
                  title: 'Error Adding Step',
                  message: response.error || 'Failed to add step',
                  color: 'red',
                });
                return;
              }
            }
            if (onSpecUpdate) {
              await onSpecUpdate();
            }
            setVisualBuilderOpen(false);
            notifications.show({
              title: 'Steps Generated',
              message: `${steps.length} step(s) added to test`,
              color: 'green',
            });
          }}
        />
      )}
    </div>
  );
};

export default EnhancedStepsTab;

