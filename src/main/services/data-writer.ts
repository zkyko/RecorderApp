import * as path from 'path';
import * as fs from 'fs';
import { DataWriteRequest, DataWriteResponse, DataRow } from '../../types/v1.5';

/**
 * Service for writing JSON data files
 */
export class DataWriter {
  /**
   * Write data file with test datasets
   */
  async writeData(request: DataWriteRequest): Promise<DataWriteResponse> {
    try {
      // Ensure data directory exists
      const dataDir = path.join(request.workspacePath, 'data');
      fs.mkdirSync(dataDir, { recursive: true });

      // Write data file
      const dataPath = path.join(dataDir, `${request.testName}.json`);
      
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
   */
  async readData(workspacePath: string, testName: string): Promise<DataRow[]> {
    const dataPath = path.join(workspacePath, 'data', `${testName}.json`);
    
    if (!fs.existsSync(dataPath)) {
      return [];
    }

    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  }
}

