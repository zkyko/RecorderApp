import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Text, Button, Group, Loader, Center, Alert, Select, Badge } from '@mantine/core';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta } from '../../../types/v1.5';
import './TraceViewerScreen.css';

const TraceViewerScreen: React.FC = () => {
  const { testName, runId } = useParams<{ testName?: string; runId?: string }>();
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [traceUrl, setTraceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRunMeta | null>(null);
  const [selectedTestName, setSelectedTestName] = useState<string>(testName || '');

  useEffect(() => {
    if (workspacePath) {
      if (testName && runId) {
        // Direct navigation with testName and runId
        loadRunAndTrace(testName, runId);
      } else {
        // Show selection UI
        loadRuns();
      }
    }
  }, [workspacePath, testName, runId]);

  const loadRuns = async () => {
    if (!workspacePath) return;
    
    try {
      const response = await ipc.runs.list({ 
        workspacePath,
        testName: selectedTestName || undefined,
      });
      if (response.success && response.runs) {
        setRuns(response.runs);
        // Auto-select first run with traces if available
        const runWithTrace = response.runs.find(r => r.tracePaths && r.tracePaths.length > 0);
        if (runWithTrace) {
          setSelectedRun(runWithTrace);
          loadTraceForRun(runWithTrace);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load runs');
    }
  };

  const loadRunAndTrace = async (test: string, run: string) => {
    if (!workspacePath) return;
    
    setLoading(true);
    setError(null);
    try {
      const runResponse = await ipc.runs.get({ workspacePath, runId: run });
      if (runResponse.success && runResponse.run) {
        setSelectedRun(runResponse.run);
        setSelectedTestName(test);
        await loadTraceForRun(runResponse.run);
      } else {
        setError(runResponse.error || 'Run not found');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load run');
      setLoading(false);
    }
  };

  const loadTraceForRun = async (run: TestRunMeta) => {
    if (!workspacePath) {
      setError('Workspace path not available');
      setLoading(false);
      return;
    }

    // Check if tracePaths exists and has entries
    if (!run.tracePaths || run.tracePaths.length === 0) {
      setError('No trace available for this run. Re-run with tracing enabled.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use first trace path (workspace-relative)
      const traceZipPath = run.tracePaths[0];
      
      console.log('[TraceViewer] Opening trace:', traceZipPath);
      
      const response = await ipc.trace.open({
        workspacePath,
        traceZipPath,
      });

      if (response.success && response.url) {
        setTraceUrl(response.url);
        setError(null);
        console.log('[TraceViewer] Trace opened at:', response.url);
      } else {
        setError(response.error || 'Failed to open trace');
      }
    } catch (err: any) {
      console.error('[TraceViewer] Error loading trace:', err);
      setError(err.message || 'Failed to load trace');
    } finally {
      setLoading(false);
    }
  };

  const handleRunChange = (runId: string) => {
    const run = runs.find(r => r.runId === runId);
    if (run) {
      setSelectedRun(run);
      loadTraceForRun(run);
    }
  };

  // Get unique test names for dropdown
  const testNames = Array.from(new Set(runs.map(r => r.testName)));

  if (loading && !selectedRun) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!testName && !runId && runs.length === 0) {
    return (
      <Card padding="xl" radius="md" withBorder>
        <Center>
          <div style={{ textAlign: 'center' }}>
            <Text size="4rem" mb="md">🔍</Text>
            <Text size="xl" fw={600} mb="xs">No runs found</Text>
            <Text c="dimmed" mb="lg">Run tests to generate traces</Text>
            <Button onClick={() => navigate('/library')}>Go to Test Library</Button>
          </div>
        </Center>
      </Card>
    );
  }

  return (
    <div className="trace-viewer-screen">
      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Trace Viewer</Text>
            {selectedRun && (
              <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">Test: {selectedRun.testName}</Text>
                <Text size="sm" c="dimmed">•</Text>
                <Text size="sm" c="dimmed" ff="monospace">Run: {selectedRun.runId.slice(0, 8)}</Text>
                <Badge color={selectedRun.status === 'passed' ? 'green' : selectedRun.status === 'failed' ? 'red' : 'gray'} size="sm">
                  {selectedRun.status}
                </Badge>
              </Group>
            )}
          </div>
          <Group gap="xs">
            {traceUrl && (
              <Button
                leftSection={<ExternalLink size={16} />}
                variant="light"
                onClick={() => {
                  // Optional: Open in external browser as fallback
                  window.open(traceUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                Open in Browser
              </Button>
            )}
            <Button
              leftSection={<ArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/runs')}
            >
              Back
            </Button>
          </Group>
        </Group>

        {(!testName || !runId) && (
          <Group gap="md" mb="md">
            {testNames.length > 0 && (
              <Select
                label="Test"
                placeholder="Select test"
                data={testNames}
                value={selectedTestName}
                onChange={(value) => {
                  setSelectedTestName(value || '');
                  if (value) {
                    loadRuns();
                  }
                }}
                style={{ flex: 1 }}
              />
            )}
            {runs.length > 0 && (
              <Select
                label="Run"
                placeholder="Select run"
                data={runs
                  .filter(r => !selectedTestName || r.testName === selectedTestName)
                  .filter(r => r.tracePaths && r.tracePaths.length > 0)
                  .map(r => ({
                    value: r.runId,
                    label: `${new Date(r.startedAt).toLocaleString()} - ${r.status}`,
                  }))}
                value={selectedRun?.runId}
                onChange={(value) => value && handleRunChange(value)}
                style={{ flex: 1 }}
              />
            )}
          </Group>
        )}
      </Card>

      {error && !traceUrl && (
        <Card padding="lg" radius="md" withBorder mb="md">
          <Alert color="red" title="Error">
            {error}
          </Alert>
        </Card>
      )}

      {traceUrl ? (
        <Card padding={0} radius="md" withBorder style={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
          <iframe
            src={traceUrl}
            className="trace-iframe"
            title="Playwright Trace"
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              display: 'block'
            }}
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        </Card>
      ) : selectedRun && (!selectedRun.tracePaths || selectedRun.tracePaths.length === 0) ? (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">📭</Text>
              <Text size="xl" fw={600} mb="xs">No trace generated</Text>
              <Text c="dimmed">This run did not generate a trace file.</Text>
            </div>
          </Center>
        </Card>
      ) : null}
    </div>
  );
};

export default TraceViewerScreen;
