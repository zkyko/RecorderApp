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
} from '@mantine/core';
import { Cloud, ArrowLeft, ExternalLink, RefreshCw, Video, FileText, Link2 } from 'lucide-react';
import { ipc } from '../ipc';

const BrowserStackAutomateSessionDetails: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.browserstackAutomate.getSession(sessionId);
      if (result.success && result.session) {
        setSession(result.session);
      } else {
        setError(result.error || 'Failed to load session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
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

  if (loading && !session) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error && !session) {
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

  if (!session) {
    return null;
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
                <Group gap="xs" mb="xs">
                  <Text fw={700} size="xl">
                    {session.name}
                  </Text>
                  <Badge color={getStatusColor(session.status)}>{session.status}</Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  Session ID: {session.hashedId}
                </Text>
              </div>
            </Group>
            <Group>
              <Button
                variant="light"
                leftSection={<RefreshCw size={16} />}
                onClick={loadSession}
              >
                Refresh
              </Button>
              <Button
                variant="light"
                leftSection={<ExternalLink size={16} />}
                onClick={() => window.open(session.publicUrl || session.browserUrl, '_blank')}
              >
                Open in BrowserStack
              </Button>
            </Group>
          </Group>
        </Card>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')}>
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="logs">Logs & Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Card>
              <Stack gap="md">
                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>OS</Text>
                    <Text size="sm">{session.os} {session.osVersion}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Browser</Text>
                    <Text size="sm">
                      {session.browser || session.device || 'N/A'}
                      {session.browserVersion && ` ${session.browserVersion}`}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Duration</Text>
                    <Text size="sm">{formatDuration(session.duration)}</Text>
                  </div>
                </Group>

                <Divider />

                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Build</Text>
                    <Text size="sm">{session.buildName}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Project</Text>
                    <Text size="sm">{session.projectName}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Created</Text>
                    <Text size="sm" c="dimmed">{formatDate(session.createdAt)}</Text>
                  </div>
                </Group>

                {session.reason && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Reason</Text>
                      <Text size="sm">{session.reason}</Text>
                    </div>
                  </>
                )}

                {session.testPriority && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Test Priority</Text>
                      <Badge>{session.testPriority}</Badge>
                    </div>
                  </>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="logs" pt="md">
            <Card>
              <Stack gap="md">
                {session.videoUrl && (
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Video size={16} />
                        <Text size="sm" fw={500}>Video Recording</Text>
                      </Group>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<ExternalLink size={14} />}
                        onClick={() => window.open(session.videoUrl, '_blank')}
                      >
                        View Video
                      </Button>
                    </Group>
                    <Paper p="md" withBorder>
                      <Text size="xs" c="dimmed">Video recording of the test session</Text>
                    </Paper>
                  </div>
                )}

                <Divider />

                <div>
                  <Text size="sm" fw={500} mb="md">Logs & Debugging</Text>
                  <Stack gap="xs">
                    {session.logs && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.logs, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Session Logs
                      </Button>
                    )}
                    {session.seleniumLogsUrl && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.seleniumLogsUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Selenium Logs
                      </Button>
                    )}
                    {session.appiumLogsUrl && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.appiumLogsUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Appium Logs
                      </Button>
                    )}
                    {session.browserConsoleLogsUrl && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.browserConsoleLogsUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Browser Console Logs
                      </Button>
                    )}
                    {session.harLogsUrl && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.harLogsUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Network Logs (HAR)
                      </Button>
                    )}
                    {session.seleniumTelemetryLogsUrl && (
                      <Button
                        variant="light"
                        leftSection={<FileText size={16} />}
                        onClick={() => window.open(session.seleniumTelemetryLogsUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        View Telemetry Logs
                      </Button>
                    )}
                  </Stack>
                </div>

                <Divider />

                <div>
                  <Text size="sm" fw={500} mb="md">Links</Text>
                  <Stack gap="xs">
                    {session.browserUrl && (
                      <Button
                        variant="light"
                        leftSection={<Link2 size={16} />}
                        onClick={() => window.open(session.browserUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        BrowserStack Dashboard
                      </Button>
                    )}
                    {session.publicUrl && (
                      <Button
                        variant="light"
                        leftSection={<Link2 size={16} />}
                        onClick={() => window.open(session.publicUrl, '_blank')}
                        fullWidth
                        justify="flex-start"
                      >
                        Public URL (Shareable)
                      </Button>
                    )}
                  </Stack>
                </div>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default BrowserStackAutomateSessionDetails;

