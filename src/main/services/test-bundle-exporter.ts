import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import AdmZip from 'adm-zip';
import { WorkspaceType } from '../../types/v1.5';
import { SpecGenerator } from '../../generators/spec-generator';

export interface BundleManifest {
  version: string;
  testName: string;
  workspaceType: WorkspaceType;
  exportedAt: string;
  exportedBy: string; // app version
  files: {
    spec: string;
    metaJson: string;
    metaMd: string;
    data: string;
  };
}

export class TestBundleExporter {
  private specGenerator: SpecGenerator;

  constructor() {
    this.specGenerator = new SpecGenerator();
  }

  /**
   * Export a test bundle to a zip file
   */
  async exportBundle(
    workspacePath: string,
    testName: string,
    outputPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get workspace type
      const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
      let workspaceType: WorkspaceType = 'd365';
      
      if (fs.existsSync(workspaceJsonPath)) {
        const workspaceMeta = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8'));
        workspaceType = workspaceMeta.type || 'd365';
      }

      // Convert test name to kebab-case filename
      const fileName = this.specGenerator.flowNameToFileName(testName);
      const platformDir = workspaceType === 'd365' ? 'd365' 
                        : workspaceType === 'salesforce' ? 'salesforce'
                        : workspaceType === 'koerber' ? 'koerber'
                        : 'web';

      // Resolve file paths
      const bundleDir = path.join(workspacePath, 'tests', platformDir, 'specs', fileName);
      const specPath = path.join(bundleDir, `${fileName}.spec.ts`);
      const metaJsonPath = path.join(bundleDir, `${fileName}.meta.json`);
      const metaMdPath = path.join(bundleDir, `${fileName}.meta.md`);
      const dataPath = path.join(workspacePath, 'tests', platformDir, 'data', `${fileName}Data.json`);

      // Verify all required files exist
      const missingFiles: string[] = [];
      if (!fs.existsSync(specPath)) missingFiles.push('spec.ts');
      if (!fs.existsSync(metaJsonPath)) missingFiles.push('meta.json');
      if (!fs.existsSync(metaMdPath)) missingFiles.push('meta.md');
      if (!fs.existsSync(dataPath)) missingFiles.push('data.json');

      if (missingFiles.length > 0) {
        return {
          success: false,
          error: `Missing required files: ${missingFiles.join(', ')}`,
        };
      }

      // Create zip file
      const zip = new AdmZip();

      // Add files to zip
      zip.addLocalFile(specPath, '', `${fileName}.spec.ts`);
      zip.addLocalFile(metaJsonPath, '', `${fileName}.meta.json`);
      zip.addLocalFile(metaMdPath, '', `${fileName}.meta.md`);
      zip.addLocalFile(dataPath, '', `${fileName}Data.json`);

      // Create manifest
      const manifest: BundleManifest = {
        version: '1.0.0',
        testName,
        workspaceType,
        exportedAt: new Date().toISOString(),
        exportedBy: app.getVersion() || '2.0.0',
        files: {
          spec: `${fileName}.spec.ts`,
          metaJson: `${fileName}.meta.json`,
          metaMd: `${fileName}.meta.md`,
          data: `${fileName}Data.json`,
        },
      };

      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

      // Write zip file
      zip.writeZip(outputPath);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to export bundle',
      };
    }
  }
}

