import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, Text, Group, Button, Loader, Center } from '@mantine/core';
import { Library, PlayCircle, BarChart3, Plus } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestSummary } from '../../../types/v1.5';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    neverRun: 0,
    totalDatasets: 0,
  });

  useEffect(() => {
    if (workspacePath) {
      loadTests();
    }
  }, [workspacePath]);

  const loadTests = async () => {
    if (!workspacePath) return;

    setLoading(true);
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
        
        const stats = {
          totalTests: response.tests.length,
          passedTests: response.tests.filter(t => t.lastStatus === 'passed').length,
          failedTests: response.tests.filter(t => t.lastStatus === 'failed').length,
          neverRun: response.tests.filter(t => t.lastStatus === 'never_run').length,
          totalDatasets: response.tests.reduce((sum, t) => sum + t.datasetCount, 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
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

  const recentTests = tests
    .filter(t => t.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card padding="lg" radius="md" withBorder className="stat-card">
            <Group gap="md">
              <Text size="2rem">📊</Text>
              <div>
                <Text size="xl" fw={700}>{stats.totalTests}</Text>
                <Text size="sm" c="dimmed">Total Tests</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card padding="lg" radius="md" withBorder className="stat-card success">
            <Group gap="md">
              <Text size="2rem">✅</Text>
              <div>
                <Text size="xl" fw={700}>{stats.passedTests}</Text>
                <Text size="sm" c="dimmed">Passed</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card padding="lg" radius="md" withBorder className="stat-card error">
            <Group gap="md">
              <Text size="2rem">❌</Text>
              <div>
                <Text size="xl" fw={700}>{stats.failedTests}</Text>
                <Text size="sm" c="dimmed">Failed</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card padding="lg" radius="md" withBorder className="stat-card">
            <Group gap="md">
              <Text size="2rem">⚪</Text>
              <div>
                <Text size="xl" fw={700}>{stats.neverRun}</Text>
                <Text size="sm" c="dimmed">Never Run</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card padding="lg" radius="md" withBorder className="stat-card">
            <Group gap="md">
              <Text size="2rem">📝</Text>
              <div>
                <Text size="xl" fw={700}>{stats.totalDatasets}</Text>
                <Text size="sm" c="dimmed">Total Datasets</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      <Card padding="lg" radius="md" withBorder mb="xl">
        <Text size="lg" fw={600} mb="md">Quick Actions</Text>
        <Group gap="md">
          <Button
            leftSection={<PlayCircle size={18} />}
            onClick={() => navigate('/record')}
            variant="filled"
            size="md"
          >
            Record New Test
          </Button>
          <Button
            leftSection={<Library size={18} />}
            onClick={() => navigate('/library')}
            variant="light"
            size="md"
          >
            Test Library
          </Button>
          <Button
            leftSection={<BarChart3 size={18} />}
            onClick={() => navigate('/report')}
            variant="light"
            size="md"
          >
            View Reports
          </Button>
        </Group>
      </Card>

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <Card padding="lg" radius="md" withBorder mb="xl">
          <Text size="lg" fw={600} mb="md">Recent Test Runs</Text>
          <div className="recent-tests">
            {recentTests.map((test) => (
              <Card
                key={test.testName}
                padding="md"
                radius="md"
                withBorder
                className="recent-test-card"
                onClick={() => navigate(`/tests/${test.testName}`)}
                style={{ cursor: 'pointer', marginBottom: '8px' }}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{test.testName}</Text>
                    <Text size="sm" c="dimmed">
                      {test.module || 'No module'} • {test.datasetCount} datasets • {new Date(test.lastRunAt!).toLocaleString()}
                    </Text>
                  </div>
                  <Text size="sm" c={getStatusColor(test.lastStatus)} fw={500}>
                    {test.lastStatus}
                  </Text>
                </Group>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* All Tests Table (Compact) */}
      {tests.length > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>All Tests</Text>
            <Button
              variant="subtle"
              onClick={() => navigate('/library')}
            >
              View All →
            </Button>
          </Group>
          <div className="tests-table-compact">
            {tests.slice(0, 10).map((test) => (
              <Card
                key={test.testName}
                padding="sm"
                radius="md"
                withBorder
                mb="xs"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/tests/${test.testName}`)}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{test.testName}</Text>
                    <Text size="xs" c="dimmed">
                      {test.module || '-'} • {test.datasetCount} datasets • {test.lastRunAt ? new Date(test.lastRunAt).toLocaleDateString() : 'Never'}
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tests/${test.testName}`);
                    }}
                  >
                    View
                  </Button>
                </Group>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {tests.length === 0 && (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">🎬</Text>
              <Text size="xl" fw={600} mb="xs">No tests yet</Text>
              <Text c="dimmed" mb="lg">Get started by recording your first test flow</Text>
              <Button
                leftSection={<Plus size={18} />}
                onClick={() => navigate('/record')}
                size="md"
              >
                Record Your First Test
              </Button>
            </div>
          </Center>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
