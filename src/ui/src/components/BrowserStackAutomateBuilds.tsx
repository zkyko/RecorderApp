import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Alert,
  Loader,
  Select,
  TextInput,
} from '@mantine/core';
import { Cloud, ExternalLink, RefreshCw, Eye, Search } from 'lucide-react';
import { ipc } from '../ipc';

interface Build {
  name: string;
  hashedId: string;
  duration: number;
  status: string;
  buildTag: string | null;
  publicUrl: string;
}

const BrowserStackAutomateBuilds: React.FC = () => {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBuilds();
  }, [statusFilter]);

  const loadBuilds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ipc.browserstackAutomate.getBuilds({
        limit: 100,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (result.success && result.builds) {
        setBuilds(result.builds);
      } else {
        setError(result.error || 'Failed to load builds');
        setBuilds([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BrowserStack Automate builds');
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'done') {
      return 'green';
    }
    if (lowerStatus === 'running') {
      return 'blue';
    }
    if (lowerStatus === 'failed') {
      return 'red';
    }
    if (lowerStatus === 'timeout') {
      return 'orange';
    }
    return 'gray';
  };

  const filteredBuilds = builds.filter(build => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      build.name?.toLowerCase().includes(query) ||
      build.hashedId?.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <Stack gap="md">
        <Card>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Cloud size={24} />
              <div>
                <Text fw={600} size="lg">BrowserStack Automate Builds</Text>
                <Text size="sm" c="dimmed">
                  {filteredBuilds.length > 0 ? `Showing ${filteredBuilds.length} builds` : 'No builds found'}
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<RefreshCw size={16} />}
              onClick={loadBuilds}
              variant="light"
              loading={loading}
            >
              Refresh
            </Button>
          </Group>

          <Group mt="md">
            <TextInput
              placeholder="Search builds..."
              leftSection={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'all')}
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'running', label: 'Running' },
                { value: 'done', label: 'Done' },
                { value: 'failed', label: 'Failed' },
                { value: 'timeout', label: 'Timeout' },
              ]}
              style={{ width: 200 }}
            />
          </Group>

          {error && (
            <Alert color="red" icon={<Cloud size={16} />} mt="md">
              {error}
            </Alert>
          )}
        </Card>

        <Card>
          {loading && builds.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size="lg" />
            </div>
          ) : filteredBuilds.length === 0 ? (
            <Alert color="blue" icon={<Cloud size={16} />}>
              No builds found. Try adjusting your filters.
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Tag</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredBuilds.map((build) => (
                  <Table.Tr key={build.hashedId}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {build.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {build.hashedId.substring(0, 16)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(build.status)} size="sm">
                        {build.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDuration(build.duration)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {build.buildTag ? (
                        <Badge variant="light" size="sm">
                          {build.buildTag}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<Eye size={14} />}
                          onClick={() => navigate(`/browserstack-automate/builds/${build.hashedId}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<ExternalLink size={14} />}
                          onClick={() => window.open(build.publicUrl, '_blank')}
                        >
                          Open
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>
    </div>
  );
};

export default BrowserStackAutomateBuilds;

