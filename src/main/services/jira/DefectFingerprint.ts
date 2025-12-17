import * as crypto from 'crypto';

/**
 * Generate a stable fingerprint for a defect
 * Format: QA-STUDIO::<workspaceId>::<testName>::<errorHash>
 */
export function generateFingerprint(
  workspaceId: string | undefined,
  testName: string,
  error: string,
  provider: string
): string {
  // Normalize error message: take first line, remove timestamps, normalize whitespace
  const normalizedError = error
    .split('\n')[0] // First line only
    .replace(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Create hash of normalized error (first 8 chars for readability)
  const errorHash = crypto
    .createHash('sha256')
    .update(normalizedError)
    .digest('hex')
    .substring(0, 8);
  
  const workspace = workspaceId || 'unknown';
  return `QA-STUDIO::${workspace}::${testName}::${errorHash}::${provider}`;
}

/**
 * Generate JQL query to search for existing defect with this fingerprint
 */
export function generateSearchJQL(fingerprint: string, projectKey: string): string {
  // Search in description, labels, and custom fields
  // Try multiple patterns to catch fingerprints stored in different ways
  const fingerprintParts = fingerprint.split('::');
  const workspaceId = fingerprintParts[1] || '';
  const testName = fingerprintParts[2] || '';
  const errorHash = fingerprintParts[3] || '';
  
  // Build JQL: search for fingerprint in text, or workspace+testName+errorHash combination
  const jql = `project = ${projectKey} AND (text ~ "${fingerprint}" OR text ~ "QA-STUDIO::${workspaceId}::${testName}::${errorHash}" OR labels = "qa-studio-fingerprint-${errorHash}") ORDER BY created DESC`;
  
  return jql;
}

/**
 * Extract fingerprint from Jira issue (from description, labels, or custom field)
 */
export function extractFingerprintFromIssue(issue: any): string | null {
  // Try to find fingerprint in description
  if (issue.fields?.description) {
    const description = extractTextFromADF(issue.fields.description);
    const match = description.match(/Fingerprint:\s*(QA-STUDIO::[^\s\n]+)/i);
    if (match) {
      return match[1];
    }
  }
  
  // Try to find fingerprint in labels
  if (issue.fields?.labels && Array.isArray(issue.fields.labels)) {
    const fingerprintLabel = issue.fields.labels.find((label: string) => 
      label.startsWith('qa-studio-fingerprint-')
    );
    if (fingerprintLabel) {
      // Extract from label format: qa-studio-fingerprint-<hash>
      // We need to reconstruct the full fingerprint, but we can at least identify it
      return fingerprintLabel;
    }
  }
  
  // Try custom field (if "QA Studio Fingerprint" field exists)
  // This would need to be configured per Jira instance
  if (issue.fields) {
    for (const [key, value] of Object.entries(issue.fields)) {
      if (key.startsWith('customfield_') && typeof value === 'string' && value.includes('QA-STUDIO::')) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Extract plain text from Jira ADF (Atlassian Document Format)
 */
function extractTextFromADF(adf: any): string {
  if (typeof adf === 'string') {
    return adf;
  }
  
  if (adf.content && Array.isArray(adf.content)) {
    return adf.content
      .map((node: any) => {
        if (node.type === 'text' && node.text) {
          return node.text;
        }
        if (node.content) {
          return extractTextFromADF(node);
        }
        return '';
      })
      .join(' ');
  }
  
  return '';
}

