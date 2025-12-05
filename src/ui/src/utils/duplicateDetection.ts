/**
 * Duplicate Locator Detection
 * Identifies similar or duplicate locators that can be merged
 */

import { LocatorIndexEntry } from '../../../types/v1.5';

export interface DuplicateGroup {
  id: string;
  locators: LocatorIndexEntry[];
  similarity: number; // 0-100
  recommendedLocator: string;
  reason: string;
}

/**
 * Find duplicate locators
 */
export function findDuplicates(locators: LocatorIndexEntry[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < locators.length; i++) {
    if (processed.has(`${locators[i].type}-${locators[i].locator}`)) continue;

    const group: LocatorIndexEntry[] = [locators[i]];
    const currentKey = `${locators[i].type}-${locators[i].locator}`;

    for (let j = i + 1; j < locators.length; j++) {
      const otherKey = `${locators[j].type}-${locators[j].locator}`;
      if (processed.has(otherKey)) continue;

      const similarity = calculateSimilarity(locators[i], locators[j]);
      
      if (similarity >= 80) {
        group.push(locators[j]);
        processed.add(otherKey);
      }
    }

    if (group.length > 1) {
      processed.add(currentKey);
      const recommended = selectBestLocator(group);
      groups.push({
        id: `group-${groups.length}`,
        locators: group,
        similarity: calculateGroupSimilarity(group),
        recommendedLocator: recommended.locator,
        reason: getRecommendationReason(group, recommended),
      });
    }
  }

  return groups;
}

/**
 * Calculate similarity between two locators (0-100)
 */
function calculateSimilarity(loc1: LocatorIndexEntry, loc2: LocatorIndexEntry): number {
  // Exact match
  if (loc1.type === loc2.type && loc1.locator === loc2.locator) {
    return 100;
  }

  // Same type, similar selectors
  if (loc1.type === loc2.type) {
    const similarity = stringSimilarity(loc1.locator, loc2.locator);
    return similarity;
  }

  // Different types but similar selectors (e.g., CSS vs XPath pointing to same element)
  const selectorSimilarity = stringSimilarity(
    normalizeSelector(loc1.locator),
    normalizeSelector(loc2.locator)
  );

  if (selectorSimilarity > 70) {
    return selectorSimilarity * 0.8; // Penalize for different types
  }

  return 0;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(longer, shorter);
  return ((longer.length - distance) / longer.length) * 100;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Normalize selector for comparison
 */
function normalizeSelector(selector: string): string {
  return selector
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/['"]/g, '')
    .replace(/\./g, '')
    .replace(/#/g, '');
}

/**
 * Calculate average similarity within a group
 */
function calculateGroupSimilarity(group: LocatorIndexEntry[]): number {
  if (group.length < 2) return 100;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      totalSimilarity += calculateSimilarity(group[i], group[j]);
      comparisons++;
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

/**
 * Select the best locator from a group (prefer role, label, testid over CSS/XPath)
 */
function selectBestLocator(group: LocatorIndexEntry[]): LocatorIndexEntry {
  // Priority order: role > label > testid > placeholder > text > css > xpath
  const priority: Record<string, number> = {
    role: 7,
    label: 6,
    testid: 5,
    placeholder: 4,
    text: 3,
    css: 2,
    xpath: 1,
  };

  // Sort by priority, then by test count (more usage = better)
  return [...group].sort((a, b) => {
    const priorityDiff = (priority[b.type] || 0) - (priority[a.type] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return b.testCount - a.testCount;
  })[0];
}

/**
 * Get reason for recommendation
 */
function getRecommendationReason(
  group: LocatorIndexEntry[],
  recommended: LocatorIndexEntry
): string {
  const types = new Set(group.map(l => l.type));
  
  if (types.size === 1) {
    return `All ${group.length} locators are identical. Use the one with highest test coverage.`;
  }
  
  if (recommended.type === 'role' || recommended.type === 'label') {
    return `Recommended locator uses ${recommended.type}-based selection, which is more reliable than ${Array.from(types).filter(t => t !== recommended.type).join(' or ')}.`;
  }
  
  if (recommended.testCount > group.find(l => l !== recommended)?.testCount || 0) {
    return `Recommended locator is used in more tests (${recommended.testCount}), indicating better stability.`;
  }
  
  return `Recommended locator has the best type and usage combination.`;
}

/**
 * Check if two locators are likely duplicates
 */
export function areLikelyDuplicates(
  loc1: LocatorIndexEntry,
  loc2: LocatorIndexEntry,
  threshold: number = 80
): boolean {
  return calculateSimilarity(loc1, loc2) >= threshold;
}
