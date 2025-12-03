import { app } from 'electron';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Playwright Runtime Helper
 * 
 * Provides a fully self-contained Playwright runtime for QA Studio.
 * This allows the app to work on machines with no Node.js, npm, or npx installed.
 * 
 * The bundled runtime is expected at:
 * - Production: <app-resources>/playwright-runtime/
 * - Development: <project-root>/resources/playwright-runtime/
 * 
 * Structure:
 *   playwright-runtime/
 *     node.exe (or node binary)
 *     node_modules/
 *       @playwright/test/
 *       playwright/
 *     ms-playwright/ (browser binaries)
 */

interface PlaywrightRuntimePaths {
  nodePath: string;
  cliPath: string;
  browsersPath: string;
  runtimeRoot: string;
}

/**
 * Get the base path where the bundled Playwright runtime should be located
 */
function getPlaywrightRuntimeBasePath(): string {
  if (app.isPackaged) {
    // In production: Resources are next to the executable
    // This matches: process.resourcesPath + '/playwright-runtime'
    return path.join(process.resourcesPath, 'playwright-runtime');
  } else {
    // In development: Check project root first (where the runtime folder actually is)
    const devPaths = [
      path.join(process.cwd(), 'playwright-runtime'), // Root level (actual location)
      path.join(process.cwd(), 'resources', 'playwright-runtime'),
      path.join(__dirname, '..', '..', 'playwright-runtime'),
    ];
    
    // Return the first existing path, or default to project root location
    for (const devPath of devPaths) {
      if (fs.existsSync(devPath)) {
        return devPath;
      }
    }
    
    // Default to project root location (may not exist yet)
    return path.join(process.cwd(), 'playwright-runtime');
  }
}

/**
 * Get the Node.js executable name for the current platform
 */
function getNodeExecutableName(): string {
  if (process.platform === 'win32') {
    return 'node.exe';
  }
  return 'node';
}

/**
 * Find the Playwright CLI path in the bundled runtime
 * Checks multiple possible locations
 */
function findPlaywrightCLI(runtimeBase: string): string | null {
  // Try multiple possible CLI locations
  const possibleCliPaths = [
    // @playwright/test CLI (test framework)
    path.join(runtimeBase, 'node_modules', '@playwright', 'test', 'cli.js'),
    // playwright CLI (core library)
    path.join(runtimeBase, 'node_modules', 'playwright', 'cli.js'),
    // Alternative location
    path.join(runtimeBase, 'node_modules', '.bin', 'playwright'),
  ];
  
  for (const cliPath of possibleCliPaths) {
    if (fs.existsSync(cliPath)) {
      try {
        const stats = fs.statSync(cliPath);
        if (stats.isFile()) {
          return cliPath;
        }
      } catch {
        // Continue to next path
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Check if the bundled Playwright runtime exists and is valid
 */
function isBundledRuntimeAvailable(): boolean {
  const runtimeBase = getPlaywrightRuntimeBasePath();
  const nodePath = path.join(runtimeBase, getNodeExecutableName());
  
  // Check if Node.js exists
  if (!fs.existsSync(nodePath)) {
    return false;
  }
  
  // Check if CLI exists in any location
  const cliPath = findPlaywrightCLI(runtimeBase);
  return cliPath !== null;
}

/**
 * Get paths to bundled Playwright runtime components
 * Returns null if runtime is not available
 */
export function getBundledRuntimePaths(): PlaywrightRuntimePaths | null {
  if (!isBundledRuntimeAvailable()) {
    return null;
  }
  
  const runtimeBase = getPlaywrightRuntimeBasePath();
  const nodePath = path.join(runtimeBase, getNodeExecutableName());
  const cliPath = findPlaywrightCLI(runtimeBase);
  
  if (!cliPath) {
    return null;
  }
  
  // Browsers path - Playwright installs browsers to a user data directory by default
  // but we can override with PLAYWRIGHT_BROWSERS_PATH
  // For bundled runtime, browsers should be in ms-playwright/ subdirectory
  const browsersPath = path.join(runtimeBase, 'ms-playwright');
  
  // Log runtime paths in packaged builds for debugging
  if (app.isPackaged) {
    console.log('[PlaywrightRuntime] Bundled runtime detected:');
    console.log('[PlaywrightRuntime]   runtimeRoot:', runtimeBase);
    console.log('[PlaywrightRuntime]   nodePath:', nodePath);
    console.log('[PlaywrightRuntime]   cliPath:', cliPath);
    console.log('[PlaywrightRuntime]   browsersPath:', browsersPath);
    console.log('[PlaywrightRuntime]   process.resourcesPath:', process.resourcesPath);
  }
  
  return {
    nodePath,
    cliPath,
    browsersPath,
    runtimeRoot: runtimeBase,
  };
}

/**
 * Check if bundled runtime is available
 */
export function hasBundledRuntime(): boolean {
  return isBundledRuntimeAvailable();
}

/**
 * Get information about the current Playwright runtime status
 */
export function getRuntimeInfo(): {
  type: 'bundled' | 'system' | 'unavailable';
  paths?: PlaywrightRuntimePaths;
  message: string;
} {
  if (hasBundledRuntime()) {
    const paths = getBundledRuntimePaths();
    return {
      type: 'bundled',
      paths: paths || undefined,
      message: 'Using bundled Playwright runtime (self-contained).',
    };
  }
  
  // Check if system npx is available
  try {
    // Try to spawn npx --version as a quick check (but don't wait)
    const testProcess = spawn('npx', ['--version'], {
      shell: true,
      stdio: 'ignore',
    });
    
    // Don't wait, just check if spawn succeeded
    // If it fails immediately, we'll catch the error
    testProcess.on('error', () => {
      // System npx not available
    });
    
    // For now, assume system is available if we can spawn (optimistic)
    // Actual availability will be checked when running commands
    return {
      type: 'system',
      message: 'Bundled runtime missing — falling back to system npx.',
    };
  } catch {
    return {
      type: 'unavailable',
      message: 'Playwright cannot run because your system command-line tools are restricted.',
    };
  }
}

/**
 * Run a Playwright command using either bundled runtime or system npx
 * 
 * @param args - Arguments to pass to Playwright CLI (e.g., ['install', 'chromium'])
 * @param options - Additional spawn options (cwd, env, stdio, etc.)
 * @returns ChildProcess instance
 * 
 * @throws Error if runtime is unavailable and spawn fails
 */
export function runPlaywright(
  args: string[],
  options: SpawnOptions & { cwd?: string } = {}
): ChildProcess {
  const runtimePaths = getBundledRuntimePaths();
  
  // Normalize args: remove 'playwright' prefix if present (it's handled differently for bundled vs npx)
  const normalizedArgs = args[0] === 'playwright' ? args.slice(1) : args;
  
  if (runtimePaths) {
    // Use bundled runtime
    const { nodePath, cliPath, browsersPath, runtimeRoot } = runtimePaths;
    
    // Set up environment with browser path override
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      // Ensure Node.js can find its own modules
      NODE_PATH: path.join(runtimeRoot, 'node_modules'),
    };
    
    // Merge with user-provided env
    const finalEnv = { ...env, ...options.env };
    
    // Use the bundled Node.js to run Playwright CLI
    // The CLI script at @playwright/test/cli.js expects subcommand directly
    // e.g., node cli.js install (not node cli.js playwright install)
    // So we pass normalizedArgs which should be ['install'], ['test', ...], etc.
    
    console.log('[PlaywrightRuntime] Using bundled runtime:', nodePath);
    console.log('[PlaywrightRuntime] CLI path:', cliPath);
    console.log('[PlaywrightRuntime] Args:', normalizedArgs.join(' '));
    
    return spawn(nodePath, [cliPath, ...normalizedArgs], {
      cwd: options.cwd || runtimeRoot,
      shell: false, // Don't use shell for bundled runtime
      env: finalEnv,
      stdio: options.stdio || 'pipe',
      ...Object.fromEntries(
        Object.entries(options).filter(([key]) => 
          !['cwd', 'shell', 'env', 'stdio'].includes(key)
        )
      ),
    });
  } else {
    // Fallback to system npx
    console.log('[PlaywrightRuntime] Bundled runtime not found, falling back to system npx');
    
    // For npx, we need 'playwright' as the command name
    const npxArgs = ['playwright', ...normalizedArgs];
    
    // Use shell: true for cross-platform compatibility
    // This still requires npx to be in PATH
    return spawn('npx', npxArgs, {
      cwd: options.cwd,
      shell: true,
      env: { ...process.env, ...options.env },
      stdio: options.stdio || 'pipe',
      ...Object.fromEntries(
        Object.entries(options).filter(([key]) => 
          !['cwd', 'shell', 'env', 'stdio'].includes(key)
        )
      ),
    });
  }
}

/**
 * Run Playwright and return a promise that resolves with the result
 * Useful for one-off commands like version checks
 */
export async function runPlaywrightOnce(
  args: string[],
  options: SpawnOptions & { cwd?: string; timeout?: number } = {}
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 30000; // 30 second default
    const child = runPlaywright(args, options);
    
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.kill();
        reject(new Error(`Playwright command timed out after ${timeout}ms`));
      }
    }, timeout);
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('error', (err: any) => {
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        
        // Enhance error messages for better UX
        if (err.code === 'ENOENT' || err.message?.includes('ENOENT')) {
          if (hasBundledRuntime()) {
            reject(new Error(
              'Playwright runtime missing or corrupted. Please reinstall QA Studio.'
            ));
          } else {
            reject(new Error(
              'Playwright cannot run because your system command-line tools are restricted. ' +
              'This often happens on corporate devices. Please ensure Node.js and npm/npx are accessible, ' +
              'or contact your IT administrator.'
            ));
          }
        } else {
          reject(err);
        }
      }
    });
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      }
    });
  });
}

/**
 * Get Node.js version from bundled runtime or system
 */
export async function getNodeVersion(): Promise<string | null> {
  const runtimePaths = getBundledRuntimePaths();
  
  if (runtimePaths) {
    // Use bundled Node.js
    try {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
        const child = spawn(runtimePaths.nodePath, ['--version'], {
          shell: false,
          stdio: 'pipe',
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('error', reject);
        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code ?? 1 });
        });
      });
      
      if (result.exitCode === 0) {
        return result.stdout.trim();
      }
    } catch {
      return null;
    }
  } else {
    // Try system Node.js
    try {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
        const child = spawn('node', ['--version'], {
          shell: true,
          stdio: 'pipe',
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('error', reject);
        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code ?? 1 });
        });
      });
      
      if (result.exitCode === 0) {
        return result.stdout.trim();
      }
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Get list of installed Playwright browsers
 */
export function getInstalledBrowsers(): string[] {
  const browsers: string[] = [];
  let browsersPath: string | null = null;
  
  // Try bundled runtime first
  if (hasBundledRuntime()) {
    const runtimePaths = getBundledRuntimePaths();
    if (runtimePaths) {
      browsersPath = runtimePaths.browsersPath;
    }
  }
  
  // If no bundled runtime, check system location
  if (!browsersPath) {
    if (process.platform === 'win32') {
      browsersPath = path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
        'ms-playwright'
      );
    } else if (process.platform === 'darwin') {
      browsersPath = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
    } else {
      browsersPath = path.join(os.homedir(), '.cache', 'ms-playwright');
    }
  }
  
  if (!browsersPath || !fs.existsSync(browsersPath)) {
    return browsers;
  }
  
  try {
    const entries = fs.readdirSync(browsersPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const name = entry.name;
        // Detect browser type from directory name
        if (name.startsWith('chromium') || name.startsWith('chrome')) {
          browsers.push('Chromium');
        } else if (name.startsWith('firefox') || name.startsWith('ff')) {
          browsers.push('Firefox');
        } else if (name.startsWith('webkit')) {
          browsers.push('WebKit');
        } else if (name.startsWith('msedge')) {
          browsers.push('Microsoft Edge');
        }
      }
    }
    
    // Remove duplicates
    return Array.from(new Set(browsers)).sort();
  } catch {
    return browsers;
  }
}

