/**
 * Export utilities for reports, diagnostics, and system information
 */

export interface ExportOptions {
  format: 'markdown' | 'json' | 'csv';
  includeSystemInfo?: boolean;
  includeMetadata?: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  timestamp: string;
}

/**
 * Get system information
 */
export function getSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron || 'N/A',
    chromeVersion: process.versions.chrome || 'N/A',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export data to Markdown format
 */
export function exportToMarkdown(
  title: string,
  content: string,
  metadata?: Record<string, any>,
  systemInfo?: SystemInfo
): string {
  let markdown = `# ${title}\n\n`;
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (systemInfo) {
    markdown += `## System Information\n\n`;
    markdown += `- Platform: ${systemInfo.platform}\n`;
    markdown += `- Architecture: ${systemInfo.arch}\n`;
    markdown += `- Node.js: ${systemInfo.nodeVersion}\n`;
    markdown += `- Electron: ${systemInfo.electronVersion}\n`;
    markdown += `- Chrome: ${systemInfo.chromeVersion}\n\n`;
  }
  
  if (metadata && Object.keys(metadata).length > 0) {
    markdown += `## Metadata\n\n`;
    Object.entries(metadata).forEach(([key, value]) => {
      markdown += `- **${key}**: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Content\n\n${content}\n`;
  
  return markdown;
}

/**
 * Export data to JSON format
 */
export function exportToJSON(
  data: any,
  systemInfo?: SystemInfo
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    ...(systemInfo && { systemInfo }),
    data,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export table data to CSV format
 */
export function exportToCSV(
  headers: string[],
  rows: (string | number)[][]
): string {
  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add rows
  rows.forEach(row => {
    csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format test run data for export
 */
export function formatTestRunForExport(run: any): string {
  const lines: string[] = [];
  lines.push(`## Test Run: ${run.testName}`);
  lines.push(`- **Run ID**: ${run.runId}`);
  lines.push(`- **Status**: ${run.status}`);
  lines.push(`- **Started**: ${new Date(run.startedAt).toLocaleString()}`);
  if (run.finishedAt) {
    lines.push(`- **Finished**: ${new Date(run.finishedAt).toLocaleString()}`);
    const duration = Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
    lines.push(`- **Duration**: ${duration}s`);
  }
  lines.push(`- **Source**: ${run.source || 'local'}`);
  if (run.specRelPath) {
    lines.push(`- **Spec Path**: ${run.specRelPath}`);
  }
  return lines.join('\n');
}

/**
 * Format multiple test runs for export
 */
export function formatTestRunsForExport(runs: any[]): string {
  if (runs.length === 0) {
    return '# Test Runs Export\n\nNo runs to export.';
  }
  
  const lines: string[] = [];
  lines.push(`# Test Runs Export`);
  lines.push(`\nTotal Runs: ${runs.length}\n`);
  
  const passed = runs.filter(r => r.status === 'passed').length;
  const failed = runs.filter(r => r.status === 'failed').length;
  const skipped = runs.filter(r => r.status === 'skipped').length;
  const running = runs.filter(r => r.status === 'running').length;
  
  lines.push(`## Summary`);
  lines.push(`- Passed: ${passed}`);
  lines.push(`- Failed: ${failed}`);
  lines.push(`- Skipped: ${skipped}`);
  if (running > 0) {
    lines.push(`- Running: ${running}`);
  }
  lines.push(`\n## Runs\n`);
  
  runs.forEach(run => {
    lines.push(formatTestRunForExport(run));
    lines.push('');
  });
  
  return lines.join('\n');
}
