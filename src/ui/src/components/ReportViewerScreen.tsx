import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Text, Button, Group, Loader, Center, Alert, Select, Badge } from '@mantine/core';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta } from '../../../types/v1.5';
import './ReportViewerScreen.css';

const ReportViewerScreen: React.FC = () => {
  const { testName, runId } = useParams<{ testName?: string; runId?: string }>();
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRunMeta | null>(null);
  const [selectedTestName, setSelectedTestName] = useState<string>(testName || '');

  useEffect(() => {
    if (workspacePath) {
      if (testName && runId) {
        // Direct navigation with testName and runId
        loadRunAndReport(testName, runId);
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
        // Auto-select first run with Allure report if available
        const runWithReport = response.runs.find(r => r.allureReportPath);
        if (runWithReport) {
          setSelectedRun(runWithReport);
          loadReportForRun(runWithReport);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load runs');
    }
  };

  const loadRunAndReport = async (test: string, run: string) => {
    if (!workspacePath) return;
    
    setLoading(true);
    try {
      const runResponse = await ipc.runs.get({ workspacePath, runId: run });
      if (runResponse.success && runResponse.run) {
        setSelectedRun(runResponse.run);
        setSelectedTestName(test);
        await loadReportForRun(runResponse.run);
      } else {
        setError(runResponse.error || 'Run not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  const loadReportForRun = async (run: TestRunMeta) => {
    if (!workspacePath) {
      setError('Workspace path not available');
      setLoading(false);
      return;
    }

    // Check for Allure report (preferred) or fallback to old reportPath
    if (!run.allureReportPath && !run.reportPath) {
      setError('No Allure report available for this run. Run a test from QA Studio to generate one.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await ipc.report.open({
        workspacePath,
        runId: run.runId, // Use runId to find Allure report
      });

      if (response.success && response.url) {
        setReportUrl(response.url);
        setError(null);
        console.log('[ReportViewer] Allure report opened at:', response.url);
      } else {
        setError(response.error || 'Failed to open Allure report');
      }
    } catch (err: any) {
      console.error('[ReportViewer] Error loading Allure report:', err);
      setError(err.message || 'Failed to load Allure report');
    } finally {
      setLoading(false);
    }
  };

  const handleRunChange = (runId: string) => {
    const run = runs.find(r => r.runId === runId);
    if (run) {
      setSelectedRun(run);
      loadReportForRun(run);
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
            <Text size="4rem" mb="md">📊</Text>
            <Text size="xl" fw={600} mb="xs">No runs found</Text>
            <Text c="dimmed" mb="lg">Run tests to generate reports</Text>
            <Button onClick={() => navigate('/library')}>Go to Test Library</Button>
          </div>
        </Center>
      </Card>
    );
  }

  return (
    <div className="report-viewer-screen">
      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Allure Test Report</Text>
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
            {reportUrl && (
              <Button
                leftSection={<ExternalLink size={16} />}
                variant="light"
                onClick={() => {
                  // Open in external browser as fallback option
                  window.open(reportUrl, '_blank', 'noopener,noreferrer');
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
                  .filter(r => r.allureReportPath || r.reportPath) // Support both Allure and legacy reports
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

      {error && (
        <Card padding="lg" radius="md" withBorder mb="md">
          <Alert color="red" title="Error">
            {error}
          </Alert>
        </Card>
      )}

    </div>
  );
};

export default ReportViewerScreen;
