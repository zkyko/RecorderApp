import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Text,
  Group,
  Button,
  TextInput,
  Stack,
  Badge,
  Alert,
  Loader,
  Pagination,
  Select,
} from '@mantine/core';
import { Cloud, ExternalLink, RefreshCw, Search, Eye } from 'lucide-react';
import { ipc } from '../ipc';

interface TestCase {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  caseType?: string;
  owner?: string;
  tags?: string[];
  automationStatus?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

const BrowserStackTMTestCasesList: React.FC = () => {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const loadTestCases = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ipc.browserstackTm.listTestCases({
        page,
        pageSize,
      });

      if (result.success && result.testCases) {
        let filtered = result.testCases;
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filtered = filtered.filter(tc => 
            tc.status?.toLowerCase() === statusFilter.toLowerCase()
          );
        }
        
        // Apply priority filter
        if (priorityFilter !== 'all') {
          filtered = filtered.filter(tc => 
            tc.priority?.toLowerCase() === priorityFilter.toLowerCase()
          );
        }
        
        setTestCases(filtered);
        setTotal(result.total || 0);
        setHasMore(result.hasMore || false);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to load test cases');
        setTestCases([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BrowserStack TM test cases');
      setTestCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases(1);
  }, [statusFilter, priorityFilter]);

  const handleRefresh = () => {
    loadTestCases(currentPage);
  };

  const handleOpenInBrowserStack = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active')) {
      return 'green';
    }
    if (lowerStatus.includes('draft')) {
      return 'yellow';
    }
    if (lowerStatus.includes('archived') || lowerStatus.includes('inactive')) {
      return 'gray';
    }
    return 'blue';
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

  const getAutomationColor = (automationStatus?: string) => {
    if (!automationStatus) return 'gray';
    const lowerStatus = automationStatus.toLowerCase();
    if (lowerStatus.includes('automated')) {
      return 'green';
    }
    if (lowerStatus.includes('not_automated')) {
      return 'orange';
    }
    return 'gray';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <Stack gap="md">
        <Card>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Group>
                <Cloud size={24} />
                <div>
                  <Text fw={600} size="lg">BrowserStack Test Management</Text>
                  <Text size="sm" c="dimmed">
                    {total > 0 ? `Showing ${testCases.length} of ${total} test cases` : 'No test cases found'}
                  </Text>
                </div>
              </Group>
              <Button
                leftSection={<RefreshCw size={16} />}
                onClick={handleRefresh}
                variant="light"
                loading={loading}
              >
                Refresh
              </Button>
            </Group>

            <Group grow>
              <Select
                label="Status Filter"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || 'all')}
                data={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Archived', label: 'Archived' },
                ]}
                style={{ maxWidth: 200 }}
              />
              <Select
                label="Priority Filter"
                value={priorityFilter}
                onChange={(value) => setPriorityFilter(value || 'all')}
                data={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                style={{ maxWidth: 200 }}
              />
            </Group>

            {error && (
              <Alert color="red" icon={<Cloud size={16} />}>
                {error}
              </Alert>
            )}
          </Stack>
        </Card>

        <Card>
          {loading && testCases.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size="lg" />
            </div>
          ) : testCases.length === 0 ? (
            <Alert color="blue" icon={<Cloud size={16} />}>
              No test cases found. Try adjusting your filters.
            </Alert>
          ) : (
            <Stack gap="md">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Identifier</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Automation</Table.Th>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Updated</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {testCases.map((testCase) => (
                    <Table.Tr key={testCase.id}>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {testCase.identifier}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>
                          {testCase.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="gray" size="sm">
                          {testCase.caseType || 'N/A'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(testCase.status)} size="sm">
                          {testCase.status || 'N/A'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getPriorityColor(testCase.priority)} size="sm">
                          {testCase.priority || 'N/A'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getAutomationColor(testCase.automationStatus)} size="sm">
                          {testCase.automationStatus?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {testCase.owner || 'Unassigned'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatDate(testCase.updatedAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<Eye size={14} />}
                            onClick={() => navigate(`/browserstack-tm/test-cases/${testCase.identifier}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<ExternalLink size={14} />}
                            onClick={() => handleOpenInBrowserStack(testCase.url)}
                          >
                            Open
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    value={currentPage}
                    onChange={(page) => loadTestCases(page)}
                    total={totalPages}
                  />
                </Group>
              )}
            </Stack>
          )}
        </Card>
      </Stack>
    </div>
  );
};

export default BrowserStackTMTestCasesList;

