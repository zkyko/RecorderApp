import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  Tabs,
  Loader,
  Center,
  Table,
  Breadcrumbs,
  Anchor,
  Code,
  ScrollArea,
  Timeline,
  TextInput,
  Checkbox,
  Stack,
  ActionIcon,
  Tooltip,
  Alert,
  Drawer,
} from '@mantine/core';
import {
  Play,
  FileText,
  Eye,
  ArrowLeft,
  Download,
  Upload,
  Plus,
  Copy,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestSummary, TestMeta, TestRunMeta, DataRow, LocatorInfo } from '../../../types/v1.5';
import RunModal from './RunModal';
import TestDetailsLocatorsTab from './TestDetailsLocatorsTab';
import DebugChatPanel from './DebugChatPanel';
import './TestDetailsScreen.css';

const TestDetailsScreen: React.FC = () => {
  const { testName } = useParams<{ testName: string }>();
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [testMeta, setTestMeta] = useState<TestMeta | null>(null);
  const [specContent, setSpecContent] = useState<string | null>(null);
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [locators, setLocators] = useState<LocatorInfo[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [runModalOpened, setRunModalOpened] = useState(false);
  const [chatDrawerOpened, setChatDrawerOpened] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (testName && workspacePath) {
      loadTestData();
    }
  }, [testName, workspacePath]);

  // Listen for test status updates
  useEffect(() => {
    if (!window.electronAPI?.onTestUpdate || !testName || !workspacePath) return;

    const handleTestUpdate = (data: { workspacePath: string; testName: string; status: 'passed' | 'failed'; lastRunAt: string; lastRunId: string }) => {
      // Only refresh if the update is for the current test and workspace
      if (data.workspacePath === workspacePath && data.testName === testName) {
        loadTestData();
      }
    };

    window.electronAPI.onTestUpdate(handleTestUpdate);

    return () => {
      if (window.electronAPI?.removeTestUpdateListener) {
        window.electronAPI.removeTestUpdateListener();
      }
    };
  }, [testName, workspacePath]);

  const loadTestData = async () => {
    if (!testName || !workspacePath) return;

    setLoading(true);
    try {
      // Load test summary
      const testsResponse = await ipc.workspace.testsList({ workspacePath });
      const test = testsResponse.tests?.find(t => t.testName === testName);
      if (test) {
        setTestSummary(test);
        
        // Load metadata if available
        if (test.metaPath) {
          try {
            // Try to load meta file, but construct from summary if it fails
            const metaContent = await window.electronAPI?.loadTestData?.(test.metaPath);
            if (metaContent?.success && metaContent.data) {
              setTestMeta(metaContent.data);
            } else {
              // Fallback: construct meta from summary
              setTestMeta({
                testName: test.testName,
                module: test.module,
                tags: test.tags,
                createdAt: new Date().toISOString(),
                lastRunAt: test.lastRunAt,
                lastStatus: test.lastStatus,
              });
            }
          } catch (e) {
            console.error('Failed to load meta:', e);
            // Fallback: construct meta from summary
            setTestMeta({
              testName: test.testName,
              module: test.module,
              tags: test.tags,
              createdAt: new Date().toISOString(),
              lastRunAt: test.lastRunAt,
              lastStatus: test.lastStatus,
            });
          }
        } else {
          // No meta file, construct from summary
          setTestMeta({
            testName: test.testName,
            module: test.module,
            tags: test.tags,
            createdAt: new Date().toISOString(),
            lastRunAt: test.lastRunAt,
            lastStatus: test.lastStatus,
          });
        }
      }

      // Load spec content
      const specResponse = await ipc.test.getSpec({ workspacePath, testName });
      if (specResponse.success && specResponse.content) {
        setSpecContent(specResponse.content);
      }

      // Load runs
      const runsResponse = await ipc.runs.list({ workspacePath, testName });
      if (runsResponse.success && runsResponse.runs) {
        setRuns(runsResponse.runs);
      }

      // Load data
      const dataResponse = await ipc.data.read({ workspacePath, testName });
      if (dataResponse.success && dataResponse.rows) {
        setDataRows(dataResponse.rows);
      }

      // Load locators
      const locatorsResponse = await ipc.test.parseLocators({ workspacePath, testName });
      if (locatorsResponse.success && locatorsResponse.locators) {
        setLocators(locatorsResponse.locators);
      }
    } catch (error) {
      console.error('Failed to load test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  const handleRun = async (mode: 'local' | 'browserstack', target?: string, selectedDataIndices?: number[]) => {
    if (!testName || !workspacePath) return;
    try {
      // Load data rows to get IDs for selected indices
      let datasetFilterIds: string[] | undefined;
      if (selectedDataIndices && selectedDataIndices.length > 0 && dataRows.length > 0) {
        const enabledRows = dataRows.filter((row: any) => row.enabled !== false);
        datasetFilterIds = selectedDataIndices
          .map(index => enabledRows[index]?.id)
          .filter((id): id is string => !!id);
      }

      await ipc.test.run({
        workspacePath,
        specPath: `tests/${testName}.spec.ts`,
        runMode: mode,
        target,
        datasetFilterIds, // Pass selected data row IDs
      });
      // Reload runs
      setTimeout(() => {
        const runsResponse = ipc.runs.list({ workspacePath, testName });
        runsResponse.then(response => {
          if (response.success && response.runs) {
            setRuns(response.runs);
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleOpenTrace = async () => {
    if (!workspacePath || runs.length === 0 || !runs[0].tracePaths || runs[0].tracePaths.length === 0) return;
    await ipc.trace.openWindow({
      workspacePath,
      traceZipPath: runs[0].tracePaths[0],
    });
  };

  const handleRegenerate = async () => {
    if (!testName || !workspacePath || !specContent) {
      alert('Cannot regenerate: Spec content not loaded.');
      return;
    }

    setRegenerating(true);
    try {
      // Extract parameters from dataRows (all keys except id, enabled, name)
      const parameterKeys = new Set<string>();
      dataRows.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key !== 'id' && key !== 'enabled' && key !== 'name') {
            parameterKeys.add(key);
          }
        });
      });

      // Convert parameter keys to SelectedParam format
      // Use the key as both id and variableName (since we don't have the original detection IDs)
      const selectedParams = Array.from(parameterKeys).map(key => ({
        id: key, // Use key as ID since we don't have original detection IDs
        variableName: key,
      }));

      // Regenerate the spec using current content and parameters
      const response = await ipc.spec.write({
        workspacePath,
        testName,
        module: testMeta?.module,
        cleanedCode: specContent,
        selectedParams,
      });

      if (response.success) {
        // Reload the spec content to show the updated version
        const specResponse = await ipc.test.getSpec({ workspacePath, testName });
        if (specResponse.success && specResponse.content) {
          setSpecContent(specResponse.content);
        }
        alert('Spec file regenerated successfully.');
      } else {
        alert(`Failed to regenerate spec: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error regenerating spec: ${error.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!testSummary) {
    return (
      <div className="test-details-screen">
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={600} mb="xs">Test not found</Text>
              <Text c="dimmed" mb="lg">The test "{testName}" could not be found.</Text>
              <Button leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/library')}>
                Back to Test Library
              </Button>
            </div>
          </Center>
        </Card>
      </div>
    );
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Test Library', href: '/library' },
    { title: testName || 'Test' },
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
    <div className="test-details-screen">
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      {/* Header */}
      <Card padding="lg" radius="md" withBorder mb="md" className="test-details-header">
        <Group justify="space-between" mb="md">
          <div>
            <Group gap="md" mb="xs">
              <Text size="xl" fw={700}>{testSummary.testName}</Text>
              {testSummary.module && (
                <Badge variant="light" size="lg">{testSummary.module}</Badge>
              )}
              <Badge color={getStatusColor(testSummary.lastStatus)} size="lg">
                {testSummary.lastStatus === 'never_run' ? 'Never run' : testSummary.lastStatus}
              </Badge>
            </Group>
            {testMeta && (
              <Text size="sm" c="dimmed">
                Created: {new Date(testMeta.createdAt).toLocaleDateString()}
                {testMeta.updatedAt && ` • Updated: ${new Date(testMeta.updatedAt).toLocaleDateString()}`}
              </Text>
            )}
          </div>
          <Group gap="xs">
            {testSummary.lastStatus === 'failed' && (
              <Button
                leftSection={<Sparkles size={16} />}
                onClick={() => setChatDrawerOpened(true)}
                variant="light"
                color="blue"
              >
                ✨ Diagnose with AI
              </Button>
            )}
            <Tooltip label="Re-generate the spec file using the latest generator logic.">
              <Button
                leftSection={<RefreshCw size={16} />}
                onClick={handleRegenerate}
                variant="light"
                loading={regenerating}
                disabled={!specContent || regenerating}
              >
                Regenerate
              </Button>
            </Tooltip>
            <Button
              leftSection={<Play size={16} />}
              onClick={() => setRunModalOpened(true)}
              variant="filled"
            >
              Run Test
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="locators">Locators</Tabs.Tab>
          <Tabs.Tab value="data">Data</Tabs.Tab>
          <Tabs.Tab value="steps">Steps</Tabs.Tab>
          <Tabs.Tab value="runs">Runs</Tabs.Tab>
          <Tabs.Tab value="export">Export</Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="md">
          <Card padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <div>
                <Text fw={600} mb="xs">Basic Information</Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td><Text fw={500}>Test Name</Text></Table.Td>
                      <Table.Td>{testSummary.testName}</Table.Td>
                    </Table.Tr>
                    {testSummary.module && (
                      <Table.Tr>
                        <Table.Td><Text fw={500}>Module</Text></Table.Td>
                        <Table.Td>{testSummary.module}</Table.Td>
                      </Table.Tr>
                    )}
                    {testMeta?.tags && testMeta.tags.length > 0 && (
                      <Table.Tr>
                        <Table.Td><Text fw={500}>Tags</Text></Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {testMeta.tags.map(tag => (
                              <Badge key={tag} size="sm">{tag}</Badge>
                            ))}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    {testMeta?.createdAt && (
                      <Table.Tr>
                        <Table.Td><Text fw={500}>Created At</Text></Table.Td>
                        <Table.Td>{new Date(testMeta.createdAt).toLocaleString()}</Table.Td>
                      </Table.Tr>
                    )}
                    {testMeta?.updatedAt && (
                      <Table.Tr>
                        <Table.Td><Text fw={500}>Updated At</Text></Table.Td>
                        <Table.Td>{new Date(testMeta.updatedAt).toLocaleString()}</Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </div>

              <div>
                <Text fw={600} mb="xs">Statistics</Text>
                <Group gap="xl">
                  <div>
                    <Text size="sm" c="dimmed">Datasets</Text>
                    <Text size="xl" fw={700}>{testSummary.datasetCount}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Last Run Status</Text>
                    <Badge color={getStatusColor(testSummary.lastStatus)} size="lg">
                      {testSummary.lastStatus === 'never_run' ? 'Never run' : testSummary.lastStatus}
                    </Badge>
                  </div>
                  {runs.length > 0 && runs[0].finishedAt && runs[0].startedAt && (
                    <div>
                      <Text size="sm" c="dimmed">Last Run Duration</Text>
                      <Text size="xl" fw={700}>
                        {Math.round((new Date(runs[0].finishedAt).getTime() - new Date(runs[0].startedAt).getTime()) / 1000)}s
                      </Text>
                    </div>
                  )}
                </Group>
              </div>

              <div>
                <Text fw={600} mb="xs">Quick Actions</Text>
                <Group gap="xs">
                  {testSummary.lastStatus === 'failed' && (
                    <Button
                      leftSection={<Sparkles size={16} />}
                      onClick={() => setChatDrawerOpened(true)}
                      variant="light"
                      color="blue"
                    >
                      ✨ Diagnose with AI
                    </Button>
                  )}
                  <Button leftSection={<Play size={16} />} onClick={() => setRunModalOpened(true)}>
                    Run Test
                  </Button>
                  {runs.length > 0 && runs[0].tracePaths && runs[0].tracePaths.length > 0 && (
                    <Button leftSection={<Eye size={16} />} onClick={handleOpenTrace} variant="light">
                      Open Trace
                    </Button>
                  )}
                </Group>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Locators Tab */}
        <Tabs.Panel value="locators" pt="md">
          <TestDetailsLocatorsTab
            locators={locators}
            testName={testName!}
            workspacePath={workspacePath!}
            onLocatorUpdate={loadTestData}
          />
        </Tabs.Panel>

        {/* Data Tab */}
        <Tabs.Panel value="data" pt="md">
          <DataTab
            testName={testName!}
            workspacePath={workspacePath!}
            dataRows={dataRows}
            onDataChange={setDataRows}
            onReload={loadTestData}
          />
        </Tabs.Panel>

        {/* Steps Tab */}
        <Tabs.Panel value="steps" pt="md">
          <StepsTab specContent={specContent} />
        </Tabs.Panel>

        {/* Runs Tab */}
        <Tabs.Panel value="runs" pt="md">
          <RunsTab runs={runs} testName={testName!} />
        </Tabs.Panel>

        {/* Export Tab */}
        <Tabs.Panel value="export" pt="md">
          <ExportTab testName={testName!} workspacePath={workspacePath!} />
        </Tabs.Panel>
      </Tabs>

      <RunModal
        opened={runModalOpened}
        onClose={() => setRunModalOpened(false)}
        onRun={handleRun}
        testName={testName || undefined}
        workspacePath={workspacePath || undefined}
        dataRows={dataRows}
      />

      <Drawer
        opened={chatDrawerOpened}
        onClose={() => setChatDrawerOpened(false)}
        title="AI Debug Assistant"
        size="xl"
        position="right"
      >
        {testName && workspacePath && (
          <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            <DebugChatPanel
              testName={testName}
              workspacePath={workspacePath}
              onClose={() => setChatDrawerOpened(false)}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

// Data Tab Component
const DataTab: React.FC<{
  testName: string;
  workspacePath: string;
  dataRows: DataRow[];
  onDataChange: (rows: DataRow[]) => void;
  onReload: () => void;
}> = ({ testName, workspacePath, dataRows, onDataChange, onReload }) => {
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all unique keys from all rows, excluding 'id' (internal use only)
  const getAllKeys = () => {
    const keys = new Set<string>();
    dataRows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'id') { // Always exclude 'id' from visible columns
          keys.add(key);
        }
      });
    });
    return Array.from(keys);
  };

  const allKeys = getAllKeys();
  
  // Separate special columns from dynamic parameter columns
  const specialColumns = ['enabled', 'name'];
  const dynamicColumns = allKeys.filter(k => !specialColumns.includes(k));
  
  // Order: enabled (checkbox), name (Scenario Name), then dynamic columns
  const visibleColumns = ['enabled', 'name', ...dynamicColumns];
  
  // Helper to format column header
  const formatColumnHeader = (col: string): string => {
    if (col === 'name') return 'Scenario Name';
    if (col === 'enabled') return ''; // Empty header for checkbox column
    // Format dynamic columns: vendorAccount -> Vendor Account
    return col
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await ipc.data.write({ workspacePath, testName, rows: dataRows });
      if (response.success) {
        // Show success notification (can use Mantine notifications later)
        alert('Data saved successfully');
      } else {
        alert(`Failed to save: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRow = () => {
    // Get all parameter keys from existing rows (excluding id, enabled, name)
    const parameterKeys = new Set<string>();
    dataRows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'id' && key !== 'enabled' && key !== 'name') {
          parameterKeys.add(key);
        }
      });
    });
    
    const newRow: DataRow = {
      id: Date.now().toString(),
      enabled: true,
      name: `Scenario ${dataRows.length + 1}`,
      // Initialize all parameter columns with empty strings
      ...Array.from(parameterKeys).reduce((acc, key) => ({ ...acc, [key]: '' }), {}),
    };
    onDataChange([...dataRows, newRow]);
  };

  const handleDuplicateRow = (row: DataRow) => {
    const newRow: DataRow = {
      ...row,
      id: Date.now().toString(),
      name: `${row.name} (Copy)`,
    };
    onDataChange([...dataRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    onDataChange(dataRows.filter(r => r.id !== id));
  };

  const handleCellChange = (rowId: string, key: string, value: any) => {
    onDataChange(dataRows.map(row =>
      row.id === rowId ? { ...row, [key]: value } : row
    ));
  };

  const handleImportExcel = async () => {
    try {
      const response = await ipc.data.importExcel({ workspacePath, testName });
      if (response.success) {
        alert('Excel import stubbed. JSON generation will be implemented later.');
        onReload();
      } else {
        alert(`Failed to import: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(dataRows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>Test Data</Text>
        <Group gap="xs">
          <Button leftSection={<Upload size={16} />} variant="light" onClick={handleImportExcel}>
            Import Excel
          </Button>
          <Button leftSection={<Download size={16} />} variant="light" onClick={handleExportJSON}>
            Export JSON
          </Button>
          <Button leftSection={<Plus size={16} />} variant="light" onClick={handleAddRow}>
            Add Row
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </Group>
      </Group>

      {dataRows.length === 0 ? (
        <Alert color="blue" title="No data rows">
          <Text size="sm" mb="md">No data rows yet. Add your first row to get started.</Text>
          <Button leftSection={<Plus size={16} />} onClick={handleAddRow}>
            Add Row
          </Button>
        </Alert>
      ) : (
        <ScrollArea>
          <Table>
            <Table.Thead>
              <Table.Tr>
                {visibleColumns.map(col => (
                  <Table.Th key={col}>{formatColumnHeader(col)}</Table.Th>
                ))}
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dataRows.map((row) => (
                <Table.Tr key={row.id}>
                  {visibleColumns.map(col => (
                    <Table.Td key={col}>
                      {col === 'enabled' ? (
                        <Checkbox
                          checked={row.enabled ?? true}
                          onChange={(e) => handleCellChange(row.id, col, e.currentTarget.checked)}
                        />
                      ) : (
                        <TextInput
                          value={row[col] || ''}
                          onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                          size="xs"
                          placeholder={col === 'name' ? 'Enter scenario name' : `Enter ${formatColumnHeader(col).toLowerCase()}`}
                        />
                      )}
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Duplicate">
                        <ActionIcon size="sm" variant="subtle" onClick={() => handleDuplicateRow(row)}>
                          <Copy size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDeleteRow(row.id)}>
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Card>
  );
};

// Steps Tab Component
const StepsTab: React.FC<{ specContent: string | null }> = ({ specContent }) => {
  const [steps, setSteps] = useState<Array<{ index: number; description: string; line: number }>>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  useEffect(() => {
    if (specContent) {
      const lines = specContent.split('\n');
      const parsedSteps: Array<{ index: number; description: string; line: number }> = [];
      let stepIndex = 1;

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('await page.')) {
          // Extract a short description
          let description = trimmed;
          if (description.length > 60) {
            description = description.substring(0, 60) + '...';
          }
          parsedSteps.push({
            index: stepIndex++,
            description,
            line: index + 1,
          });
        }
      });

      setSteps(parsedSteps);
    }
  }, [specContent]);

  return (
    <Card padding="lg" radius="md" withBorder>
      <Group gap="md" align="flex-start" wrap="nowrap">
        <div style={{ flex: '0 0 400px', maxHeight: 'calc(100vh - 300px)' }}>
          <Text fw={600} mb="md">Test Steps</Text>
          {steps.length === 0 ? (
            <Text c="dimmed">No steps found in spec file.</Text>
          ) : (
            <ScrollArea h="calc(100vh - 350px)">
              <Timeline active={selectedLine || -1} bulletSize={24} lineWidth={2}>
                {steps.map((step) => (
                  <Timeline.Item
                    key={step.index}
                    bullet={step.index}
                    title={`Step ${step.index}`}
                    onClick={() => setSelectedLine(step.line)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Text size="sm" c="dimmed">{step.description}</Text>
                    <Text size="xs" c="dimmed">Line {step.line}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </ScrollArea>
          )}
        </div>
        {specContent && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} mb="md">Code Preview</Text>
            <ScrollArea h="calc(100vh - 350px)">
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
    </Card>
  );
};

// Runs Tab Component
const RunsTab: React.FC<{ runs: TestRunMeta[]; testName: string }> = ({ runs, testName }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Card padding="lg" radius="md" withBorder>
      {runs.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">No runs found for this test.</Text>
        </Center>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Run ID</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Started At</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runs.map((run) => {
              const duration = run.finishedAt && run.startedAt
                ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                : null;

              return (
                <Table.Tr key={run.runId}>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">{run.runId.slice(0, 8)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(run.status)}>{run.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(run.startedAt).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    {duration !== null ? (
                      <Text size="sm">{duration}s</Text>
                    ) : (
                      <Text size="sm" c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {run.tracePaths && run.tracePaths.length > 0 && (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<Eye size={14} />}
                          onClick={() => navigate(`/trace/${testName}/${run.runId}`)}
                        >
                          Trace
                        </Button>
                      )}
                      {(run.allureReportPath || run.reportPath) && (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<FileText size={14} />}
                          onClick={() => navigate(`/report/${testName}/${run.runId}`)}
                        >
                          Report
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
};

// Export Tab Component
const ExportTab: React.FC<{ testName: string; workspacePath: string }> = ({ testName, workspacePath }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportBundle = async () => {
    setExporting(true);
    try {
      const response = await ipc.test.exportBundle({ workspacePath, testName });
      if (response.success) {
        alert(`Test bundle exported successfully! (Stub: ${response.bundlePath})`);
      } else {
        alert(`Failed to export: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={600}>Export Test Bundle</Text>
        <Text size="sm" c="dimmed">
          Export this test as a bundle containing the spec file, data file, and metadata.
        </Text>
        <Button
          leftSection={<Download size={16} />}
          onClick={handleExportBundle}
          loading={exporting}
        >
          Export Test Bundle
        </Button>
        <Alert color="blue" title="Coming Soon">
          Full bundle export functionality will be implemented in a future update.
        </Alert>
      </Stack>
    </Card>
  );
};

export default TestDetailsScreen;

