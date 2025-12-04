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
import { Bug, ExternalLink, RefreshCw, Search, Eye } from 'lucide-react';
import { ipc } from '../ipc';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  issueType: string;
  assignee?: string;
  created: string;
  updated: string;
  url: string;
}

const JiraIssuesList: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jql, setJql] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadIssues = async (page: number = 1, customJql?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build JQL query
      let query = customJql || jql;
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all' && !query.includes('status')) {
        if (query) {
          query = `${query} AND status = "${statusFilter}"`;
        } else {
          query = `status = "${statusFilter}"`;
        }
      }

      const startAt = (page - 1) * pageSize;
      const result = await ipc.jira.searchIssues({
        jql: query || undefined, // Empty string becomes undefined, which triggers default JQL
        maxResults: pageSize,
        startAt,
      });

      if (result.success && result.issues) {
        setIssues(result.issues);
        setTotal(result.total || 0);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to load issues');
        setIssues([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load JIRA issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues(1);
  }, [statusFilter]);

  const handleSearch = () => {
    loadIssues(1, jql);
  };

  const handleRefresh = () => {
    loadIssues(currentPage);
  };

  const handleOpenInJira = (url: string) => {
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

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('done') || lowerStatus.includes('resolved') || lowerStatus.includes('closed')) {
      return 'green';
    }
    if (lowerStatus.includes('in progress') || lowerStatus.includes('testing')) {
      return 'blue';
    }
    if (lowerStatus.includes('to do') || lowerStatus.includes('open')) {
      return 'gray';
    }
    if (lowerStatus.includes('blocked') || lowerStatus.includes('rejected')) {
      return 'red';
    }
    return 'yellow';
  };

  const getIssueTypeColor = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes('bug')) {
      return 'red';
    }
    if (lowerType.includes('task')) {
      return 'blue';
    }
    if (lowerType.includes('story')) {
      return 'green';
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
                <Bug size={24} />
                <div>
                  <Text fw={600} size="lg">JIRA Issues</Text>
                  <Text size="sm" c="dimmed">
                    {total > 0 ? `Showing ${issues.length} of ${total} issues` : 'No issues found'}
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
              <TextInput
                placeholder="Enter JQL query (e.g., project = QST AND status = 'In Progress')"
                value={jql}
                onChange={(e) => setJql(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                leftSection={<Search size={16} />}
                rightSection={
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={handleSearch}
                    loading={loading}
                  >
                    Search
                  </Button>
                }
              />
              <Select
                label="Status Filter"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || 'all')}
                data={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'To Do', label: 'To Do' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Done', label: 'Done' },
                  { value: 'Resolved', label: 'Resolved' },
                ]}
                style={{ maxWidth: 200 }}
              />
            </Group>

            {error && (
              <Alert color="red" icon={<Bug size={16} />}>
                {error}
              </Alert>
            )}
          </Stack>
        </Card>

        <Card>
          {loading && issues.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size="lg" />
            </div>
          ) : issues.length === 0 ? (
            <Alert color="blue" icon={<Bug size={16} />}>
              No issues found. Try adjusting your search query or filters.
            </Alert>
          ) : (
            <Stack gap="md">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Key</Table.Th>
                    <Table.Th>Summary</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Assignee</Table.Th>
                    <Table.Th>Updated</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {issues.map((issue) => (
                    <Table.Tr key={issue.key}>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {issue.key}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>
                          {issue.summary}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getIssueTypeColor(issue.issueType)} size="sm">
                          {issue.issueType}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(issue.status)} size="sm">
                          {issue.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {issue.assignee || 'Unassigned'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatDate(issue.updated)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<Eye size={14} />}
                            onClick={() => navigate(`/jira/issues/${issue.key}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<ExternalLink size={14} />}
                            onClick={() => handleOpenInJira(issue.url)}
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
                    onChange={(page) => loadIssues(page)}
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

export default JiraIssuesList;

