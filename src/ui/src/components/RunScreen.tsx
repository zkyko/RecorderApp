import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Text, Button, Group, Badge, ScrollArea } from '@mantine/core';
import { Square } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunEvent } from '../../../types/v1.5';
import './RunScreen.css';

const RunScreen: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const { workspacePath } = useWorkspaceStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [_exitCode, _setExitCode] = useState<number | null>(null);
  const [actualRunId, setActualRunId] = useState<string | null>(null);
  const [testName, setTestName] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // The runId in the URL is actually the test name
  useEffect(() => {
    if (runId) {
      setTestName(runId);
    }
  }, [runId]);

  // Set up event listener (runs once on mount)
  useEffect(() => {
    let currentRunId: string | null = null;

    const handleEvent = (event: TestRunEvent) => {
      console.log('[RunScreen] Received event:', event.type, event.runId);
      
      // Capture runId from first event
      if (!currentRunId && event.runId) {
        console.log('[RunScreen] Capturing runId from event:', event.runId);
        currentRunId = event.runId;
        setActualRunId(event.runId);
      }
      
      // Match events by runId (or accept if we don't have one yet)
      if (!currentRunId || event.runId === currentRunId) {
        if (event.type === 'log' && event.message) {
          setLogs(prev => [...prev, event.message!]);
        } else if (event.type === 'error' && event.message) {
          setLogs(prev => [...prev, `[ERROR] ${event.message}`]);
        } else if (event.type === 'status') {
          // Map 'started' to 'running' for our status state
          const mappedStatus = event.status === 'started' ? 'running' : (event.status || 'running');
          setStatus(mappedStatus as 'idle' | 'running' | 'passed' | 'failed');
          if (event.runId && !currentRunId) {
            currentRunId = event.runId;
            setActualRunId(event.runId);
          }
        } else if (event.type === 'finished') {
          // Map 'started' to 'failed' if needed, otherwise use the status
          const mappedStatus = event.status === 'started' ? 'failed' : (event.status || 'failed');
          setStatus(mappedStatus as 'idle' | 'running' | 'passed' | 'failed');
          _setExitCode(event.exitCode || null);
          if (event.runId && !currentRunId) {
            currentRunId = event.runId;
            setActualRunId(event.runId);
          }
        }
      }
    };

    ipc.test.onEvents(handleEvent);

    return () => {
      ipc.test.removeEventsListener();
    };
  }, []); // Only run once on mount

  // Start test run when component mounts with test name
  useEffect(() => {
    if (testName && workspacePath && status === 'idle' && !actualRunId) {
      console.log('[RunScreen] Conditions met, starting test run');
      startRun();
    }
  }, [testName, workspacePath, status, actualRunId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startRun = async () => {
    if (!testName || !workspacePath) return;

    setStatus('running');
    setLogs(['Starting test execution...\n']);
    try {
      const specPath = `tests/${testName}.spec.ts`;
      console.log('[RunScreen] Starting test:', { workspacePath, specPath });
      const response = await ipc.test.run({
        workspacePath,
        specPath,
      });
      console.log('[RunScreen] Test run started, runId:', response.runId);
      setActualRunId(response.runId);
    } catch (error: any) {
      console.error('[RunScreen] Failed to start test:', error);
      setLogs(prev => [...prev, `[ERROR] Failed to start test: ${error.message || error}\n`]);
      setStatus('failed');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="run-screen">
      <Card padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Test Run</Text>
            <Text size="sm" c="dimmed">
              Test: {testName || runId}
              {actualRunId && ` • Run ID: ${actualRunId.slice(0, 8)}`}
            </Text>
          </div>
          <Group gap="xs">
            <Badge color={getStatusColor()} size="lg">
              {status}
            </Badge>
            {status === 'running' && (
              <Button
                leftSection={<Square size={16} />}
                variant="light"
                color="red"
                onClick={() => ipc.test.stop()}
              >
                Stop
              </Button>
            )}
          </Group>
        </Group>

        <Card padding="md" radius="md" withBorder style={{ background: '#0b1020' }}>
          <ScrollArea h={500}>
            <div className="run-console">
              {logs.length === 0 ? (
                <Text c="dimmed" size="sm">No logs yet. Starting test run...</Text>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`log-line ${log.includes('[ERROR]') ? 'error' : ''}`}>
                    {log}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </Card>
      </Card>
    </div>
  );
};

export default RunScreen;
