import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Alert,
  Loader,
  Tabs,
  Divider,
  Paper,
  Table,
} from '@mantine/core';
import { Cloud, ArrowLeft, ExternalLink, RefreshCw, Play } from 'lucide-react';
import { ipc } from '../ipc';
import { notifications } from '@mantine/notifications';

const BrowserStackTMTestCaseDetails: React.FC = () => {
  const { testCaseId } = useParams<{ testCaseId: string }>();
  const navigate = useNavigate();
  const [testCase, setTestCase] = useState<any>(null);
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  useEffect(() => {
    if (testCaseId) {
      loadTestCase();
      loadTestRuns();
    }
  }, [testCaseId]);

  const loadTestCase = async () => {
    if (!testCaseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.browserstackTm.getTestCase(testCaseId);
      if (result.success && result.testCase) {
        setTestCase(result.testCase);
      } else {
        setError(result.error || 'Failed to load test case');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test case');
    } finally {
      setLoading(false);
    }
  };

  const loadTestRuns = async () => {
    if (!testCaseId) return;
    
    try {
      const result = await ipc.browserstackTm.listTestRuns({
        testCaseId,
        page: 1,
        pageSize: 50,
      });
      if (result.success && result.testRuns) {
        setTestRuns(result.testRuns);
      }
    } catch (err: any) {
      console.error('Failed to load test runs:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'passed') {
      return 'green';
    }
    if (lowerStatus === 'failed') {
      return 'red';
    }
    if (lowerStatus === 'skipped') {
      return 'yellow';
    }
    return 'gray';
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'gray';
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('high')) {
      return 'red';
    }
    if (lowerPriority.includes('medium')) {
      return 'yellow';
    }
    if (lowerPriority.includes('low')) {
      return 'blue';
    }
    return 'gray';
  };

  if (loading && !testCase) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error && !testCase) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert color="red" icon={<Cloud size={16} />}>
          {error}
        </Alert>
        <Button mt="md" onClick={() => navigate('/browserstack-tm')}>
          Back to Test Cases
        </Button>
      </div>
    );
  }

  if (!testCase) {
    return null;
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <Stack gap="md">
        {/* Header */}
        <Card>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Button
                variant="subtle"
                leftSection={<ArrowLeft size={16} />}
                onClick={() => navigate('/browserstack-tm')}
              >
                Back
              </Button>
              <div>
                <Group gap="xs" mb="xs">
                  <Text fw={700} size="xl">
                    {testCase.identifier}
                  </Text>
                  <Badge color={getStatusColor(testCase.status)}>{testCase.status || 'N/A'}</Badge>
                  <Badge color={getPriorityColor(testCase.priority)}>{testCase.priority || 'N/A'}</Badge>
                  <Badge color="gray">{testCase.caseType || 'N/A'}</Badge>
                </Group>
                <Text fw={500} size="lg">
                  {testCase.name}
                </Text>
              </div>
            </Group>
            <Group>
              <Button
                variant="light"
                leftSection={<RefreshCw size={16} />}
                onClick={loadTestCase}
              >
                Refresh
              </Button>
              <Button
                variant="light"
                leftSection={<ExternalLink size={16} />}
                onClick={() => window.open(testCase.url, '_blank')}
              >
                Open in BrowserStack
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')}>
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="test-runs">Test Runs ({testRuns.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Card>
              <Stack gap="md">
                {testCase.description && (
                  <div>
                    <Text size="sm" fw={500} mb={4}>Description</Text>
                    <Paper p="md" withBorder>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {testCase.description.replace(/<[^>]*>/g, '') || 'No description provided'}
                      </Text>
                    </Paper>
                  </div>
                )}

                {testCase.preconditions && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Preconditions</Text>
                      <Paper p="md" withBorder>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {testCase.preconditions.replace(/<[^>]*>/g, '')}
                        </Text>
                      </Paper>
                    </div>
                  </>
                )}

                {testCase.steps && testCase.steps.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Test Steps</Text>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: '50px' }}>#</Table.Th>
                            <Table.Th>Step</Table.Th>
                            <Table.Th>Expected Result</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {testCase.steps.map((step: any, index: number) => (
                            <Table.Tr key={index}>
                              <Table.Td>
                                <Text size="sm" fw={500}>{index + 1}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                  {typeof step.step === 'string' ? step.step.replace(/<[^>]*>/g, '') : step.step}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                  {typeof step.result === 'string' ? step.result.replace(/<[^>]*>/g, '') : step.result}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                  </>
                )}

                <Divider />

                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Owner</Text>
                    <Text size="sm" c="dimmed">{testCase.owner || 'Unassigned'}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Automation Status</Text>
                    <Badge color={testCase.automationStatus?.includes('automated') ? 'green' : 'orange'}>
                      {testCase.automationStatus?.replace('_', ' ') || 'Not Automated'}
                    </Badge>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Template</Text>
                    <Text size="sm" c="dimmed">{testCase.template || 'N/A'}</Text>
                  </div>
                </Group>

                <Divider />

                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Created</Text>
                    <Text size="sm" c="dimmed">{formatDate(testCase.createdAt)}</Text>
                    {testCase.createdBy && (
                      <Text size="xs" c="dimmed">by {testCase.createdBy}</Text>
                    )}
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Updated</Text>
                    <Text size="sm" c="dimmed">{formatDate(testCase.updatedAt)}</Text>
                    {testCase.updatedBy && (
                      <Text size="xs" c="dimmed">by {testCase.updatedBy}</Text>
                    )}
                  </div>
                </Group>

                {testCase.tags && testCase.tags.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Tags</Text>
                      <Group gap="xs">
                        {testCase.tags.map((tag: string) => (
                          <Badge key={tag} variant="light">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                    </div>
                  </>
                )}

                {testCase.issues && testCase.issues.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Linked Issues</Text>
                      <Group gap="xs">
                        {testCase.issues.map((issue: string) => (
                          <Badge key={issue} color="blue" variant="light">
                            {issue}
                          </Badge>
                        ))}
                      </Group>
                    </div>
                  </>
                )}

                {testCase.customFields && testCase.customFields.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Custom Fields</Text>
                      <Table>
                        <Table.Tbody>
                          {testCase.customFields.map((field: any, index: number) => (
                            <Table.Tr key={index}>
                              <Table.Td>
                                <Text size="sm" fw={500}>{field.name}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{field.value || 'N/A'}</Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                  </>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="test-runs" pt="md">
            {testRuns.length === 0 ? (
              <Card>
                <Text c="dimmed" ta="center">No test runs found for this test case</Text>
              </Card>
            ) : (
              <Card>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>Error</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {testRuns.map((run) => (
                      <Table.Tr key={run.id}>
                        <Table.Td>
                          <Text size="sm" fw={600}>{run.identifier || run.id}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(run.status)} size="sm">
                            {run.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDuration(run.duration)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {run.error || 'N/A'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {formatDate(run.createdAt)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<ExternalLink size={14} />}
                            onClick={() => window.open(run.url, '_blank')}
                          >
                            Open
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default BrowserStackTMTestCaseDetails;

