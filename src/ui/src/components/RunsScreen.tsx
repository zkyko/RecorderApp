import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Group, Badge, Loader, Center, Table, TextInput, Select, Stack, Modal, Checkbox, Radio } from '@mantine/core';
import { PlayCircle, FileText, Eye, Filter, Play, Cloud } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta, TestSummary } from '../../../types/v1.5';
import RunModal from './RunModal';
import './RunsScreen.css';

const RunsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [allRuns, setAllRuns] = useState<TestRunMeta[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>(null);
  const [runModalOpened, setRunModalOpened] = useState(false);
  const [multiTestModalOpened, setMultiTestModalOpened] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [multiTestRunMode, setMultiTestRunMode] = useState<'local' | 'browserstack'>('local');

  useEffect(() => {
    if (workspacePath) {
      loadRuns();
      loadTests();
    }
  }, [workspacePath]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, sourceFilter, dateRange, allRuns]);

  const loadRuns = async () => {
    if (!workspacePath) return;
    
    setLoading(true);
    try {
      const response = await ipc.runs.list({ workspacePath });
      if (response.success && response.runs) {
        setAllRuns(response.runs);
        setRuns(response.runs);
      }
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allRuns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(run =>
        run.testName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(run => run.source === sourceFilter);
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let cutoffDate: Date;
      if (dateRange === '24h') {
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (dateRange === '7d') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        cutoffDate = new Date(0);
      }
      filtered = filtered.filter(run => new Date(run.startedAt) >= cutoffDate);
    }

    setRuns(filtered);
  };

  const handleRunTest = async (testName: string, mode: 'local' | 'browserstack', target?: string) => {
    if (!workspacePath) return;
    try {
      await ipc.test.run({
        workspacePath,
        specPath: `tests/${testName}.spec.ts`,
        runMode: mode,
        target,
      });
      // Reload runs after a short delay
      setTimeout(() => loadRuns(), 1000);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleRunSelectedTests = async () => {
    if (!workspacePath || selectedTests.size === 0) return;
    try {
      for (const testName of selectedTests) {
        await ipc.test.run({
          workspacePath,
          specPath: `tests/${testName}.spec.ts`,
          runMode: multiTestRunMode,
        });
      }
      setMultiTestModalOpened(false);
      setSelectedTests(new Set());
      setTimeout(() => loadRuns(), 2000);
    } catch (error) {
      console.error('Failed to run tests:', error);
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

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className="runs-screen">
      {/* Filters */}
      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={600}>Test Runs</Text>
          <Button
            leftSection={<Play size={16} />}
            onClick={() => setMultiTestModalOpened(true)}
            variant="light"
          >
            Run Tests
          </Button>
        </Group>
        <Group gap="md">
          <TextInput
            placeholder="Search by test name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="All Status"
            data={[
              { value: 'passed', label: 'Passed' },
              { value: 'failed', label: 'Failed' },
              { value: 'running', label: 'Running' },
              { value: 'skipped', label: 'Skipped' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder="All Source"
            data={[
              { value: 'local', label: 'Local' },
              { value: 'browserstack', label: 'BrowserStack' },
            ]}
            value={sourceFilter}
            onChange={setSourceFilter}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder="Date Range"
            data={[
              { value: '24h', label: 'Last 24h' },
              { value: '7d', label: 'Last 7d' },
            ]}
            value={dateRange}
            onChange={setDateRange}
            clearable
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      {runs.length === 0 ? (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">▶️</Text>
              <Text size="xl" fw={600} mb="xs">No runs found</Text>
              <Text c="dimmed" mb="lg">
                {searchQuery || statusFilter || sourceFilter || dateRange
                  ? 'Try adjusting your filters'
                  : 'Run tests from the Test Library to see execution history'}
              </Text>
              {!searchQuery && !statusFilter && !sourceFilter && !dateRange && (
                <Button
                  leftSection={<PlayCircle size={18} />}
                  onClick={() => navigate('/library')}
                  size="md"
                >
                  Go to Test Library
                </Button>
              )}
            </div>
          </Center>
        </Card>
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Test Name</Table.Th>
                <Table.Th>Run ID</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Source</Table.Th>
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
                      <Text fw={500} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tests/${run.testName}`)}>
                        {run.testName}
                      </Text>
                      <Text size="xs" c="dimmed">{run.specRelPath}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" c="dimmed">{run.runId.slice(0, 8)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(run.status)} size="sm">
                        {run.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={run.source === 'browserstack' ? 'blue' : 'gray'} size="sm">
                        {run.source?.toUpperCase() || 'LOCAL'}
                      </Badge>
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
                            leftSection={<Eye size={14} />}
                            variant="light"
                            size="xs"
                            onClick={() => navigate(`/trace/${run.testName}/${run.runId}`)}
                          >
                            Trace
                          </Button>
                        )}
                        {(run.allureReportPath || run.reportPath) && (
                          <Button
                            leftSection={<FileText size={14} />}
                            variant="light"
                            size="xs"
                            onClick={() => navigate(`/report/${run.testName}/${run.runId}`)}
                          >
                            Report
                          </Button>
                        )}
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => navigate(`/tests/${run.testName}`, { state: { initialTab: 'runs' } })}
                        >
                          Details
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Multi-Test Execution Modal */}
      <Modal
        opened={multiTestModalOpened}
        onClose={() => {
          setMultiTestModalOpened(false);
          setSelectedTests(new Set());
        }}
        title="Run Multiple Tests"
        size="lg"
      >
        <Stack gap="md">
          <Radio.Group
            label="Execution Mode"
            value={multiTestRunMode}
            onChange={(value) => setMultiTestRunMode(value as 'local' | 'browserstack')}
          >
            <Stack gap="xs" mt="xs">
              <Radio value="local" label="Local" leftSection={<Play size={16} />} />
              <Radio value="browserstack" label="BrowserStack" leftSection={<Cloud size={16} />} />
            </Stack>
          </Radio.Group>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Select Tests</Text>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  if (selectedTests.size === tests.length) {
                    setSelectedTests(new Set());
                  } else {
                    setSelectedTests(new Set(tests.map(t => t.testName)));
                  }
                }}
              >
                {selectedTests.size === tests.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Group>
            <Stack gap="xs" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {tests.map((test) => (
                <Checkbox
                  key={test.testName}
                  label={test.testName}
                  checked={selectedTests.has(test.testName)}
                  onChange={(e) => {
                    const newSet = new Set(selectedTests);
                    if (e.currentTarget.checked) {
                      newSet.add(test.testName);
                    } else {
                      newSet.delete(test.testName);
                    }
                    setSelectedTests(newSet);
                  }}
                />
              ))}
            </Stack>
          </div>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setMultiTestModalOpened(false);
                setSelectedTests(new Set());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRunSelectedTests}
              disabled={selectedTests.size === 0}
            >
              Run Selected ({selectedTests.size})
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default RunsScreen;
