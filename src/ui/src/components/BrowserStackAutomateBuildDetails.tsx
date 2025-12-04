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
  Table,
} from '@mantine/core';
import { Cloud, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';

const BrowserStackAutomateBuildDetails: React.FC = () => {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (buildId) {
      loadSessions();
    }
  }, [buildId]);

  const loadSessions = async () => {
    if (!buildId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.browserstackAutomate.getBuildSessions({
        buildId,
        limit: 100,
      });
      if (result.success && result.sessions) {
        setSessions(result.sessions);
      } else {
        setError(result.error || 'Failed to load sessions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
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

  if (loading && sessions.length === 0) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert color="red" icon={<Cloud size={16} />}>
          {error}
        </Alert>
        <Button mt="md" onClick={() => navigate('/browserstack-automate')}>
          Back to Automate
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <Stack gap="md">
        <Card>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Button
                variant="subtle"
                leftSection={<ArrowLeft size={16} />}
                onClick={() => navigate('/browserstack-automate')}
              >
                Back
              </Button>
              <div>
                <Text fw={700} size="xl">
                  Build: {buildId?.substring(0, 20)}...
                </Text>
                <Text size="sm" c="dimmed">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </Text>
              </div>
            </Group>
            <Button
              variant="light"
              leftSection={<RefreshCw size={16} />}
              onClick={loadSessions}
            >
              Refresh
            </Button>
          </Group>
        </Card>

        <Card>
          {sessions.length === 0 ? (
            <Alert color="blue" icon={<Cloud size={16} />}>
              No sessions found for this build.
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>OS / Browser</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions.map((session) => (
                  <Table.Tr key={session.hashedId}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {session.name}
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
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDuration(session.duration)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
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

export default BrowserStackAutomateBuildDetails;

