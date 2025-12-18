import * as path from 'path';
import * as fs from 'fs';
import { DataWriteRequest, DataWriteResponse, DataRow, WorkspaceType } from '../../types/v1.5';

/**
 * Service for writing JSON data files.
 * 
 * The DataWriter manages test data files for data-driven testing:
 * - Writing parameterized test data to JSON files
 * - Reading existing data files
 * - Creating backups before overwriting
 * - Organizing data by workspace type (d365, salesforce, koerber, web)
 * 
 * @remarks
 * Data files are stored at: tests/<platformDir>/data/<testName>Data.json
 * This matches the bundle structure used by SpecWriter.
 */
export class DataWriter {
  /**
   * Write data file with test datasets
   * Data files are stored at: tests/<platformDir>/data/<testName>Data.json
   * This matches the bundle structure used by SpecWriter
   */
  async writeData(request: DataWriteRequest): Promise<DataWriteResponse> {
    try {
      // Determine workspace type to use correct platform directory
      const workspaceType = this.getWorkspaceType(request.workspacePath);
      const platformDir = workspaceType === 'd365' ? 'd365' 
                        : workspaceType === 'salesforce' ? 'salesforce'
                        : workspaceType === 'koerber' ? 'koerber'
                        : 'web';
      
      // Use the same path structure as SpecWriter: tests/<platformDir>/data/<testName>Data.json
      const testsDir = path.join(request.workspacePath, 'tests');
      const dataDir = path.join(testsDir, platformDir, 'data');
      fs.mkdirSync(dataDir, { recursive: true });

      // Convert test name to kebab-case filename (same as SpecGenerator.flowNameToFileName)
      const fileName = request.testName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Write data file with Data suffix to match SpecWriter convention
      const dataPath = path.join(dataDir, `${fileName}Data.json`);
      
      // Create backup if file exists
      if (fs.existsSync(dataPath)) {
        const backupPath = `${dataPath}.bak`;
        fs.copyFileSync(dataPath, backupPath);
      }

      // Write JSON with pretty formatting
      fs.writeFileSync(dataPath, JSON.stringify(request.rows, null, 2), 'utf-8');

      return {
        success: true,
        dataPath: path.relative(request.workspacePath, dataPath),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to write data file',
      };
    }
  }

  /**
   * Read data file
   * Data files are stored at: tests/<platformDir>/data/<testName>Data.json
   * This matches the bundle structure used by SpecWriter
   */
  async readData(workspacePath: string, testName: string): Promise<DataRow[]> {
    // Determine workspace type to use correct platform directory
    const workspaceType = this.getWorkspaceType(workspacePath);
    const platformDir = workspaceType === 'd365' ? 'd365' 
                      : workspaceType === 'salesforce' ? 'salesforce'
                      : workspaceType === 'koerber' ? 'koerber'
                      : 'web';
    
    // Use the same path structure as SpecWriter: tests/<platformDir>/data/<testName>Data.json
    const testsDir = path.join(workspacePath, 'tests');
    const dataDir = path.join(testsDir, platformDir, 'data');
    
    // Convert test name to kebab-case filename (same as SpecGenerator.flowNameToFileName)
    const fileName = testName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Read data file with Data suffix to match SpecWriter convention
    const dataPath = path.join(dataDir, `${fileName}Data.json`);
    
    if (!fs.existsSync(dataPath)) {
      return [];
    }

    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Get workspace type from workspace path
   */
  private getWorkspaceType(workspacePath: string): WorkspaceType {
    try {
      const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
      if (fs.existsSync(workspaceJsonPath)) {
        const workspaceMeta = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8'));
        return workspaceMeta.type || 'd365';
      }
    } catch (error) {
      console.warn('[DataWriter] Failed to read workspace type:', error);
    }
    return 'd365'; // Default to d365 if can't determine
  }
}

