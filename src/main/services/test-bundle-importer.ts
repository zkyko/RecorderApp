import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { WorkspaceType } from '../../types/v1.5';
import { SpecGenerator } from '../../generators/spec-generator';
import { WorkspaceManager } from './workspace-manager';

export interface ImportOptions {
  overwrite?: boolean; // If true, overwrite existing test; if false, rename
}

export interface ImportResult {
  success: boolean;
  testName?: string;
  importedTo?: string;
  error?: string;
  conflict?: boolean; // True if test already exists
}

export class TestBundleImporter {
  private specGenerator: SpecGenerator;
  private workspaceManager: WorkspaceManager;

  constructor(workspaceManager: WorkspaceManager) {
    this.specGenerator = new SpecGenerator();
    this.workspaceManager = workspaceManager;
  }

  /**
   * Import a test bundle from a zip file
   * Automatically extracts the zip, validates contents, and places files in correct locations
   */
  async importBundle(
    zipPath: string,
    targetWorkspacePath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const tempDir = path.join(os.tmpdir(), `qa-studio-import-${Date.now()}`);
    
    try {
      // Extract zip to temp directory
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempDir, true);

      // Read manifest
      const manifestPath = path.join(tempDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        return {
          success: false,
          error: 'Invalid bundle: manifest.json not found',
        };
      }

      const manifest: any = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const workspaceType: WorkspaceType = manifest.workspaceType || 'd365';
      const originalTestName = manifest.testName;

      // Verify all files exist
      const requiredFiles = [
        manifest.files.spec,
        manifest.files.metaJson,
        manifest.files.metaMd,
        manifest.files.data,
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(tempDir, file);
        if (!fs.existsSync(filePath)) {
          return {
            success: false,
            error: `Invalid bundle: missing file ${file}`,
          };
        }
      }

      // Convert test name to kebab-case filename
      const fileName = this.specGenerator.flowNameToFileName(originalTestName);
      const platformDir = workspaceType === 'd365' ? 'd365' 
                        : workspaceType === 'salesforce' ? 'salesforce'
                        : workspaceType === 'koerber' ? 'koerber'
                        : 'web';

      // Check if test already exists
      const bundleDir = path.join(targetWorkspacePath, 'tests', platformDir, 'specs', fileName);
      const specPath = path.join(bundleDir, `${fileName}.spec.ts`);
      const dataPath = path.join(targetWorkspacePath, 'tests', platformDir, 'data', `${fileName}Data.json`);

      let finalTestName = originalTestName;
      let finalFileName = fileName;
      let conflict = false;

      if (fs.existsSync(specPath)) {
        conflict = true;
        if (options.overwrite) {
          // Overwrite existing test
          finalTestName = originalTestName;
          finalFileName = fileName;
        } else {
          // Generate new name
          let counter = 1;
          let newFileName = `${fileName}-imported-${counter}`;
          while (fs.existsSync(path.join(targetWorkspacePath, 'tests', platformDir, 'specs', newFileName, `${newFileName}.spec.ts`))) {
            counter++;
            newFileName = `${fileName}-imported-${counter}`;
          }
          finalFileName = newFileName;
          finalTestName = `${originalTestName} (Imported ${counter})`;
        }
      }

      // Create bundle directory
      const finalBundleDir = path.join(targetWorkspacePath, 'tests', platformDir, 'specs', finalFileName);
      fs.mkdirSync(finalBundleDir, { recursive: true });

      // Create data directory
      const dataDir = path.join(targetWorkspacePath, 'tests', platformDir, 'data');
      fs.mkdirSync(dataDir, { recursive: true });

      // Copy files
      const tempSpecPath = path.join(tempDir, manifest.files.spec);
      const tempMetaJsonPath = path.join(tempDir, manifest.files.metaJson);
      const tempMetaMdPath = path.join(tempDir, manifest.files.metaMd);
      const tempDataPath = path.join(tempDir, manifest.files.data);

      const finalSpecPath = path.join(finalBundleDir, `${finalFileName}.spec.ts`);
      const finalMetaJsonPath = path.join(finalBundleDir, `${finalFileName}.meta.json`);
      const finalMetaMdPath = path.join(finalBundleDir, `${finalFileName}.meta.md`);
      const finalDataPath = path.join(dataDir, `${finalFileName}Data.json`);

      // Read and update spec file (fix import paths)
      let specContent = fs.readFileSync(tempSpecPath, 'utf-8');
      
      // Update data import path
      const dataImportRegex = /import\s+data\s+from\s+['"]([^'"]+)['"]/;
      specContent = specContent.replace(dataImportRegex, `import data from '../../data/${finalFileName}Data.json'`);

      // Update waitForD365 import if present
      if (workspaceType === 'd365') {
        const waitImportRegex = /import\s+\{\s*waitForD365\s*\}\s+from\s+['"]([^'"]+)['"]/;
        specContent = specContent.replace(waitImportRegex, `import { waitForD365 } from '../../../../runtime/d365-waits'`);
      }

      // Update storage state path based on workspace type
      // D365: use path.resolve pattern
      // Others: use relative paths
      if (workspaceType === 'd365') {
        // Check if path import exists
        const hasPathImport = /import\s+.*path.*from\s+['"]path['"]/.test(specContent);
        const pathImport = hasPathImport ? '' : `import * as path from 'path';\n`;
        
        // Replace existing storage state with path.resolve pattern
        const storageStateRegex = /test\.use\s*\(\s*\{\s*storageState:\s*['"]([^'"]+)['"]\s*\}\s*\)/;
        if (storageStateRegex.test(specContent)) {
          specContent = specContent.replace(storageStateRegex, 
            `// 🔐 Resolve storage state dynamically (relative to THIS file)\nconst STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\ntest.use({ storageState: STORAGE_STATE })`
          );
          // Add path import if needed
          if (!hasPathImport) {
            // Find position after other imports
            const importEndMatch = specContent.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
            if (importEndMatch) {
              const insertPos = importEndMatch[0].length;
              specContent = specContent.slice(0, insertPos) + pathImport + specContent.slice(insertPos);
            } else {
              specContent = pathImport + specContent;
            }
          }
        } else {
          // No storage state found, add it
          const importEndMatch = specContent.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
          if (importEndMatch) {
            const insertPos = importEndMatch[0].length;
            specContent = specContent.slice(0, insertPos) + 
              pathImport +
              `\n// 🔐 Resolve storage state dynamically (relative to THIS file)\n` +
              `const STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\n` +
              `test.use({ storageState: STORAGE_STATE });\n\n` +
              specContent.slice(insertPos);
          } else {
            specContent = pathImport + 
              `\n// 🔐 Resolve storage state dynamically (relative to THIS file)\n` +
              `const STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\n` +
              `test.use({ storageState: STORAGE_STATE });\n\n` +
              specContent;
          }
        }
      } else if (workspaceType === 'salesforce') {
        // Salesforce uses relative path
        const storageStateRegex = /test\.use\s*\(\s*\{\s*storageState:\s*['"]([^'"]+)['"]\s*\}\s*\)/;
        specContent = specContent.replace(storageStateRegex, `test.use({ storageState: '../../../../storage_state/d365.json' })`);
      } else if (workspaceType === 'web-demo') {
        // Web-demo uses relative path
        const storageStateRegex = /test\.use\s*\(\s*\{\s*storageState:\s*['"]([^'"]+)['"]\s*\}\s*\)/;
        specContent = specContent.replace(storageStateRegex, `test.use({ storageState: '../../../../storage_state/web.json' })`);
      } else if (workspaceType === 'koerber') {
        // Koerber uses relative path
        const storageStateRegex = /test\.use\s*\(\s*\{\s*storageState:\s*['"]([^'"]+)['"]\s*\}\s*\)/;
        specContent = specContent.replace(storageStateRegex, `test.use({ storageState: '../../../../storage_state/d365.json' })`);
      }

      fs.writeFileSync(finalSpecPath, specContent, 'utf-8');

      // Copy metadata files
      fs.copyFileSync(tempMetaJsonPath, finalMetaJsonPath);
      fs.copyFileSync(tempMetaMdPath, finalMetaMdPath);
      fs.copyFileSync(tempDataPath, finalDataPath);

      // Update meta.json with new test name if renamed
      if (finalTestName !== originalTestName) {
        const metaJson = JSON.parse(fs.readFileSync(finalMetaJsonPath, 'utf-8'));
        metaJson.testName = finalTestName;
        fs.writeFileSync(finalMetaJsonPath, JSON.stringify(metaJson, null, 2), 'utf-8');
      }

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      return {
        success: true,
        testName: finalTestName,
        importedTo: finalBundleDir,
        conflict,
      };
    } catch (error: any) {
      // Clean up temp directory on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      return {
        success: false,
        error: error.message || 'Failed to import bundle',
      };
    }
  }
}

