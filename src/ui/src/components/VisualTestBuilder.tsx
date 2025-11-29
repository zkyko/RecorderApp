import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Card,
  Badge,
  ScrollArea,
  Select,
  TextInput,
  Textarea,
  ActionIcon,
  Tooltip,
  Alert,
  Divider,
  Code,
} from '@mantine/core';
import {
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  GripVertical,
  Play,
} from 'lucide-react';
import { ipc } from '../ipc';
import { LocatorIndexEntry } from '../../../types/v1.5';
import { notifications } from '@mantine/notifications';

interface VisualStep {
  id: string;
  action: 'click' | 'fill' | 'select' | 'check' | 'uncheck' | 'goto' | 'wait';
  locator?: LocatorIndexEntry;
  locatorString?: string;
  value?: string;
  generatedCode: string;
}

interface VisualTestBuilderProps {
  opened: boolean;
  onClose: () => void;
  testName?: string; // Optional for Record screen
  workspacePath: string;
  onStepsGenerated?: (steps: string[]) => void; // Optional - if not provided, will navigate to step editor
}

const VisualTestBuilder: React.FC<VisualTestBuilderProps> = ({
  opened,
  onClose,
  testName,
  workspacePath,
  onStepsGenerated,
}) => {
  const navigate = useNavigate();
  const [availableLocators, setAvailableLocators] = useState<LocatorIndexEntry[]>([]);
  const [visualSteps, setVisualSteps] = useState<VisualStep[]>([]);
  const [selectedLocator, setSelectedLocator] = useState<LocatorIndexEntry | null>(null);
  const [selectedAction, setSelectedAction] = useState<VisualStep['action']>('click');
  const [stepValue, setStepValue] = useState('');
  const [customLocator, setCustomLocator] = useState('');
  const [useCustomLocator, setUseCustomLocator] = useState(false);
  const [previewCode, setPreviewCode] = useState('');

  useEffect(() => {
    if (opened && workspacePath) {
      loadLocators();
    }
  }, [opened, workspacePath]);

  useEffect(() => {
    // Generate preview code from visual steps
    const code = visualSteps.map(step => step.generatedCode).join('\n');
    setPreviewCode(code);
  }, [visualSteps]);

  const loadLocators = async () => {
    try {
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        setAvailableLocators(response.locators);
      }
    } catch (error) {
      console.error('Failed to load locators:', error);
    }
  };

  const generateStepCode = (
    action: VisualStep['action'],
    locator: LocatorIndexEntry | string | null,
    value?: string
  ): string => {
    const locatorStr = typeof locator === 'string' ? locator : locator?.locator || '';
    
    switch (action) {
      case 'click':
        return `await ${locatorStr}.click();`;
      case 'fill':
        return `await ${locatorStr}.fill('${value || ''}');`;
      case 'select':
        return `await ${locatorStr}.selectOption('${value || ''}');`;
      case 'check':
        return `await ${locatorStr}.check();`;
      case 'uncheck':
        return `await ${locatorStr}.uncheck();`;
      case 'goto':
        return `await page.goto('${value || ''}');`;
      case 'wait':
        return `await ${locatorStr}.waitFor();`;
      default:
        return `await ${locatorStr};`;
    }
  };

  const handleAddStep = () => {
    const locator = useCustomLocator ? customLocator : selectedLocator;
    if (!locator) {
      notifications.show({
        title: 'Missing Locator',
        message: 'Please select a locator or enter a custom locator',
        color: 'orange',
      });
      return;
    }

    const generatedCode = generateStepCode(selectedAction, locator, stepValue);
    const newStep: VisualStep = {
      id: `step-${Date.now()}-${Math.random()}`,
      action: selectedAction,
      locator: typeof locator === 'object' ? locator : undefined,
      locatorString: typeof locator === 'string' ? locator : locator.locator,
      value: stepValue || undefined,
      generatedCode,
    };

    setVisualSteps([...visualSteps, newStep]);
    setSelectedLocator(null);
    setStepValue('');
    setCustomLocator('');
    setUseCustomLocator(false);
  };

  const handleRemoveStep = (id: string) => {
    setVisualSteps(visualSteps.filter(step => step.id !== id));
  };

  const handleGenerate = () => {
    if (visualSteps.length === 0) {
      notifications.show({
        title: 'No Steps',
        message: 'Please add at least one step',
        color: 'orange',
      });
      return;
    }

    // Generate the raw code from visual steps
    // Wrap in a basic test structure so it can be processed by step editor
    const stepCode = visualSteps.map(step => step.generatedCode).join('\n');
    const rawCode = `import { test } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n${stepCode.split('\n').map(line => '  ' + line).join('\n')}\n});`;
    
    // For Visual Builder, we'll skip the step editor and go directly to locator cleanup
    // This is simpler and follows the same flow (the step editor is mainly for editing recorded steps)
    // If user wants to edit, they can do it in the code view

    // If testName is provided (from test details), use onStepsGenerated callback
    // Otherwise, navigate to step editor (from Record screen)
    if (testName && onStepsGenerated) {
      const steps = visualSteps.map(step => step.generatedCode);
      onStepsGenerated(steps);
      setVisualSteps([]);
      setPreviewCode('');
      onClose();
    } else {
      // Navigate to step editor with the generated code
      // Step editor can work with just rawCode - user can edit if needed, then continue
      navigate('/record/step-editor', {
        state: {
          rawCode: rawCode,
          steps: [], // Empty steps - step editor will work with rawCode
          fromVisualBuilder: true, // Flag to indicate this came from visual builder
        }
      });
      setVisualSteps([]);
      setPreviewCode('');
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Text>Visual Test Builder</Text>
          <Badge color="violet" variant="light">BETA</Badge>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        <Alert icon={<AlertCircle size={16} />} color="violet" title="Beta Feature">
          Build test steps visually by selecting locators and actions. Steps will be added to your test spec file.
        </Alert>

        <Group align="flex-start" gap="md">
          {/* Left: Step Builder */}
          <div style={{ flex: 1 }}>
            <Text fw={600} mb="md">Build Steps</Text>
            <Stack gap="md">
              <Select
                label="Action"
                data={[
                  { value: 'click', label: 'Click' },
                  { value: 'fill', label: 'Fill' },
                  { value: 'select', label: 'Select Option' },
                  { value: 'check', label: 'Check' },
                  { value: 'uncheck', label: 'Uncheck' },
                  { value: 'goto', label: 'Navigate (goto)' },
                  { value: 'wait', label: 'Wait For' },
                ]}
                value={selectedAction}
                onChange={(value) => setSelectedAction(value as VisualStep['action'])}
              />

              <div>
                <Group mb="xs">
                  <Text size="sm" fw={500}>Locator</Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => setUseCustomLocator(!useCustomLocator)}
                  >
                    {useCustomLocator ? 'Use Library' : 'Use Custom'}
                  </Button>
                </Group>
                {useCustomLocator ? (
                  <Textarea
                    placeholder="page.locator('#myId')"
                    value={customLocator}
                    onChange={(e) => setCustomLocator(e.currentTarget.value)}
                    minRows={2}
                    styles={{ input: { fontFamily: 'monospace' } }}
                  />
                ) : (
                  <Select
                    placeholder="Select from library"
                    data={availableLocators.map(loc => ({
                      value: loc.locator,
                      label: `${loc.type}: ${loc.locator.substring(0, 50)}${loc.locator.length > 50 ? '...' : ''}`,
                    }))}
                    value={selectedLocator?.locator || null}
                    onChange={(value) => {
                      const loc = availableLocators.find(l => l.locator === value);
                      setSelectedLocator(loc || null);
                    }}
                    searchable
                  />
                )}
              </div>

              {(selectedAction === 'fill' || selectedAction === 'select' || selectedAction === 'goto') && (
                <TextInput
                  label={selectedAction === 'goto' ? 'URL' : 'Value'}
                  placeholder={selectedAction === 'goto' ? 'https://example.com' : 'Enter value...'}
                  value={stepValue}
                  onChange={(e) => setStepValue(e.currentTarget.value)}
                />
              )}

              <Button
                leftSection={<Plus size={16} />}
                onClick={handleAddStep}
                disabled={!selectedLocator && !customLocator}
              >
                Add Step
              </Button>
            </Stack>

            <Divider my="md" />

            <Text fw={600} mb="md">Steps ({visualSteps.length})</Text>
            <ScrollArea h={200}>
              <Stack gap="xs">
                {visualSteps.length === 0 ? (
                  <Text size="sm" c="dimmed">No steps added yet</Text>
                ) : (
                  visualSteps.map((step, index) => (
                    <Card key={step.id} padding="sm" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Badge size="sm" variant="light">
                              {index + 1}
                            </Badge>
                            <Badge size="xs" variant="light">
                              {step.action}
                            </Badge>
                          </Group>
                          <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
                            {step.generatedCode}
                          </Text>
                        </div>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleRemoveStep(step.id)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))
                )}
              </Stack>
            </ScrollArea>
          </div>

          {/* Right: Preview */}
          <div style={{ flex: 1 }}>
            <Text fw={600} mb="md">Code Preview</Text>
            <ScrollArea h={400}>
              <Code block style={{
                fontSize: '0.75rem',
                background: '#1e1e1e',
                padding: '16px',
                borderRadius: '8px',
                minHeight: '200px',
              }}>
                {previewCode || '// Steps will appear here...'}
              </Code>
            </ScrollArea>
          </div>
        </Group>

        <Divider />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<Play size={16} />}
            onClick={handleGenerate}
            disabled={visualSteps.length === 0}
          >
            Generate & Add to Test
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default VisualTestBuilder;

