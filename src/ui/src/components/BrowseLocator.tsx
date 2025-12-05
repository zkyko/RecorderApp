import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Card,
  Badge,
  ScrollArea,
  TextInput,
  Alert,
  Code,
  Select,
  Center,
} from '@mantine/core';
import {
  Save,
  Info,
  Crosshair,
} from 'lucide-react';
import { ipc } from '../ipc';
import { getBackend } from '../ipc-backend';
import { useWorkspaceStore } from '../store/workspace-store';
import { notifications } from '../utils/notifications';

interface LocatorEvaluation {
  locator: {
    strategy: string;
    [key: string]: any;
  };
  quality: {
    score: number;
    level: 'excellent' | 'good' | 'medium' | 'poor' | 'weak';
    reason: string;
  };
  uniqueness: {
    isUnique: boolean;
    matchCount: number;
    score: number;
  };
  usability: {
    score: number;
    level: 'excellent' | 'good' | 'medium' | 'poor';
    recommendation: string;
  };
}

interface ElementInfo {
  tag: string;
  id?: string;
  classes?: string;
  text?: string;
  ariaLabel?: string;
  title?: string;
}

interface BrowseLocatorProps {
  opened: boolean;
  onClose: () => void;
}

const BrowseLocator: React.FC<BrowseLocatorProps> = ({ opened, onClose }) => {
  const { workspacePath } = useWorkspaceStore();
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [clickedElements, setClickedElements] = useState<Array<{
    elementInfo: ElementInfo;
    evaluation: LocatorEvaluation;
    timestamp: number;
  }>>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [locatorName, setLocatorName] = useState('');
  const [locatorType, setLocatorType] = useState<string>('css');
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState('');
  const [d365Url, setD365Url] = useState<string>('');
  const [storageStatePath, setStorageStatePath] = useState<string>('');

  useEffect(() => {
    if (opened && workspacePath) {
      // Load config to get D365 URL and storage state
      const loadConfig = async () => {
        try {
          const backend = getBackend();
          const config = await backend?.getConfig();
          if (config) {
            if (config.d365Url) {
              setD365Url(config.d365Url);
              // Set URL to D365 URL by default if empty
              if (!url) {
                setUrl(config.d365Url);
              }
            }
            if (config.storageStatePath) {
              setStorageStatePath(config.storageStatePath);
            }
          }
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      };
      loadConfig();

      // Set up event listener for clicked elements
      console.log('[BrowseLocator] Setting up clickedElements listener');
      ipc.locatorBrowse.onClickedElements((elements) => {
        console.log('[BrowseLocator] Received clickedElements:', elements?.length || 0, elements);
        setClickedElements(elements || []);
      });
    }

    return () => {
      if (opened) {
        ipc.locatorBrowse.removeListeners();
      }
    };
  }, [opened, workspacePath]);

  const handleStart = async () => {
    if (!workspacePath) {
      notifications.show({
        title: 'Error',
        message: 'Workspace path not available',
        color: 'red',
      });
      return;
    }

    try {
      // Use D365 URL if URL is empty, otherwise use provided URL
      const targetUrl = url.trim() || d365Url;
      
      if (!targetUrl) {
        notifications.show({
          title: 'D365 URL Required',
          message: 'Please configure D365 URL in Settings or enter a URL',
          color: 'orange',
        });
        return;
      }

      const response = await ipc.locatorBrowse.start({
        workspacePath,
        storageStatePath: storageStatePath || undefined,
        url: targetUrl,
      });

      if (response.success) {
        setIsBrowsing(true);
        // Clear any previous elements
        setClickedElements([]);
        setSelectedElementIndex(null);
        console.log('[BrowseLocator] Browser started, waiting for clicks...');
        notifications.show({
          title: 'Browser Started',
          message: 'Click elements in D365 to capture them. The last 5 will appear below.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Failed to Start',
          message: response.error || 'Failed to start browser',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to start browser',
        color: 'red',
      });
    }
  };

  const handleStop = async () => {
    try {
      const response = await ipc.locatorBrowse.stop();
      if (response.success) {
        setIsBrowsing(false);
        setClickedElements([]);
        setSelectedElementIndex(null);
        setLocatorName('');
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to stop browser',
        color: 'red',
      });
    }
  };

  const handleSelectElement = (index: number) => {
    setSelectedElementIndex(index);
    const element = clickedElements[index];
    if (element) {
      const name = element.elementInfo.ariaLabel || 
                  element.elementInfo.text?.substring(0, 30) || 
                  element.elementInfo.title ||
                  `${element.elementInfo.tag} element`;
      setLocatorName(name);
      setLocatorType(element.evaluation.locator.strategy || 'css');
    }
  };

  const handleSave = async () => {
    if (!workspacePath || selectedElementIndex === null || !locatorName.trim()) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please select an element and provide a locator name',
        color: 'orange',
      });
      return;
    }

    const selectedElement = clickedElements[selectedElementIndex];
    if (!selectedElement) return;

    setSaving(true);
    try {
      // Convert evaluation locator to locator snippet
      const locator = selectedElement.evaluation.locator;
      let locatorSnippet = '';

      switch (locator.strategy) {
        case 'd365-controlname':
          locatorSnippet = `page.locator('[data-dyn-controlname="${locator.controlName}"]')`;
          break;
        case 'role':
          locatorSnippet = `page.getByRole('${locator.role}', { name: '${locator.name}' })`;
          break;
        case 'label':
          locatorSnippet = `page.getByLabel('${locator.text}')`;
          break;
        case 'placeholder':
          locatorSnippet = `page.getByPlaceholder('${locator.text}')`;
          break;
        case 'text':
          locatorSnippet = `page.getByText('${locator.text}', { exact: ${locator.exact || false} })`;
          break;
        case 'testid':
          locatorSnippet = `page.getByTestId('${locator.value}')`;
          break;
        case 'css':
          locatorSnippet = `page.locator('${locator.selector}')`;
          break;
        case 'xpath':
          locatorSnippet = `page.locator('${locator.expression}')`;
          break;
        default:
          locatorSnippet = `page.locator('body')`;
      }

      const response = await ipc.workspace.locatorsAdd({
        workspacePath,
        locator: locatorSnippet,
        type: locatorType as any,
        tests: [],
      });

      if (response.success) {
        notifications.show({
          title: 'Locator Saved',
          message: 'Locator has been added to your library',
          color: 'green',
        });
        setSelectedElementIndex(null);
        setLocatorName('');
      } else {
        notifications.show({
          title: 'Save Failed',
          message: response.error || 'Failed to save locator',
          color: 'red',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save locator',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'medium': return 'yellow';
      case 'poor': return 'orange';
      case 'weak': return 'red';
      default: return 'gray';
    }
  };

  const formatLocator = (locator: any): string => {
    switch (locator.strategy) {
      case 'd365-controlname':
        return `page.locator('[data-dyn-controlname="${locator.controlName}"]')`;
      case 'role':
        return `page.getByRole('${locator.role}', { name: '${locator.name}' })`;
      case 'label':
        return `page.getByLabel('${locator.text}')`;
      case 'placeholder':
        return `page.getByPlaceholder('${locator.text}')`;
      case 'text':
        return `page.getByText('${locator.text}', { exact: ${locator.exact || false} })`;
      case 'testid':
        return `page.getByTestId('${locator.value}')`;
      case 'css':
        return `page.locator('${locator.selector}')`;
      case 'xpath':
        return `page.locator('${locator.expression}')`;
      default:
        return 'Unknown locator';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (isBrowsing) {
          handleStop();
        }
        onClose();
      }}
      title={
        <Group>
          <Crosshair size={20} />
          <Text>Browse Locator</Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        {!isBrowsing ? (
          <Stack gap="md">
            <Alert icon={<Info size={16} />} color="blue">
              Open a browser instance to capture locators. Click elements in D365 as you browse - the last 5 clicked elements will appear in the side panel for you to save.
            </Alert>
            <TextInput
              label="URL"
              placeholder={d365Url || "Enter URL or leave empty to use D365 URL from Settings"}
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              description={d365Url ? `Default: ${d365Url}` : 'Configure D365 URL in Settings'}
            />
            <Button
              leftSection={<Crosshair size={16} />}
              onClick={handleStart}
              fullWidth
            >
              Start Browser
            </Button>
          </Stack>
        ) : (
          <>
            <Alert icon={<Info size={16} />} color="green">
              Browser is running. Click elements in D365 to capture them. The last 5 clicked elements will appear below.
            </Alert>

            <Group justify="space-between">
              <Text fw={600}>Last 5 Clicked Elements</Text>
              <Button variant="light" color="red" size="sm" onClick={handleStop}>
                Stop Browser
              </Button>
            </Group>

            {/* Clicked Elements List */}
            {clickedElements.length === 0 ? (
              <Card padding="xl" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <Crosshair size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" ta="center">
                      Click elements in the browser to capture them
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      The last 5 clicked elements will appear here
                    </Text>
                  </Stack>
                </Center>
              </Card>
            ) : (
              <ScrollArea h={400}>
                <Stack gap="xs">
                  {clickedElements.map((item, index) => (
                    <Card
                      key={index}
                      padding="md"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedElementIndex === index ? 'var(--mantine-color-blue-6)' : undefined,
                        backgroundColor: selectedElementIndex === index ? 'var(--mantine-color-blue-0)' : undefined,
                      }}
                      onClick={() => handleSelectElement(index)}
                    >
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Badge size="sm" variant="light">
                              #{index + 1}
                            </Badge>
                            <Badge size="sm" variant="light">
                              {item.elementInfo.tag}
                            </Badge>
                            <Badge
                              color={getLevelColor(item.evaluation.usability.level)}
                              size="sm"
                            >
                              {item.evaluation.usability.score}/100
                            </Badge>
                            {item.evaluation.uniqueness.isUnique && (
                              <Badge color="green" size="xs">Unique</Badge>
                            )}
                          </Group>
                          {item.elementInfo.text && (
                            <Text size="sm" mb="xs" fw={500}>
                              {item.elementInfo.text.substring(0, 50)}
                              {item.elementInfo.text.length > 50 ? '...' : ''}
                            </Text>
                          )}
                          {item.elementInfo.ariaLabel && (
                            <Text size="xs" c="dimmed" mb="xs">
                              Label: {item.elementInfo.ariaLabel}
                            </Text>
                          )}
                          <Code block style={{ fontSize: '0.7rem', marginTop: '8px' }}>
                            {formatLocator(item.evaluation.locator)}
                          </Code>
                        </div>
                        {selectedElementIndex === index && (
                          <Badge color="blue" size="lg">Selected</Badge>
                        )}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            )}

            {/* Selected Element - Ready to Save */}
            {selectedElementIndex !== null && clickedElements[selectedElementIndex] && (
              <Card padding="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-6)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600} size="lg">Save Locator</Text>
                    <Badge color="blue" size="lg">Ready to Save</Badge>
                  </Group>

                  <TextInput
                    label="Locator Name"
                    placeholder="Enter a name for this locator"
                    value={locatorName}
                    onChange={(e) => setLocatorName(e.currentTarget.value)}
                    required
                  />

                  <Select
                    label="Locator Type"
                    data={[
                      { value: 'css', label: 'CSS' },
                      { value: 'role', label: 'Role' },
                      { value: 'label', label: 'Label' },
                      { value: 'text', label: 'Text' },
                      { value: 'testid', label: 'Test ID' },
                      { value: 'd365-controlname', label: 'D365 Control Name' },
                      { value: 'placeholder', label: 'Placeholder' },
                    ]}
                    value={locatorType}
                    onChange={(value) => setLocatorType(value || 'css')}
                  />

                  <Code block style={{ fontSize: '0.75rem' }}>
                    {formatLocator(clickedElements[selectedElementIndex].evaluation.locator)}
                  </Code>

                  <Group justify="space-between" mt="md">
                    <Badge
                      color={getLevelColor(clickedElements[selectedElementIndex].evaluation.usability.level)}
                      size="lg"
                    >
                      {clickedElements[selectedElementIndex].evaluation.usability.score}/100
                    </Badge>
                    <Group>
                      <Button variant="light" onClick={() => {
                        setSelectedElementIndex(null);
                        setLocatorName('');
                      }}>
                        Cancel
                      </Button>
                      <Button
                        leftSection={<Save size={16} />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={!locatorName.trim()}
                      >
                        Save to Library
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            )}

          </>
        )}
      </Stack>
    </Modal>
  );
};

export default BrowseLocator;

