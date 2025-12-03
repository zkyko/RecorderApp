import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Button,
  Breadcrumbs,
  Anchor,
  Table,
  Badge,
  Loader,
  Stack,
} from '@mantine/core';
import { Activity, RefreshCw, ShieldCheck, ShieldAlert, SkipForward } from 'lucide-react';

type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

interface ElectronTestResult {
  id: string;
  label: string;
  status: TestStatus;
  details?: string;
  durationMs: number;
}

const statusIcon = (status: TestStatus) => {
  switch (status) {
    case 'PASS':
      return <ShieldCheck size={18} />;
    case 'FAIL':
      return <ShieldAlert size={18} />;
    case 'SKIP':
    default:
      return <SkipForward size={18} />;
  }
};

const statusBadge = (status: TestStatus) => {
  switch (status) {
    case 'PASS':
      return (
        <Badge color="green" variant="light">
          PASS
        </Badge>
      );
    case 'FAIL':
      return (
        <Badge color="red" variant="light">
          FAIL
        </Badge>
      );
    case 'SKIP':
    default:
      return (
        <Badge color="yellow" variant="light">
          SKIP
        </Badge>
      );
  }
};

const DiagnosticsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ElectronTestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAll = async () => {
    const api = (window as any).electronAPI;
    if (!api || !api.electronTestRunAll) {
      setError('Diagnostics API not available. Are you running inside Electron?');
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = (await api.electronTestRunAll()) as ElectronTestResult[];
      setResults(res || []);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setRunning(false);
    }
  };

  const passCount = results?.filter((r) => r.status === 'PASS').length || 0;
  const failCount = results?.filter((r) => r.status === 'FAIL').length || 0;
  const skipCount = results?.filter((r) => r.status === 'SKIP').length || 0;

  const sortedResults =
    results?.slice().sort((a, b) => {
      const order: Record<TestStatus, number> = { FAIL: 0, SKIP: 1, PASS: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.label.localeCompare(b.label);
    }) || [];

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Diagnostics' },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        if (item.href) navigate(item.href);
      }}
    >
      {item.title}
    </Anchor>
  ));

  return (
    <div className="settings-screen">
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      <Card padding="lg" radius="md" withBorder style={{ maxWidth: 900, margin: '0 auto' }}>
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <Activity size={24} />
            <Text size="xl" fw={600}>
              Diagnostics / Self Test
            </Text>
          </Group>
          <Button
            leftSection={running ? <Loader size="xs" /> : <RefreshCw size={16} />}
            onClick={runAll}
            disabled={running}
          >
            Run All Tests
          </Button>
        </Group>

        {results && (
          <Group mb="md" gap="sm">
            <Badge color={failCount > 0 ? 'red' : 'green'} variant="filled">
              {failCount > 0 ? 'Attention required' : 'All critical checks passing'}
            </Badge>
            <Text size="sm">
              ✅ <strong>{passCount}</strong> passed · ⚠️ <strong>{skipCount}</strong> skipped · ❌{' '}
              <strong>{failCount}</strong> failed
            </Text>
          </Group>
        )}

        {error && (
          <Text size="sm" c="red" mb="md">
            {error}
          </Text>
        )}

        <Stack gap="sm">
          {running && !results && (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Running diagnostics...
              </Text>
            </Group>
          )}

          {results && results.length > 0 && (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Test</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Details</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedResults.map((r) => (
                  <Table.Tr
                    key={r.id}
                    style={{
                      backgroundColor:
                        r.status === 'FAIL'
                          ? 'rgba(239, 68, 68, 0.05)'
                          : r.status === 'PASS'
                          ? 'rgba(34, 197, 94, 0.03)'
                          : 'transparent',
                    }}
                  >
                    <Table.Td>
                      <Group gap="xs">
                        {statusIcon(r.status)}
                        <Text>{r.label}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{statusBadge(r.status)}</Table.Td>
                    <Table.Td>{r.durationMs.toFixed(0)} ms</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {r.details || '-'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!results && !running && !error && (
            <Text size="sm" c="dimmed">
              Click "Run All Tests" to run environment, workspace, and integrations self-tests.
            </Text>
          )}
        </Stack>
      </Card>
    </div>
  );
};

export default DiagnosticsScreen;


