import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDot, Square, LogIn, Play, Sparkles, ChevronDown, ChevronUp, Copy, Maximize2, Minimize2, Clock, Pause, RotateCcw, Save } from 'lucide-react';
import { Card, Alert, Group, Text, Button, Badge, List, ScrollArea } from '@mantine/core';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { CodegenCodeUpdate, RecorderCodeUpdate, RecordingEngine } from '../../../types/v1.5';
import VisualTestBuilder from './VisualTestBuilder';
import CopyButton from './CopyButton';
import KeyboardShortcutsPanel from './KeyboardShortcutsPanel';
import CustomButton from './Button';
import { notifications } from '../utils/notifications';
import './RecordScreen.css';
import WebLoginDialog from './WebLoginDialog';

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
  const [recordingMode, setRecordingMode] = useState<'standard' | 'advanced'>('standard');
  const [visualBuilderOpen, setVisualBuilderOpen] = useState(false);
  const [showWebLogin, setShowWebLogin] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const codePreviewRef = useRef<HTMLDivElement>(null);

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
        // Use web storage state if it exists (saved from web login)
        // Path: <workspace>/storage_state/web.json
        const webStorageStatePath = `${workspacePath}/storage_state/web.json`;
        storageStatePath = webStorageStatePath;
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
        setRecordingStartTime(new Date());
        setSessionDuration(0);
        setIsPaused(false);
        notifications.show({
          message: 'Recording started',
          color: 'success',
        });
      } else {
        setError(response.error || 'Failed to start recording');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  // Track recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        if (!isPaused) {
          setSessionDuration(Math.floor((Date.now() - recordingStartTime.getTime()) / 1000));
        }
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime, isPaused]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const stepCount = steps.length;

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
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timestamp;
    }
  };

  const getRecordingEngineLabel = () => {
    return recordingEngine === 'playwright' ? 'Playwright Codegen' : 'QA Studio Recorder';
  };

  return (
    <div className="record-screen">
      {/* Primary Panel: Record Flow */}
      <div className="record-hero">
        <div className="text-center mb-6">
          <h2 className="record-hero-title">Record a new {currentWorkspace?.type === 'web-demo' ? 'FH Web' : 'D365'} flow</h2>
          <p className="record-hero-subtitle">
            Launch a browser, run through your scenario, then review steps and generate Playwright code.
          </p>
        </div>

        {/* Recording Mode Toggle */}
        {!isRecording && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-base-content/70">Recording Mode:</span>
            <div className="join">
              <button
                className={`btn btn-sm join-item ${recordingMode === 'standard' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRecordingMode('standard')}
              >
                Standard Mode
              </button>
              <button
                className={`btn btn-sm join-item ${recordingMode === 'advanced' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRecordingMode('advanced')}
              >
                Advanced Mode
              </button>
            </div>
            <span className="text-xs text-base-content/50 ml-2">
              {recordingMode === 'standard' ? 'Normal click capture' : 'Includes hover events, keyboard shortcuts'}
            </span>
          </div>
        )}

        {/* Status and Engine Selection */}
        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
          {isRecording && (
            <>
              <div className="flex items-center gap-2">
                <span className="recording-dot-pulse"></span>
                <span className="text-sm font-medium">Recording</span>
              </div>
              <span className="text-base-content/40">•</span>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} />
                <span>{formatDuration(sessionDuration)}</span>
              </div>
              <span className="text-base-content/40">•</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{stepCount}</span>
                <span className="text-base-content/60">steps captured</span>
              </div>
            </>
          )}
          {!isRecording && (
            <>
              <span className={`record-status-pill ${isRecording ? 'recording' : 'idle'}`}>
                Idle
              </span>
              <span className="text-base-content/40">•</span>
              <select
                value={recordingEngine}
                onChange={(e) => handleRecordingEngineChange(e.target.value)}
                disabled={isRecording}
                className="select select-sm select-bordered bg-base-100 border-base-300 text-base-content"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="qaStudio">QA Studio Recorder</option>
                <option value="playwright">Playwright Codegen</option>
              </select>
            </>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="mb-4 flex flex-col items-center gap-3">
          {!isRecording ? (
            <CustomButton
              variant="primary"
              size="lg"
              onClick={handleStartRecording}
              loading={loading}
              icon={CircleDot}
            >
              Start Recording
            </CustomButton>
          ) : (
            <div className="flex gap-2">
              <CustomButton
                variant={isPaused ? 'primary' : 'secondary'}
                size="md"
                onClick={() => {
                  setIsPaused(!isPaused);
                  notifications.show({
                    message: isPaused ? 'Recording resumed' : 'Recording paused',
                    color: 'info',
                  });
                }}
                icon={isPaused ? Play : Pause}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </CustomButton>
              <CustomButton
                variant="primary"
                size="md"
                onClick={handleStopRecording}
                loading={loading}
                icon={Square}
              >
                Stop Recording
              </CustomButton>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Panel Toggle */}
        <div className="mb-4 text-center">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowShortcutsPanel(true)}
          >
            <span className="text-xs">Keyboard Shortcuts</span>
            <span className="ml-2 text-base-content/50">?</span>
          </button>
        </div>

        {/* Subtle engine info */}
        <p className="text-xs text-base-content/50 text-center">
          Recording engine: {getRecordingEngineLabel()}
        </p>

        {/* Web Login for FH Web workspaces */}
        {currentWorkspace?.type === 'web-demo' && !isRecording && (
          <div className="mt-4 text-center">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowWebLogin(true)}
            >
              <LogIn size={14} className="mr-2" />
              Login to FH Web
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Secondary Row: Two Columns */}
      <div className="record-secondary-row">
        {/* Left: How Recording Works */}
        <div className="record-workflow-card">
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

            <Card 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => setVisualBuilderOpen(true)}
            >
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Workflow</Text>
                <Button
                  leftSection={<Sparkles size={16} />}
                  variant="light"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisualBuilderOpen(true);
                  }}
                >
                  Visual Builder <Badge size="xs" ml="xs" color="violet">BETA</Badge>
                </Button>
              </Group>
              <List spacing="xs" size="sm" c="dimmed">
                <List.Item>
                  <div className="flex items-center gap-2">
                    <span>1.</span>
                    <span>{currentWorkspace?.type === 'web-demo'
                      ? 'Launch the recorder and run through your FH web scenario.'
                      : 'Launch the recorder and run through your D365 scenario.'}</span>
                    {isRecording && <Badge size="xs" color="blue">In Progress</Badge>}
                  </div>
                </List.Item>
                <List.Item>
                  <div className="flex items-center gap-2">
                    <span>2.</span>
                    <span>Stop recording to review steps and cleanup locators.</span>
                  </div>
                </List.Item>
                <List.Item>
                  <div className="flex items-center gap-2">
                    <span>3.</span>
                    <span>Parameterize inputs and generate the final Playwright test.</span>
                  </div>
                </List.Item>
              </List>
              {isRecording && (
                <div className="mt-4">
                  <div className="text-xs text-base-content/60 mb-2">Progress</div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stepCount / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
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
          </div>

        {/* Right: Code Preview */}
        <div className={`record-code-preview-card ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="record-code-preview-title">Code Preview</h3>
            <div className="flex items-center gap-2">
              {!isRecording && (
                <select
                  className="select select-xs select-bordered bg-base-100"
                  defaultValue="typescript"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              )}
              {liveCodeContent && (
                <CopyButton
                  text={liveCodeContent}
                  label="Copy Code"
                  size="sm"
                  variant="icon"
                />
              )}
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>
          {!liveCodeContent && !isRecording ? (
            <div className="record-code-preview-empty">
              <div>
                <div className="text-4xl mb-3 opacity-50">📝</div>
                <p className="text-sm text-base-content/60">No recording yet.</p>
                <p className="text-xs text-base-content/50 mt-1">Start recording to stream generated code into this panel.</p>
                <div className="mt-4 p-3 bg-base-300 rounded text-xs font-mono text-left">
                  <div className="text-primary">// Example code preview</div>
                  <div className="text-base-content/70">await page.goto('https://example.com');</div>
                  <div className="text-base-content/70">await page.click('button');</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={codePreviewRef}
                className="record-code-preview-content"
                style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px' }}
              >
                {liveCodeContent?.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className={`code-line ${selectedStepLine === index + 1 ? 'highlighted' : ''}`}
                  >
                    <span className="line-number text-base-content/40 mr-3 select-none">{index + 1}</span>
                    <span className="code-content">{line || ' '}</span>
                  </div>
                )) || (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-md mb-2"></div>
                      <p className="text-sm text-base-content/60">Waiting for codegen output...</p>
                    </div>
                  </div>
                )}
              </div>
              {liveCodeContent && (
                <div className="record-code-stats flex items-center justify-between">
                  <div>
                    {liveCodeContent.split('\n').length} lines
                    {lastCodeUpdateAt && ` • Updated ${formatTimestamp(lastCodeUpdateAt)}`}
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <span className="recording-dot-pulse-small"></span>
                      Streaming...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={showShortcutsPanel}
        onClose={() => setShowShortcutsPanel(false)}
        shortcuts={[
          {
            key: 'a',
            ctrlKey: true,
            shiftKey: true,
            description: 'Add assertion',
            handler: () => {
              if (isRecording) {
                notifications.show({
                  message: 'Add assertion feature coming soon',
                  color: 'info',
                });
              }
            },
          },
          {
            key: 'p',
            ctrlKey: true,
            shiftKey: true,
            description: 'Pause/Resume recording',
            handler: () => {
              if (isRecording) {
                setIsPaused(!isPaused);
              }
            },
          },
          {
            key: 's',
            ctrlKey: true,
            shiftKey: true,
            description: 'Stop recording',
            handler: () => {
              if (isRecording) {
                handleStopRecording();
              }
            },
          },
        ]}
      />

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

      {/* Web Login Dialog for FH Web workspaces */}
      {currentWorkspace?.type === 'web-demo' && (
        <WebLoginDialog
          opened={showWebLogin}
          onClose={() => setShowWebLogin(false)}
          onLoginSuccess={() => {
            // Storage state saved, user can now record without logging in again
            setError(null);
          }}
          webUrl={((currentWorkspace.settings || {}) as { baseUrl?: string }).baseUrl}
        />
      )}
    </div>
  );
};

export default RecordScreen;
