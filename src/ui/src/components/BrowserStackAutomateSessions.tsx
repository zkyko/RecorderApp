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

interface Session {
  name: string;
  duration: number;
  os: string;
  osVersion: string;
  browserVersion: string | null;
  browser: string | null;
  device: string | null;
  status: string;
  hashedId: string;
  reason: string;
  buildName: string;
  projectName: string;
  testPriority: string | null;
  logs: string;
  browserUrl: string;
  publicUrl: string;
  appiumLogsUrl: string;
  videoUrl: string;
  browserConsoleLogsUrl: string;
  harLogsUrl: string;
  seleniumLogsUrl: string;
  seleniumTelemetryLogsUrl?: string;
}

const BrowserStackAutomateSessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildId, setBuildId] = useState<string>('');

  useEffect(() => {
    if (buildId) {
      loadSessions();
    }
  }, [buildId, statusFilter]);

  const loadSessions = async () => {
    if (!buildId) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await ipc.browserstackAutomate.getBuildSessions({
        buildId,
        limit: 100,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (result.success && result.sessions) {
        setSessions(result.sessions);
      } else {
        setError(result.error || 'Failed to load sessions');
        setSessions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BrowserStack Automate sessions');
      setSessions([]);
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
    if (lowerStatus === 'done' || lowerStatus === 'passed') {
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

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.name?.toLowerCase().includes(query) ||
      session.hashedId?.toLowerCase().includes(query) ||
      session.buildName?.toLowerCase().includes(query) ||
      session.projectName?.toLowerCase().includes(query)
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
                <Text fw={600} size="lg">BrowserStack Automate Sessions</Text>
                <Text size="sm" c="dimmed">
                  {filteredSessions.length > 0 ? `Showing ${filteredSessions.length} sessions` : 'No sessions found'}
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<RefreshCw size={16} />}
              onClick={loadSessions}
              variant="light"
              loading={loading}
              disabled={!buildId}
            >
              Refresh
            </Button>
          </Group>

          <Group mt="md">
            <TextInput
              placeholder="Enter Build ID to view sessions..."
              value={buildId}
              onChange={(e) => setBuildId(e.target.value)}
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Search sessions..."
              leftSection={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
              disabled={!buildId}
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
              disabled={!buildId}
            />
          </Group>

          {error && (
            <Alert color="red" icon={<Cloud size={16} />} mt="md">
              {error}
            </Alert>
          )}

          {!buildId && (
            <Alert color="blue" icon={<Cloud size={16} />} mt="md">
              Enter a Build ID above to view sessions for that build.
            </Alert>
          )}
        </Card>

        <Card>
          {loading && sessions.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size="lg" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <Alert color="blue" icon={<Cloud size={16} />}>
              {buildId ? 'No sessions found. Try adjusting your filters.' : 'Enter a Build ID to view sessions.'}
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>OS / Browser</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Build</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredSessions.map((session) => (
                  <Table.Tr key={session.hashedId}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {session.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {session.hashedId.substring(0, 16)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.os} {session.osVersion}
                      </Text>
                      {session.browser && (
                        <Text size="xs" c="dimmed">
                          {session.browser} {session.browserVersion || ''}
                        </Text>
                      )}
                      {session.device && (
                        <Text size="xs" c="dimmed">
                          {session.device}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(session.status)} size="sm">
                        {session.status}
                      </Badge>
                      {session.reason && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {session.reason}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDuration(session.duration)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{session.buildName}</Text>
                      <Text size="xs" c="dimmed">
                        {session.projectName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<Eye size={14} />}
                          onClick={() => navigate(`/browserstack-automate/sessions/${session.hashedId}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<ExternalLink size={14} />}
                          onClick={() => window.open(session.publicUrl || session.browserUrl, '_blank')}
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

export default BrowserStackAutomateSessions;

