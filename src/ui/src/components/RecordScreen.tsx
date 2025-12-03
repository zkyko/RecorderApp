import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Group, Alert, Badge, ScrollArea, Code, Grid, Stack, List, Select } from '@mantine/core';
import { CircleDot, Square, Play, Info, Clock, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { CodegenCodeUpdate, RecorderCodeUpdate, RecordingEngine } from '../../../types/v1.5';
import VisualTestBuilder from './VisualTestBuilder';
import { notifications } from '@mantine/notifications';
import './RecordScreen.css';

const RecordScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath, currentWorkspace } = useWorkspaceStore();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveCodeContent, setLiveCodeContent] = useState<string | null>(null);
  const [lastCodeUpdateAt, setLastCodeUpdateAt] = useState<string | null>(null);
  const [envUrl, setEnvUrl] = useState<string | null>(null);
  const [selectedStepLine, setSelectedStepLine] = useState<number | null>(null);
  const [locatorHealth, setLocatorHealth] = useState<{
    total: number;
    good: number;
    medium: number;
    bad: number;
  } | null>(null);
  const [recordingEngine, setRecordingEngine] = useState<RecordingEngine>('qaStudio');
  const [visualBuilderOpen, setVisualBuilderOpen] = useState(false);

  // Load recording engine setting on mount
  useEffect(() => {
    if (workspacePath) {
      loadRecordingEngine();
    }
  }, [workspacePath]);

  const loadRecordingEngine = async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.settings.getRecordingEngine({ workspacePath });
      if (response.success && response.recordingEngine) {
        setRecordingEngine(response.recordingEngine);
      }
    } catch (error) {
      console.error('Failed to load recording engine setting:', error);
    }
  };

  const checkPlaywrightEnv = async (): Promise<{ cliAvailable: boolean; browsersInstalled: boolean } | null> => {
    if (!workspacePath) return null;
    try {
      const response = await ipc.playwright.checkEnv({ workspacePath });
      if (response.success) {
        const cliAvailable = !!response.cliAvailable;
        const browsersInstalled = !!response.browsersInstalled;
        // We only use this state for potential future UI; right now the main UI lives in Settings
        // but keeping it up to date here is harmless.
        // (No dependency on this state for control flow to avoid race conditions.)
        return { cliAvailable, browsersInstalled };
      } else {
        return { cliAvailable: false, browsersInstalled: false };
      }
    } catch {
      return { cliAvailable: false, browsersInstalled: false };
    }
  };

  const handleRecordingEngineChange = async (value: string | null) => {
    if (!workspacePath || !value || isRecording) return;
    
    const newEngine = value as RecordingEngine;
    try {
      const response = await ipc.settings.updateRecordingEngine({
        workspacePath,
        recordingEngine: newEngine,
      });
      
      if (response.success) {
        setRecordingEngine(newEngine);
      } else {
        alert(`Failed to update recording engine: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to update recording engine'}`);
    }
  };

  // Listen for live code updates from both engines
  useEffect(() => {
    if (isRecording) {
      const handleCodegenUpdate = (update: CodegenCodeUpdate) => {
        console.log('[RecordScreen] Received codegen update:', update.timestamp);
        setLiveCodeContent(update.content);
        setLastCodeUpdateAt(update.timestamp);
      };
      
      const handleRecorderUpdate = (update: RecorderCodeUpdate) => {
        console.log('[RecordScreen] Received recorder update:', update.timestamp);
        setLiveCodeContent(update.content);
        setLastCodeUpdateAt(update.timestamp);
      };
      
      if (recordingEngine === 'playwright') {
        ipc.codegen.onCodeUpdate(handleCodegenUpdate);
      } else {
        ipc.recorder.onCodeUpdate(handleRecorderUpdate);
      }
      
      return () => {
        if (recordingEngine === 'playwright') {
          ipc.codegen.removeCodeUpdateListener();
        } else {
          ipc.recorder.removeCodeUpdateListener();
        }
      };
    }
  }, [isRecording, recordingEngine]);

  const handleStartRecording = async () => {
    if (!workspacePath) {
      setError('Workspace not set');
      return;
    }

    setLoading(true);
    setError(null);
    setLiveCodeContent(null);
    setLastCodeUpdateAt(null);

    try {
      const electronAPI = (window as any).electronAPI;
      const config = await electronAPI?.getConfig();

      // Determine environment URL based on workspace type
      let envUrlToUse: string | null = null;
      let storageStatePath: string | undefined;

      if (currentWorkspace?.type === 'web-demo') {
        // FH Web workspace: use workspace-specific baseUrl
        const settings = (currentWorkspace.settings || {}) as { baseUrl?: string };
        envUrlToUse = settings.baseUrl || 'https://fh-test-fourhandscom.azurewebsites.net/';
        // Web workspaces typically don't require D365 storage state
        storageStatePath = undefined;
      } else {
        // D365 / other workspaces: fall back to global D365 URL + storage state
        if (!config?.d365Url) {
          setError('D365 URL not configured');
          return;
        }

        envUrlToUse = config.d365Url;

        // Get storage state path - check config first, then try default location
        storageStatePath = config.storageStatePath;
        if (!storageStatePath) {
          // Try to get from config manager's default location
          const fullConfig = await electronAPI?.getConfig();
          storageStatePath = fullConfig?.storageStatePath;
        }

        // If still no path, try default workspace location
        if (!storageStatePath && workspacePath) {
          // Construct path manually (can't use Node.js path in browser)
          const defaultPath = `${workspacePath}/storage_state/d365.json`;
          storageStatePath = defaultPath;
        }
      }

      setEnvUrl(envUrlToUse);

      // If using Playwright Codegen, make sure Playwright CLI is available
      if (recordingEngine === 'playwright') {
        const envResult = await checkPlaywrightEnv();
        if (!envResult || !envResult.cliAvailable) {
          setError('Playwright CLI is not available on this machine. Open Settings → Recording to install or repair Playwright.');
          return;
        }
      }

      // Start the appropriate recording engine
      let response;
      if (recordingEngine === 'playwright') {
        response = await ipc.codegen.start({
          envUrl: envUrlToUse || '',
          workspacePath,
          storageStatePath: storageStatePath || '',
        });
      } else {
        response = await ipc.recorder.start({
          envUrl: envUrlToUse || '',
          workspacePath,
          storageStatePath: storageStatePath || '',
        });
      }

      if (response.success) {
        setIsRecording(true);
        setError(null);
      } else {
        setError(response.error || 'Failed to start recording');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  // Parse steps from code content
  const steps = useMemo(() => {
    if (!liveCodeContent) return [];
    const lines = liveCodeContent.split('\n');
    const parsedSteps: Array<{ index: number; description: string; line: number }> = [];
    let stepIndex = 1;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('await page.')) {
        // Extract a short description
        let description = trimmed;
        // Try to extract meaningful text
        const textMatch = trimmed.match(/['"]([^'"]+)['"]/);
        if (textMatch) {
          description = textMatch[1];
        } else {
          // Extract method name
          const methodMatch = trimmed.match(/page\.(\w+)/);
          if (methodMatch) {
            description = methodMatch[1] + '()';
          }
        }
        if (description.length > 50) {
          description = description.substring(0, 50) + '...';
        }
        parsedSteps.push({
          index: stepIndex++,
          description,
          line: index + 1,
        });
      }
    });

    return parsedSteps;
  }, [liveCodeContent]);

  // Calculate locator health
  useEffect(() => {
    if (liveCodeContent && !isRecording) {
      // Analyze locators in the code
      const lines = liveCodeContent.split('\n');
      let total = 0;
      let good = 0;
      let medium = 0;
      let bad = 0;

      lines.forEach((line) => {
        const trimmed = line.trim();
        
        // Good locators
        if (trimmed.includes('getByRole') || trimmed.includes('getByLabel') || 
            trimmed.includes('getByPlaceholder') || trimmed.includes('data-dyn-controlname')) {
          total++;
          good++;
        }
        // Medium locators
        else if (trimmed.includes('getByText')) {
          total++;
          medium++;
        }
        // Bad locators
        else if (trimmed.includes('nth-child') || trimmed.includes('locator(') && 
                 (trimmed.includes('#') || trimmed.includes('>') || trimmed.match(/\d+/))) {
          total++;
          bad++;
        }
      });

      setLocatorHealth({ total, good, medium, bad });
    }
  }, [liveCodeContent, isRecording]);

  const handleStopRecording = async () => {
    setLoading(true);
    try {
      // Stop the appropriate recording engine
      let response;
      if (recordingEngine === 'playwright') {
        response = await ipc.codegen.stop();
      } else {
        response = await ipc.recorder.stop();
      }

      if (response.success) {
        setIsRecording(false);
        // Keep the final code content for display
        if (response.rawCode) {
          setLiveCodeContent(response.rawCode);
        }
        // Navigate to step editor first (if steps available), then to locator cleanup
        if (response.steps && response.steps.length > 0) {
          // Navigate to step editor with both steps and rawCode
          navigate('/record/step-editor', { 
            state: { 
              rawCode: response.rawCode,
              steps: response.steps 
            } 
          });
        } else if (response.rawCode) {
          // Fallback: if no steps, go directly to locator cleanup
          navigate('/record/locator-cleanup', { state: { rawCode: response.rawCode } });
        } else {
          setError('No code was generated. Please try recording again.');
        }
      } else {
        setError(response.error || 'Failed to stop recording');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="record-screen">
      <Card padding="lg" radius="lg" withBorder className="record-hero">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Group gap="xs" mb="xs">
              <Badge
                color={isRecording ? 'blue' : 'gray'}
                variant="filled"
                leftSection={isRecording ? <Play size={12} /> : <Square size={12} />}
              >
                {isRecording ? 'Recording' : 'Idle'}
              </Badge>
              <Select
                value={recordingEngine}
                onChange={handleRecordingEngineChange}
                data={[
                  { value: 'qaStudio', label: 'QA Studio Recorder' },
                  { value: 'playwright', label: 'Playwright Codegen' },
                ]}
                disabled={isRecording}
                size="xs"
                style={{ width: 200 }}
                variant="default"
              />
            </Group>
            <Text fw={600} size="xl">Record Flow</Text>
            <Text c="dimmed" size="sm" mb="sm">
              {currentWorkspace?.type === 'web-demo'
                ? 'Launch a browser, capture your FH web journey, then move into cleanup and parameterization.'
                : 'Launch a browser, capture your D365 flow, then move into cleanup and parameterization.'}
            </Text>
            <Group gap="md">
              {envUrl && (
                <Text size="sm" c="dimmed">
                  Environment: <Text span fw={600}>{envUrl}</Text>
                </Text>
              )}
              {lastCodeUpdateAt && (
                <Group gap={4}>
                  <Clock size={14} />
                  <Text size="sm" c="dimmed">
                    Updated {formatTimestamp(lastCodeUpdateAt)}
                  </Text>
                </Group>
              )}
            </Group>
          </div>
          <div>
            {!isRecording ? (
              <Button
                leftSection={<CircleDot size={18} />}
                size="md"
                color="green"
                onClick={handleStartRecording}
                loading={loading}
                disabled={loading}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                leftSection={<Square size={18} />}
                size="md"
                color="red"
                onClick={handleStopRecording}
                loading={loading}
                disabled={loading}
              >
                Stop Recording
              </Button>
            )}
          </div>
        </Group>
        {error && (
          <Alert icon={<Info size={16} />} title="Error" color="red" mt="md">
            {error}
          </Alert>
        )}
      </Card>

      <Grid gutter="md" mt="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {isRecording && (
              <Alert icon={<Play size={16} />} title="Recording" color="blue">
                <Group gap="xs">
                  <div className="recording-dot"></div>
                  <Text size="sm">
                    Recording in progress. Execute your steps in the opened browser, then click “Stop Recording”.
                  </Text>
                </Group>
              </Alert>
            )}

            <Card padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Workflow</Text>
                <Button
                  leftSection={<Sparkles size={16} />}
                  variant="light"
                  size="xs"
                  onClick={() => setVisualBuilderOpen(true)}
                >
                  Visual Builder <Badge size="xs" ml="xs" color="violet">BETA</Badge>
                </Button>
              </Group>
              <List spacing="xs" size="sm" c="dimmed">
                <List.Item>
                  {currentWorkspace?.type === 'web-demo'
                    ? 'Launch the recorder and run through your FH web scenario.'
                    : 'Launch the recorder and run through your D365 scenario.'}
                </List.Item>
                <List.Item>Stop recording to review steps and cleanup locators.</List.Item>
                <List.Item>Parameterize inputs and generate the final Playwright test.</List.Item>
              </List>
            </Card>

            {steps.length > 0 && (
              <Card padding="lg" radius="md" withBorder style={{ flex: 1 }}>
                <Text fw={600} mb="sm">Captured Steps</Text>
                <ScrollArea h={260}>
                  <List spacing="xs" size="sm">
                    {steps.map((step) => (
                      <List.Item
                        key={step.index}
                        onClick={() => setSelectedStepLine(step.line)}
                        style={{
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '6px',
                          backgroundColor:
                            selectedStepLine === step.line ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        }}
                      >
                        <Group gap="xs">
                          <Badge size="sm" variant="light">#{step.index}</Badge>
                          <Text size="sm">{step.description}</Text>
                        </Group>
                      </List.Item>
                    ))}
                  </List>
                </ScrollArea>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card padding="lg" radius="md" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={600} size="lg">Code Preview</Text>
                <Text size="sm" c="dimmed">
                  Generated Playwright script updates in real time while you record.
                </Text>
              </div>
              {lastCodeUpdateAt && (
                <Group gap={4}>
                  <Clock size={14} />
                  <Text size="xs" c="dimmed">Updated {formatTimestamp(lastCodeUpdateAt)}</Text>
                </Group>
              )}
            </Group>

            {!liveCodeContent && !isRecording ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <Text size="4rem" mb="md">📝</Text>
                  <Text size="lg" fw={600} mb="xs">No recording yet</Text>
                  <Text c="dimmed">Start recording to stream code into this panel.</Text>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea h="calc(100vh - 400px)" style={{ flex: 1 }}>
                  <Code block style={{ 
                    background: '#0b1020', 
                    color: '#d4d4d4',
                    padding: '16px',
                    borderRadius: '8px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}>
                    {liveCodeContent?.split('\n').map((line, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: selectedStepLine === index + 1 ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                          padding: '2px 0',
                        }}
                      >
                        {line || ' '}
                      </div>
                    )) || 'Waiting for codegen output...'}
                  </Code>
                </ScrollArea>
                
                {/* Locator Health Summary */}
                {locatorHealth && locatorHealth.total > 0 && (
                  <Card padding="md" radius="md" withBorder mt="md" style={{ background: '#1f2937' }}>
                    <Text fw={600} size="sm" mb="xs">Locator Health Summary</Text>
                    <Group gap="xl">
                      <div>
                        <Text size="xs" c="dimmed">Total Locators</Text>
                        <Text size="lg" fw={700}>{locatorHealth.total}</Text>
                      </div>
                      <div>
                        <Group gap="xs">
                          <CheckCircle2 size={16} color="green" />
                          <Text size="xs" c="dimmed">Good</Text>
                        </Group>
                        <Text size="lg" fw={700} c="green">{locatorHealth.good}</Text>
                      </div>
                      <div>
                        <Group gap="xs">
                          <AlertTriangle size={16} color="yellow" />
                          <Text size="xs" c="dimmed">Medium</Text>
                        </Group>
                        <Text size="lg" fw={700} c="yellow">{locatorHealth.medium}</Text>
                      </div>
                      <div>
                        <Group gap="xs">
                          <XCircle size={16} color="red" />
                          <Text size="xs" c="dimmed">Bad</Text>
                        </Group>
                        <Text size="lg" fw={700} c="red">{locatorHealth.bad}</Text>
                      </div>
                    </Group>
                  </Card>
                )}
              </>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Visual Test Builder (BETA) */}
      {workspacePath && (
        <VisualTestBuilder
          opened={visualBuilderOpen}
          onClose={() => setVisualBuilderOpen(false)}
          workspacePath={workspacePath}
          // No testName means we're on Record screen - will navigate to step editor
          // No onStepsGenerated means it will navigate instead of calling callback
        />
      )}
    </div>
  );
};

export default RecordScreen;
