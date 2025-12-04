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
} from '@mantine/core';
import { Cloud, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { ipc } from '../ipc';

interface Project {
  id: number;
  name: string;
  groupId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  subGroupId: number;
}

const BrowserStackAutomateProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ipc.browserstackAutomate.getProjects();

      if (result.success && result.projects) {
        setProjects(result.projects);
      } else {
        setError(result.error || 'Failed to load projects');
        setProjects([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BrowserStack Automate projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
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

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <Stack gap="md">
        <Card>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Cloud size={24} />
              <div>
                <Text fw={600} size="lg">BrowserStack Automate Projects</Text>
                <Text size="sm" c="dimmed">
                  {projects.length > 0 ? `Showing ${projects.length} projects` : 'No projects found'}
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<RefreshCw size={16} />}
              onClick={loadProjects}
              variant="light"
              loading={loading}
            >
              Refresh
            </Button>
          </Group>

          {error && (
            <Alert color="red" icon={<Cloud size={16} />} mt="md">
              {error}
            </Alert>
          )}
        </Card>

        <Card>
          {loading && projects.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <Alert color="blue" icon={<Cloud size={16} />}>
              No projects found.
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Group ID</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {projects.map((project) => (
                  <Table.Tr key={project.id}>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {project.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{project.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="gray" size="sm">
                        {project.groupId}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {formatDate(project.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {formatDate(project.updatedAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<Eye size={14} />}
                        onClick={() => navigate(`/browserstack-automate/projects/${project.id}`)}
                      >
                        View
                      </Button>
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

export default BrowserStackAutomateProjects;

