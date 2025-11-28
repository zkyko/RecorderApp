import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';
import { CodegenStartRequest, CodegenStartResponse, CodegenStopResponse, CodegenCodeUpdate } from '../../types/v1.5';

/**
 * Service for launching and managing Playwright Codegen
 */
export class CodegenService {
  private currentProcess: ChildProcess | null = null;
  private outputPath: string | null = null;
  private fileWatcher: fs.FSWatcher | null = null;
  private mainWindow: BrowserWindow | null = null;
  private workspacePath: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Start Playwright codegen
   */
  async start(request: CodegenStartRequest): Promise<CodegenStartResponse> {
    // Kill existing process if any
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }

    try {
      // Ensure tmp directory exists
      const tmpDir = path.join(request.workspacePath, 'tmp');
      fs.mkdirSync(tmpDir, { recursive: true });

      // Set output path
      this.outputPath = path.join(tmpDir, 'codegen-output.ts');

      // Build codegen command
      // Note: Playwright codegen uses --load-storage, not --storage-state
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = [
        'playwright',
        'codegen',
        request.envUrl,
      ];

      // Add storage state if provided and file exists
      if (request.storageStatePath && fs.existsSync(request.storageStatePath)) {
        args.push('--load-storage', request.storageStatePath);
      }

      // Add output path
      args.push('--output', this.outputPath);

      console.log('[CodegenService] Starting codegen with command:', command, args.join(' '));

      // Spawn process - use 'inherit' stdio so browser window shows up
      // In Electron, we need to let the process have its own console/display
      this.currentProcess = spawn(command, args, {
        shell: process.platform === 'win32',
        stdio: 'inherit', // This allows the browser window to display
        detached: false,
      });

      // Handle process errors
      this.currentProcess.on('error', (error) => {
        console.error('[CodegenService] Process error:', error);
      });

      // Start watching the output file for live updates
      this.startFileWatcher(this.outputPath, request.workspacePath);

      // Return success with PID
      return {
        success: true,
        pid: this.currentProcess.pid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to start codegen',
      };
    }
  }

  /**
   * Stop codegen and return raw code
   */
  async stop(): Promise<CodegenStopResponse> {
    try {
      // Kill process if running
      if (this.currentProcess) {
        this.currentProcess.kill();
        this.currentProcess = null;
      }

      // Send final code update before stopping watcher
      if (this.outputPath && this.workspacePath && fs.existsSync(this.outputPath)) {
        this.readAndSendCode(this.outputPath, this.workspacePath);
      }

      // Stop watching file
      this.stopFileWatcher();

      // Read output file if it exists
      let rawCode: string | undefined;
      if (this.outputPath && fs.existsSync(this.outputPath)) {
        rawCode = fs.readFileSync(this.outputPath, 'utf-8');
      }

      return {
        success: true,
        rawCode,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to stop codegen',
      };
    }
  }

  /**
   * Set main window for sending IPC events
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Watch the codegen output file and send updates to renderer
   */
  private startFileWatcher(outputPath: string, workspacePath: string): void {
    // Stop existing watcher if any
    this.stopFileWatcher();

    this.workspacePath = workspacePath;

    // Initial read if file exists
    if (fs.existsSync(outputPath)) {
      this.readAndSendCode(outputPath, workspacePath);
    }

    // Watch the directory instead of the file (file might not exist yet)
    const watchDir = path.dirname(outputPath);
    const watchFile = path.basename(outputPath);

    // Watch for file changes
    this.fileWatcher = fs.watch(watchDir, { persistent: true }, (eventType, filename) => {
      // Only process if it's our target file
      if (filename === watchFile || filename === null) {
        if (eventType === 'rename' || eventType === 'change') {
          // Small delay to ensure file write is complete
          setTimeout(() => {
            if (fs.existsSync(outputPath)) {
              this.readAndSendCode(outputPath, workspacePath);
            }
          }, 300);
        }
      }
    });

    // Also poll the file periodically as a fallback (in case watch misses changes)
    this.pollInterval = setInterval(() => {
      if (!this.currentProcess || this.currentProcess.killed) {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
        return;
      }
      if (fs.existsSync(outputPath)) {
        this.readAndSendCode(outputPath, workspacePath);
      }
    }, 1000); // Poll every second

    console.log('[CodegenService] Started watching file:', outputPath);
  }

  /**
   * Read codegen output file and send to renderer
   */
  private readAndSendCode(outputPath: string, workspacePath: string): void {
    try {
      if (fs.existsSync(outputPath)) {
        const content = fs.readFileSync(outputPath, 'utf-8');
        const update: CodegenCodeUpdate = {
          workspacePath,
          content,
          timestamp: new Date().toISOString(),
        };

        // Send to renderer via IPC
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          try {
            this.mainWindow.webContents.send('codegen:code-update', update);
            console.log('[CodegenService] Sent code update, length:', content.length);
          } catch (error) {
            console.error('[CodegenService] Error sending update:', error);
          }
        } else {
          // Window not ready yet - this is normal during startup
          // The polling will retry and eventually send when window is ready
          console.log('[CodegenService] Main window not ready yet, will retry on next poll');
        }
      } else {
        console.log('[CodegenService] Output file does not exist yet:', outputPath);
      }
    } catch (error) {
      console.error('[CodegenService] Error reading codegen output:', error);
    }
  }

  /**
   * Stop watching the file
   */
  private stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('[CodegenService] Stopped watching file');
  }

  /**
   * Check if codegen is currently running
   */
  isRunning(): boolean {
    return this.currentProcess !== null && !this.currentProcess.killed;
  }
}

