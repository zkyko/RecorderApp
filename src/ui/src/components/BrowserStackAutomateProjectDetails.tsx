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
  Divider,
} from '@mantine/core';
import { Cloud, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';

const BrowserStackAutomateProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.browserstackAutomate.getProject(parseInt(projectId));
      if (result.success && result.project) {
        setProject(result.project);
      } else {
        setError(result.error || 'Failed to load project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
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

  if (loading && !project) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert color="red" icon={<Cloud size={16} />}>
          {error}
        </Alert>
        <Button mt="md" onClick={() => navigate('/browserstack-automate')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  if (!project) {
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
                <Text fw={700} size="xl">
                  {project.name}
                </Text>
                <Text size="sm" c="dimmed">
                  Project ID: {project.id}
                </Text>
              </div>
            </Group>
            <Button
              variant="light"
              leftSection={<RefreshCw size={16} />}
              onClick={loadProject}
            >
              Refresh
            </Button>
          </Group>
        </Card>

        <Card>
          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="sm" fw={500} mb={4}>Group ID</Text>
                <Text size="sm" c="dimmed">{project.groupId}</Text>
              </div>
              <div>
                <Text size="sm" fw={500} mb={4}>User ID</Text>
                <Text size="sm" c="dimmed">{project.userId}</Text>
              </div>
              <div>
                <Text size="sm" fw={500} mb={4}>Sub Group ID</Text>
                <Text size="sm" c="dimmed">{project.subGroupId}</Text>
              </div>
            </Group>

            <Divider />

            <Group grow>
              <div>
                <Text size="sm" fw={500} mb={4}>Created</Text>
                <Text size="sm" c="dimmed">{formatDate(project.createdAt)}</Text>
              </div>
              <div>
                <Text size="sm" fw={500} mb={4}>Updated</Text>
                <Text size="sm" c="dimmed">{formatDate(project.updatedAt)}</Text>
              </div>
            </Group>

            {project.builds && project.builds.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text size="sm" fw={500} mb={4}>Builds ({project.builds.length})</Text>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Framework</Table.Th>
                        <Table.Th>Created</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {project.builds.map((build: any) => (
                        <Table.Tr key={build.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{build.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getStatusColor(build.status)} size="sm">
                              {build.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{build.duration}s</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm">{build.framework}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{formatDate(build.createdAt)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => navigate(`/browserstack-automate/builds/${build.hashedId}`)}
                            >
                              View
                            </Button>
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
      </Stack>
    </div>
  );
};

export default BrowserStackAutomateProjectDetails;

