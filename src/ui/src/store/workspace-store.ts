import { create } from 'zustand';
import { WorkspaceMeta } from '../../../types/v1.5';

interface WorkspaceState {
  workspacePath: string | null;
  currentWorkspace: WorkspaceMeta | null;
  currentTest: string | null;
  activeRunId: string | null;
  setWorkspacePath: (path: string | null) => void;
  setCurrentWorkspace: (workspace: WorkspaceMeta | null) => void;
  setCurrentTest: (testName: string | null) => void;
  setActiveRunId: (runId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspacePath: null,
  currentWorkspace: null,
  currentTest: null,
  activeRunId: null,
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setCurrentWorkspace: (workspace) => set({ 
    currentWorkspace: workspace,
    workspacePath: workspace?.workspacePath || null,
  }),
  setCurrentTest: (testName) => set({ currentTest: testName }),
  setActiveRunId: (runId) => set({ activeRunId: runId }),
}));

