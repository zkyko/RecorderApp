import { ElectronTestResult } from './types';
import { runtimeCheck } from './checks/runtimeCheck';
import { configCheck } from './checks/configCheck';
import { workspaceCheck } from './checks/workspaceCheck';
import { flowLocalRunCheck } from './checks/flowLocalRunCheck';
import { browserstackCheck } from './checks/browserstackCheck';
import { browserstackTmCheck } from './checks/browserstackTmCheck';
import { jiraCheck } from './checks/jiraCheck';
import { updaterCheck } from './checks/updaterCheck';
import { ragCheck } from './checks/ragCheck';

type CheckFn = (() => Promise<Omit<ElectronTestResult, 'durationMs'>>) & {
  id?: string;
  label?: string;
};

const CHECKS: CheckFn[] = [
  runtimeCheck as CheckFn,
  configCheck as CheckFn,
  workspaceCheck as CheckFn,
  flowLocalRunCheck as CheckFn,
  browserstackCheck as CheckFn,
  browserstackTmCheck as CheckFn,
  jiraCheck as CheckFn,
  updaterCheck as CheckFn,
  ragCheck as CheckFn,
];

export async function runAllElectronTests(): Promise<ElectronTestResult[]> {
  const results: ElectronTestResult[] = [];

  for (const check of CHECKS) {
    const started = Date.now();
    try {
      const base = await check();
      results.push({
        ...base,
        durationMs: Date.now() - started,
      });
    } catch (err: any) {
      const fallbackId = (check as any).id || 'unknown';
      const fallbackLabel = (check as any).label || 'Unknown check';
      results.push({
        id: fallbackId,
        label: fallbackLabel,
        status: 'FAIL',
        durationMs: Date.now() - started,
        details: err?.message || String(err),
      });
    }
  }

  return results;
}


