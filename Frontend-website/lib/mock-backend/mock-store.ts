/**
 * In-memory state store for web demo
 * Simulates workspace persistence
 */

export interface MockWorkspace {
  id: string;
  name: string;
  type: 'd365' | 'salesforce' | 'generic';
  version: string;
  createdWith: string;
  lastOpenedWith: string;
  createdAt: string;
  updatedAt: string;
  workspacePath: string;
  settings?: Record<string, unknown>;
}

export interface MockState {
  currentWorkspace: MockWorkspace | null;
  currentTest: string | null;
  isRecording: boolean;
  recordingSteps: any[];
  currentCode: string | null;
  codegenListeners: Set<(update: { workspacePath: string; content: string; timestamp: string }) => void>;
  recorderListeners: Set<(update: { workspacePath: string; content: string; timestamp: string }) => void>;
  testRunListeners: Set<(event: any) => void>;
}

class MockStore {
  private state: MockState = {
    currentWorkspace: null,
    currentTest: null,
    isRecording: false,
    recordingSteps: [],
    currentCode: null,
    codegenListeners: new Set(),
    recorderListeners: new Set(),
    testRunListeners: new Set(),
  };

  getState(): MockState {
    return { ...this.state };
  }

  setCurrentWorkspace(workspace: MockWorkspace | null): void {
    this.state.currentWorkspace = workspace;
  }

  getCurrentWorkspace(): MockWorkspace | null {
    return this.state.currentWorkspace;
  }

  setCurrentTest(testName: string | null): void {
    this.state.currentTest = testName;
  }

  getCurrentTest(): string | null {
    return this.state.currentTest;
  }

  setIsRecording(isRecording: boolean): void {
    this.state.isRecording = isRecording;
  }

  getIsRecording(): boolean {
    return this.state.isRecording;
  }

  setRecordingSteps(steps: any[]): void {
    this.state.recordingSteps = steps;
  }

  getRecordingSteps(): any[] {
    return this.state.recordingSteps;
  }

  setCurrentCode(code: string | null): void {
    this.state.currentCode = code;
  }

  getCurrentCode(): string | null {
    return this.state.currentCode;
  }

  getCodegenListeners(): Set<(update: { workspacePath: string; content: string; timestamp: string }) => void> {
    return this.state.codegenListeners;
  }

  getRecorderListeners(): Set<(update: { workspacePath: string; content: string; timestamp: string }) => void> {
    return this.state.recorderListeners;
  }

  getTestRunListeners(): Set<(event: any) => void> {
    return this.state.testRunListeners;
  }

  clearAllListeners(): void {
    this.state.codegenListeners.clear();
    this.state.recorderListeners.clear();
    this.state.testRunListeners.clear();
  }
}

export const mockStore = new MockStore();

