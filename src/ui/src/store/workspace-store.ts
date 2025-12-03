import { create } from 'zustand';
import { WorkspaceMeta } from '../../../types/v1.5';

interface WorkspaceState {
  workspacePath: string | null;
  currentWorkspace: WorkspaceMeta | null;
  currentTest: string | null;
  activeRunId: string | null;
  isSwitchingWorkspace: boolean;
  switchingToName: string | null;
  setWorkspacePath: (path: string | null) => void;
  setCurrentWorkspace: (workspace: WorkspaceMeta | null) => void;
  setCurrentTest: (testName: string | null) => void;
  setActiveRunId: (runId: string | null) => void;
  setWorkspaceSwitching: (isSwitching: boolean, targetName?: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspacePath: null,
  currentWorkspace: null,
  currentTest: null,
  activeRunId: null,
  isSwitchingWorkspace: false,
  switchingToName: null,
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setCurrentWorkspace: (workspace) =>
    set({
      currentWorkspace: workspace,
      workspacePath: workspace?.workspacePath || null,
      // Once a workspace is fully set, clear any switching state
      isSwitchingWorkspace: false,
      switchingToName: null,
    }),
  setCurrentTest: (testName) => set({ currentTest: testName }),
  setActiveRunId: (runId) => set({ activeRunId: runId }),
  setWorkspaceSwitching: (isSwitching, targetName = null) =>
    set({
      isSwitchingWorkspace: isSwitching,
      switchingToName: isSwitching ? targetName : null,
    }),
}));

