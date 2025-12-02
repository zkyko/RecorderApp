import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { TraceOpenRequest, TraceOpenResponse, ReportOpenRequest, ReportOpenResponse } from '../../types/v1.5';
import { runPlaywright } from '../utils/playwrightRuntime';

/**
 * Service for hosting Playwright trace and report viewers
 */
export class TraceServer {
  private traceProcess: ChildProcess | null = null;
  private reportProcess: ChildProcess | null = null;
  private tracePort: number | null = null;
  private reportPort: number | null = null;
  private reportServer: http.Server | null = null;
  private reportServerPort: number | null = null;

  /**
   * Open trace viewer
   * v1.5: Accepts workspace-relative trace path
   */
  async openTrace(request: TraceOpenRequest): Promise<TraceOpenResponse> {
    try {
      // Stop existing trace server
      if (this.traceProcess) {
        this.traceProcess.kill();
        this.traceProcess = null;
      }

      // Resolve trace path (workspace-relative)
      const tracePath = path.isAbsolute(request.traceZipPath)
        ? request.traceZipPath
        : path.join(request.workspacePath, request.traceZipPath);

      if (!fs.existsSync(tracePath)) {
        return {
          success: false,
          error: `Trace file not found: ${tracePath}`,
        };
      }

      // Use the new runtime helper for show-trace command
      const args = [
        'show-trace',
        tracePath,
        '--port=0',
      ];

      this.traceProcess = runPlaywright(args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Parse output to find port
      return new Promise((resolve) => {
        // Handle spawn errors
        this.traceProcess!.on('error', (error: any) => {
          let errorMessage = error.message || 'Failed to open trace';
          if (error.code === 'ENOENT' || error.message?.includes('ENOENT')) {
            errorMessage = 'System command line is restricted. This often happens on corporate devices. Please ensure Node.js and npm/npx are accessible.';
          }
          resolve({
            success: false,
            error: errorMessage,
          });
        });
        let output = '';
        
        this.traceProcess!.stdout?.on('data', (data) => {
          output += data.toString();
          // Look for port in output (e.g., "Listening on http://localhost:9333")
          const portMatch = output.match(/http:\/\/localhost:(\d+)/);
          if (portMatch) {
            this.tracePort = parseInt(portMatch[1], 10);
            resolve({
              success: true,
              url: `http://localhost:${this.tracePort}`,
            });
          }
        });

        this.traceProcess!.stderr?.on('data', (data) => {
          output += data.toString();
          const portMatch = output.match(/http:\/\/localhost:(\d+)/);
          if (portMatch) {
            this.tracePort = parseInt(portMatch[1], 10);
            resolve({
              success: true,
              url: `http://localhost:${this.tracePort}`,
            });
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.tracePort) {
            // Default port if we can't detect it
            this.tracePort = 9333;
            resolve({
              success: true,
              url: `http://localhost:${this.tracePort}`,
            });
          }
        }, 10000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to open trace',
      };
    }
  }

  /**
   * Open Allure report viewer
   * v1.5: Serves Allure static report via HTTP server (file:// doesn't work in Electron iframes)
   */
  async openReport(request: ReportOpenRequest): Promise<ReportOpenResponse> {
    try {
      // Stop existing report server
      if (this.reportServer) {
        this.reportServer.close();
        this.reportServer = null;
        this.reportServerPort = null;
      }

      // Resolve Allure report directory using runId
      let reportDir: string | null = null;
      
      if (request.runId) {
        // Load run metadata to get allureReportPath
        const indexPath = path.join(request.workspacePath, 'runs', 'index.json');
        if (fs.existsSync(indexPath)) {
          try {
            const content = fs.readFileSync(indexPath, 'utf-8');
            const index = JSON.parse(content);
            const run = index.runs?.find((r: any) => r.runId === request.runId);
            if (run?.allureReportPath) {
              const reportPath = path.isAbsolute(run.allureReportPath)
                ? run.allureReportPath
                : path.join(request.workspacePath, run.allureReportPath);
              reportDir = path.dirname(reportPath);
            }
          } catch (error) {
            console.warn('[TraceServer] Failed to read runs index:', error);
          }
        }
      }

      // Fallback: try to find latest Allure report
      if (!reportDir) {
        const allureReportDir = path.join(request.workspacePath, 'allure-report');
        if (fs.existsSync(allureReportDir)) {
          const runDirs = fs.readdirSync(allureReportDir)
            .map(dir => path.join(allureReportDir, dir))
            .filter(dir => fs.statSync(dir).isDirectory())
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          
          if (runDirs.length > 0) {
            reportDir = runDirs[0];
          }
        }
      }

      if (!reportDir || !fs.existsSync(reportDir)) {
        return {
          success: false,
          error: `Allure report not found. Run a test first to generate a report.`,
        };
      }

      // Verify index.html exists
      const indexPath = path.join(reportDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return {
          success: false,
          error: `Allure report index.html not found in ${reportDir}`,
        };
      }

      // Start HTTP server to serve the Allure report directory
      return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
          // Handle CORS
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          // Map request URL to file path
          let filePath = req.url || '/';
          if (filePath === '/') {
            filePath = '/index.html';
          }
          
          const fullPath = path.join(reportDir!, filePath);
          
          // Security: ensure file is within reportDir
          const resolvedReportDir = path.resolve(reportDir!);
          const resolvedFullPath = path.resolve(fullPath);
          if (!resolvedFullPath.startsWith(resolvedReportDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
          }

          // Check if file exists
          if (!fs.existsSync(fullPath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }

          // Determine content type
          const ext = path.extname(fullPath).toLowerCase();
          const contentTypes: Record<string, string> = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
          };
          const contentType = contentTypes[ext] || 'application/octet-stream';

          // Read and serve file
          try {
            const content = fs.readFileSync(fullPath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
          } catch (error) {
            res.writeHead(500);
            res.end('Internal Server Error');
          }
        });

        // Find available port
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          if (address && typeof address === 'object') {
            this.reportServer = server;
            this.reportServerPort = address.port;
            resolve({
              success: true,
              url: `http://127.0.0.1:${address.port}/`,
            });
          } else {
            resolve({
              success: false,
              error: 'Failed to start report server',
            });
          }
        });

        server.on('error', (error) => {
          console.error('[TraceServer] Report server error:', error);
          resolve({
            success: false,
            error: error.message || 'Failed to start report server',
          });
        });
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to open report',
      };
    }
  }

  /**
   * Find project root (where playwright.config.ts is)
   */
  private findProjectRoot(workspacePath: string): string {
    // Start from workspace path and walk up to find project root
    let currentPath = workspacePath;
    const root = path.parse(currentPath).root;
    
    while (currentPath !== root) {
      const configPath = path.join(currentPath, 'playwright.config.ts');
      if (fs.existsSync(configPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    
    // Fallback: assume project root is where node_modules might be
    // This is a heuristic - in practice, workspacePath should be a subdirectory
    // For now, return a reasonable default (could be improved)
    return process.cwd();
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    if (this.traceProcess) {
      this.traceProcess.kill();
      this.traceProcess = null;
    }
    if (this.reportProcess) {
      this.reportProcess.kill();
      this.reportProcess = null;
    }
    if (this.reportServer) {
      this.reportServer.close();
      this.reportServer = null;
      this.reportServerPort = null;
    }
  }
}

