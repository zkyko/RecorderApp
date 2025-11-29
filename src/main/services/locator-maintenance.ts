import * as fs from 'fs';
import * as path from 'path';
import {
  LocatorIndexEntry,
  LocatorStatusRecord,
  LocatorStatusUpdateRequest,
  LocatorStatusUpdateResponse,
  LocatorStatusState,
  LocatorUpdateRequest,
  LocatorUpdateResponse,
} from '../../types/v1.5';
import { SpecGenerator } from '../../generators/spec-generator';

export class LocatorMaintenanceService {
  private specGenerator: SpecGenerator;

  constructor() {
    this.specGenerator = new SpecGenerator();
  }

  private statusPath(workspacePath: string): string {
    const dir = path.join(workspacePath, 'locators');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'status.json');
  }

  private loadStatusMap(workspacePath: string): Record<string, LocatorStatusRecord & { locator?: string; type?: string; usedInTests?: string[]; testCount?: number; custom?: boolean }> {
    const statusFile = this.statusPath(workspacePath);
    if (!fs.existsSync(statusFile)) {
      return {};
    }
    try {
      const content = fs.readFileSync(statusFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('[LocatorMaintenance] Failed to parse status file, starting fresh');
      return {};
    }
  }

  private saveStatusMap(workspacePath: string, map: Record<string, any>): void {
    const statusFile = this.statusPath(workspacePath);
    fs.writeFileSync(statusFile, JSON.stringify(map, null, 2), 'utf-8');
  }

  private makeKey(type: LocatorIndexEntry['type'], locator: string): string {
    return `${type}:${locator.trim()}`;
  }

  public attachStatuses(entries: LocatorIndexEntry[], workspacePath: string): LocatorIndexEntry[] {
    const statusMap = this.loadStatusMap(workspacePath);
    const enriched = entries.map((entry) => {
      const key = this.makeKey(entry.type, entry.locator);
      if (statusMap[key]) {
        return { ...entry, status: statusMap[key] };
      }
      return entry;
    });
    
    // Also include custom locators from status map that aren't in entries
    const customLocators: LocatorIndexEntry[] = [];
    try {
      for (const [key, statusData] of Object.entries(statusMap)) {
        // Check if statusData has the required properties and is a custom locator
        if (statusData && typeof statusData === 'object' && 'custom' in statusData && statusData.custom) {
          if (statusData.locator && statusData.type) {
            // Check if this custom locator is already in the entries
            const exists = enriched.some(e => 
              this.makeKey(e.type, e.locator) === key
            );
            if (!exists) {
              customLocators.push({
                locator: String(statusData.locator),
                type: statusData.type as LocatorIndexEntry['type'],
                testCount: (statusData.testCount as number) || 0,
                usedInTests: Array.isArray(statusData.usedInTests) ? statusData.usedInTests : [],
                status: statusData as LocatorStatusRecord,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[LocatorMaintenance] Error processing custom locators:', error);
    }
    
    return [...enriched, ...customLocators];
  }

  public async addCustomLocator(workspacePath: string, locator: string, type: LocatorIndexEntry['type'], tests: string[] = []): Promise<{ success: boolean; error?: string }> {
    try {
      const statusMap = this.loadStatusMap(workspacePath);
      const key = this.makeKey(type, locator);
      
      if (statusMap[key] && !statusMap[key].custom) {
        return { success: false, error: 'Locator already exists in test files' };
      }
      
      statusMap[key] = {
        locator,
        type,
        usedInTests: tests,
        testCount: tests.length,
        custom: true,
        state: 'healthy',
        updatedAt: new Date().toISOString(),
      };
      
      this.saveStatusMap(workspacePath, statusMap);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add custom locator' };
    }
  }

  public async updateLocator(request: LocatorUpdateRequest): Promise<LocatorUpdateResponse> {
    try {
      const testsDir = path.join(request.workspacePath, 'tests');
      const updatedTests: string[] = [];
      const escapedOriginal = request.originalLocator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOriginal, 'g');

      for (const testName of request.tests) {
        // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
        const fileName = this.specGenerator.flowNameToFileName(testName);
        const specPath = path.join(testsDir, 'd365', 'specs', fileName, `${fileName}.spec.ts`);
        if (!fs.existsSync(specPath)) continue;

        const content = fs.readFileSync(specPath, 'utf-8');
        if (!content.includes(request.originalLocator)) continue;

        const newContent = content.replace(regex, request.updatedLocator);
        if (newContent !== content) {
          fs.writeFileSync(specPath, newContent, 'utf-8');
          updatedTests.push(testName);
        }
      }

      // If locator changed, carry over status entry
      if (request.originalLocator !== request.updatedLocator) {
        const statusMap = this.loadStatusMap(request.workspacePath);
        const oldKey = this.makeKey(request.type, request.originalLocator);
        const newKey = this.makeKey(request.type, request.updatedLocator);
        if (statusMap[oldKey]) {
          statusMap[newKey] = {
            ...statusMap[oldKey],
            updatedAt: new Date().toISOString(),
          };
          delete statusMap[oldKey];
          this.saveStatusMap(request.workspacePath, statusMap);
        }
      }

      return {
        success: true,
        updatedTests,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update locator' };
    }
  }

  public async setLocatorStatus(request: LocatorStatusUpdateRequest, mainWindow?: any): Promise<LocatorStatusUpdateResponse> {
    try {
      const statusMap = this.loadStatusMap(request.workspacePath);
      statusMap[request.locatorKey] = {
        state: request.status,
        note: request.note,
        updatedAt: new Date().toISOString(),
        lastTest: request.testName,
      };
      this.saveStatusMap(request.workspacePath, statusMap);

      // Emit IPC event to notify UI that locator status was updated
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('locator:status:updated', {
            workspacePath: request.workspacePath,
            locatorKey: request.locatorKey,
            status: statusMap[request.locatorKey],
          });
        } catch (error) {
          console.warn('[LocatorMaintenance] Failed to emit status update event:', error);
        }
      }

      return {
        success: true,
        status: statusMap[request.locatorKey],
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update locator status' };
    }
  }
}

