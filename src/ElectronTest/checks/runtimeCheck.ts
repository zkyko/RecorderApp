import { ElectronTestResultWithoutDuration } from '../types';
import { getRuntimeInfo, hasBundledRuntime, getBundledRuntimePaths, getInstalledBrowsers } from '../../main/utils/playwrightRuntime';
import * as fs from 'fs';

export async function runtimeCheck(): Promise<ElectronTestResultWithoutDuration> {
  const startInfo = getRuntimeInfo();

  // Basic sanity: we expect some kind of runtime to be detectable
  if (!startInfo || !startInfo.type) {
    return {
      id: 'runtime',
      label: 'Playwright Runtime',
      status: 'FAIL',
      details: 'Unable to detect Playwright runtime.',
    };
  }

  // If we have a bundled runtime, ensure its browser directory looks sane
  if (hasBundledRuntime()) {
    const paths = getBundledRuntimePaths();
    if (!paths) {
      return {
        id: 'runtime',
        label: 'Playwright Runtime',
        status: 'FAIL',
        details: 'Bundled runtime reported but paths are missing.',
      };
    }

    try {
      if (!fs.existsSync(paths.browsersPath)) {
        return {
          id: 'runtime',
          label: 'Playwright Runtime',
          status: 'FAIL',
          details: `Bundled browsers directory does not exist: ${paths.browsersPath}`,
        };
      }
      const entries = fs.readdirSync(paths.browsersPath);
      if (!entries.length) {
        return {
          id: 'runtime',
          label: 'Playwright Runtime',
          status: 'FAIL',
          details: `Bundled browsers directory is empty: ${paths.browsersPath}`,
        };
      }
    } catch (err: any) {
      return {
        id: 'runtime',
        label: 'Playwright Runtime',
        status: 'FAIL',
        details: `Failed to inspect bundled runtime: ${err?.message || String(err)}`,
      };
    }
  }

  const browsers = getInstalledBrowsers();

  return {
    id: 'runtime',
    label: 'Playwright Runtime',
    status: 'PASS',
    details: `Runtime type=${startInfo.type}, Browsers=${browsers.join(', ') || 'none detected'}`,
  };
}

// Attach metadata for orchestrator error handling
(runtimeCheck as any).id = 'runtime';
(runtimeCheck as any).label = 'Playwright Runtime';


