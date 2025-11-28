import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Path resolver utility for handling file paths correctly in both
 * Development and Production (Packaged) modes.
 * 
 * In Production, resources are shipped via extraResources and are located
 * next to the executable (process.resourcesPath).
 * In Development, resources are in the project root.
 */
export const getRuntimePath = (): string => {
  if (app.isPackaged) {
    // In Production: Resources are next to the executable (process.resourcesPath)
    return path.join(process.resourcesPath, 'runtime');
  } else {
    // In Development: Resources are in the project root
    return path.join(process.cwd(), 'runtime');
  }
};

/**
 * Get the absolute path to the ErrorGrabber.js reporter source file.
 * This is the location where the reporter is stored in the app resources,
 * not the workspace copy.
 * 
 * Note: In production, this points to the reporter in extraResources.
 * In development, this tries multiple locations:
 * 1. Compiled JS in dist/main/services/reporters/ (if running from compiled code)
 * 2. Runtime folder at project root (if runtime folder exists)
 * 3. Falls back to TypeScript source
 */
export const getReporterPath = (): string => {
  if (app.isPackaged) {
    // In production: Resources are in process.resourcesPath/runtime/reporters/
    return path.join(process.resourcesPath, 'runtime', 'reporters', 'ErrorGrabber.js');
  } else {
    // In development: Try multiple locations
    // First, try the compiled version in dist (if running from compiled code)
    const distPath = path.join(process.cwd(), 'dist', 'main', 'services', 'reporters', 'ErrorGrabber.js');
    if (fs.existsSync(distPath)) {
      return distPath;
    }
    
    // Second, try the runtime folder at project root
    const runtimePath = path.join(process.cwd(), 'runtime', 'reporters', 'ErrorGrabber.js');
    if (fs.existsSync(runtimePath)) {
      return runtimePath;
    }
    
    // Fallback: return the expected path (will be checked by caller)
    return runtimePath;
  }
};

/**
 * Get the absolute path to the ErrorGrabber.ts reporter source file (for development).
 * This is only used in development when the compiled JS version is not available.
 */
export const getReporterSourcePath = (): string => {
  if (app.isPackaged) {
    // In production, we should only use the compiled JS version
    return getReporterPath();
  } else {
    // In development, try to find the TypeScript source
    // This is typically at src/main/services/reporters/ErrorGrabber.ts
    // But we need to resolve it relative to the project root
    return path.join(process.cwd(), 'src', 'main', 'services', 'reporters', 'ErrorGrabber.ts');
  }
};

