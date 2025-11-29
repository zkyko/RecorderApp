import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, Text, Group, Button, TextInput, Select, Loader, Center, Badge } from '@mantine/core';
import { Play, Edit, FileText, Plus, Bug } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestSummary } from '../../../types/v1.5';
import RunModal from './RunModal';
import './TestLibrary.css';

const TestLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath, setCurrentTest } = useWorkspaceStore();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [runModalOpened, setRunModalOpened] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestSummary | null>(null);

  useEffect(() => {
    loadTests();
  }, [workspacePath]);

  // Listen for test status updates
  useEffect(() => {
    if (!window.electronAPI?.onTestUpdate) return;

    const handleTestUpdate = (data: { workspacePath: string; testName: string; status: 'passed' | 'failed'; lastRunAt: string; lastRunId: string }) => {
      // Only refresh if the update is for the current workspace
      if (data.workspacePath === workspacePath) {
        loadTests();
      }
    };

    window.electronAPI.onTestUpdate(handleTestUpdate);

    return () => {
      if (window.electronAPI?.removeTestUpdateListener) {
        window.electronAPI.removeTestUpdateListener();
      }
    };
  }, [workspacePath]);

  const loadTests = async () => {
    if (!workspacePath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
        
        // Load runs to check which tests have traces
        const runsResponse = await ipc.runs.list({ workspacePath });
        if (runsResponse.success && runsResponse.runs) {
          const testsWithTracesSet = new Set<string>();
          runsResponse.runs.forEach(run => {
            if (run.tracePaths && run.tracePaths.length > 0) {
              testsWithTracesSet.add(run.testName);
            }
          });
          setTestsWithTraces(testsWithTracesSet);
        }
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = (test: TestSummary) => {
    setSelectedTest(test);
    setRunModalOpened(true);
  };

  const handleRun = async (mode: 'local' | 'browserstack', target?: string, selectedDataIndices?: number[]) => {
    if (!selectedTest || !workspacePath) return;
    try {
      // Load data rows to get IDs for selected indices
      let datasetFilterIds: string[] | undefined;
      if (selectedDataIndices && selectedDataIndices.length > 0) {
        const dataResponse = await ipc.data.read({ workspacePath, testName: selectedTest.testName });
        if (dataResponse.success && dataResponse.rows) {
          const enabledRows = dataResponse.rows.filter((row: any) => row.enabled !== false);
          datasetFilterIds = selectedDataIndices
            .map(index => enabledRows[index]?.id)
            .filter((id): id is string => !!id);
        }
      }

      await ipc.test.run({
        workspacePath,
        specPath: selectedTest.specPath,
        runMode: mode,
        target,
        datasetFilterIds, // Pass selected data row IDs
      });
      navigate(`/runs/${selectedTest.testName}`);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleEditData = (test: TestSummary) => {
    setCurrentTest(test.testName);
    navigate(`/tests/${test.testName}`, { state: { initialTab: 'data' } });
  };

  const handleOpenTrace = (test: TestSummary) => {
    navigate(`/tests/${test.testName}`, { state: { initialTab: 'runs' } });
  };

  const handleViewTest = (test: TestSummary) => {
    navigate(`/tests/${test.testName}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchQuery || test.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !moduleFilter || test.module === moduleFilter;
    const matchesStatus = !statusFilter || test.lastStatus === statusFilter;
    return matchesSearch && matchesModule && matchesStatus;
  });

  const modules = Array.from(new Set(tests.map(t => t.module).filter(Boolean)));

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className="test-library">
      <Card padding="lg" radius="md" withBorder mb="md">
        <Group gap="md" mb="md">
          <TextInput
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="All Modules"
            data={modules.map(m => ({ value: m, label: m }))}
            value={moduleFilter}
            onChange={setModuleFilter}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder="All Status"
            data={[
              { value: 'passed', label: 'Passed' },
              { value: 'failed', label: 'Failed' },
              { value: 'never_run', label: 'Never Run' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      {filteredTests.length === 0 ? (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">📚</Text>
              <Text size="xl" fw={600} mb="xs">No tests found</Text>
              <Text c="dimmed" mb="lg">
                {searchQuery || moduleFilter || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Record a new test to get started'}
              </Text>
              {!searchQuery && !moduleFilter && !statusFilter && (
                <Button
                  leftSection={<Plus size={18} />}
                  onClick={() => navigate('/record')}
                  size="md"
                >
                  Record Your First Test
                </Button>
              )}
            </div>
          </Center>
        </Card>
      ) : (
        <Grid gutter="md">
          {filteredTests.map((test) => (
            <Grid.Col key={test.testName} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card 
                padding="lg" 
                radius="md" 
                withBorder 
                className="test-card"
                onClick={() => handleViewTest(test)}
                style={{ cursor: 'pointer' }}
              >
                <Group justify="space-between" mb="md">
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="lg" mb={4}>{test.testName}</Text>
                    {test.module && (
                      <Badge size="sm" variant="light" mb={4}>
                        {test.module}
                      </Badge>
                    )}
                  </div>
                  <Badge color={getStatusColor(test.lastStatus)} size="sm">
                    {test.lastStatus}
                  </Badge>
                </Group>
                <Group gap="xs" mb="md">
                  <Text size="sm" c="dimmed">Datasets:</Text>
                  <Text size="sm" fw={500}>{test.datasetCount}</Text>
                  <Text size="sm" c="dimmed">•</Text>
                  <Text size="sm" c="dimmed">
                    {test.lastRunAt ? new Date(test.lastRunAt).toLocaleDateString() : 'Never run'}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Button
                    leftSection={<Play size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunClick(test);
                    }}
                    size="xs"
                    variant="filled"
                    style={{ flex: 1 }}
                  >
                    Run
                  </Button>
                  <Button
                    leftSection={<Edit size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditData(test);
                    }}
                    size="xs"
                    variant="light"
                    style={{ flex: 1 }}
                  >
                    Data
                  </Button>
                  <Button
                    leftSection={<FileText size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTest(test);
                    }}
                    size="xs"
                    variant="subtle"
                    style={{ flex: 1 }}
                  >
                    View
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      <RunModal
        opened={runModalOpened}
        onClose={() => {
          setRunModalOpened(false);
          setSelectedTest(null);
        }}
        onRun={handleRun}
        testName={selectedTest?.testName}
        workspacePath={workspacePath}
      />
    </div>
  );
};

export default TestLibrary;
