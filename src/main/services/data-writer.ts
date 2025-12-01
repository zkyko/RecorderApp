import * as path from 'path';
import * as fs from 'fs';
import { DataWriteRequest, DataWriteResponse, DataRow } from '../../types/v1.5';

/**
 * Service for writing JSON data files
 */
export class DataWriter {
  /**
   * Write data file with test datasets
   * Data files are stored at: tests/d365/data/<testName>Data.json
   * This matches the bundle structure used by SpecWriter
   */
  async writeData(request: DataWriteRequest): Promise<DataWriteResponse> {
    try {
      // Use the same path structure as SpecWriter: tests/d365/data/<testName>Data.json
      const testsDir = path.join(request.workspacePath, 'tests');
      const dataDir = path.join(testsDir, 'd365', 'data');
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
   * Data files are stored at: tests/d365/data/<testName>Data.json
   * This matches the bundle structure used by SpecWriter
   */
  async readData(workspacePath: string, testName: string): Promise<DataRow[]> {
    // Use the same path structure as SpecWriter: tests/d365/data/<testName>Data.json
    const testsDir = path.join(workspacePath, 'tests');
    const dataDir = path.join(testsDir, 'd365', 'data');
    
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
}

