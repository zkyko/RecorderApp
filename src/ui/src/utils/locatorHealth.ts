/**
 * Locator Health Scoring System
 * Evaluates locator quality based on type, complexity, and usage patterns
 */

import { LocatorIndexEntry } from '../../../types/v1.5';

export type LocatorHealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface LocatorHealthScore {
  score: number; // 0-100
  status: LocatorHealthStatus;
  factors: {
    type: number; // 0-40 points
    complexity: number; // 0-30 points
    stability: number; // 0-20 points
    usage: number; // 0-10 points
  };
  recommendations: string[];
}

/**
 * Calculate health score for a locator
 */
export function calculateLocatorHealth(locator: LocatorIndexEntry): LocatorHealthScore {
  const factors = {
    type: scoreByType(locator.type, locator.locator),
    complexity: scoreByComplexity(locator.locator),
    stability: scoreByStability(locator),
    usage: scoreByUsage(locator),
  };

  const totalScore = factors.type + factors.complexity + factors.stability + factors.usage;
  
  let status: LocatorHealthStatus;
  if (totalScore >= 90) status = 'excellent';
  else if (totalScore >= 75) status = 'good';
  else if (totalScore >= 60) status = 'fair';
  else if (totalScore >= 40) status = 'poor';
  else status = 'critical';

  const recommendations = generateRecommendations(locator, factors, status);

  return {
    score: totalScore,
    status,
    factors,
    recommendations,
  };
}

/**
 * Score based on locator type (0-40 points)
 */
function scoreByType(type: string, locator: string): number {
  // Excellent locators (40 points)
  if (type === 'role' || type === 'label' || type === 'placeholder') {
    return 40;
  }
  
  // Good locators (35 points)
  if (type === 'testid') {
    return 35;
  }
  
  // Fair locators (25 points)
  if (type === 'text') {
    return 25;
  }
  
  // Poor locators (15 points)
  if (type === 'css') {
    // Check if it's a simple ID or class selector
    if (/^#[a-zA-Z][\w-]*$/.test(locator) || /^\.[a-zA-Z][\w-]*$/.test(locator)) {
      return 20; // Simple CSS selectors are slightly better
    }
    return 15;
  }
  
  // Critical locators (5 points)
  if (type === 'xpath') {
    // Complex XPath expressions are worse
    if (locator.includes('//') || locator.includes('[') || locator.includes('@')) {
      return 5;
    }
    return 10;
  }
  
  return 10; // Unknown types
}

/**
 * Score based on complexity (0-30 points)
 */
function scoreByComplexity(locator: string): number {
  let score = 30;
  
  // Deduct points for complexity indicators
  if (locator.includes('nth-child')) score -= 10;
  if (locator.includes('nth-of-type')) score -= 10;
  if (locator.includes('::')) score -= 5; // Pseudo-elements
  if (locator.includes('>')) score -= 5; // Child selectors
  if (locator.includes('~')) score -= 5; // Sibling selectors
  if (locator.includes('+')) score -= 5; // Adjacent selectors
  if (locator.match(/\d{2,}/)) score -= 5; // Multiple digits (likely nth-child indices)
  if (locator.length > 100) score -= 5; // Very long selectors
  
  // Multiple chained selectors
  const selectorCount = (locator.match(/\.|#|\[/g) || []).length;
  if (selectorCount > 3) score -= 5;
  
  return Math.max(0, score);
}

/**
 * Score based on stability indicators (0-20 points)
 */
function scoreByStability(locator: LocatorIndexEntry): number {
  let score = 20;
  
  // Locators used in many tests are more stable (indicates it's working well)
  if (locator.testCount >= 5) {
    score += 5; // Bonus for high usage
  } else if (locator.testCount === 0) {
    score -= 10; // Unused locators are risky
  }
  
  // Check for dynamic/volatile patterns
  const locatorStr = locator.locator.toLowerCase();
  if (locatorStr.includes('dynamic') || locatorStr.includes('temp')) {
    score -= 10;
  }
  
  // Check for generic selectors that might break
  if (locatorStr.includes('div') && !locatorStr.includes('role') && !locatorStr.includes('testid')) {
    score -= 5; // Generic div selectors are less stable
  }
  
  return Math.max(0, Math.min(25, score)); // Cap at 25 (with bonus)
}

/**
 * Score based on usage patterns (0-10 points)
 */
function scoreByUsage(locator: LocatorIndexEntry): number {
  // More tests using the locator = better (indicates it's reliable)
  if (locator.testCount >= 10) return 10;
  if (locator.testCount >= 5) return 8;
  if (locator.testCount >= 2) return 6;
  if (locator.testCount === 1) return 4;
  return 2; // Unused or single-use locators
}

/**
 * Generate recommendations for improving locator health
 */
function generateRecommendations(
  locator: LocatorIndexEntry,
  factors: LocatorHealthScore['factors'],
  status: LocatorHealthStatus
): string[] {
  const recommendations: string[] = [];
  
  if (status === 'excellent') {
    return ['This locator is in excellent condition. No changes needed.'];
  }
  
  // Type recommendations
  if (factors.type < 20) {
    if (locator.type === 'xpath') {
      recommendations.push('Consider using role-based or test-id locators instead of XPath');
    } else if (locator.type === 'css') {
      recommendations.push('Prefer role, label, or test-id locators for better reliability');
    }
  }
  
  // Complexity recommendations
  if (factors.complexity < 20) {
    recommendations.push('Simplify the locator - avoid nth-child, complex selectors, or long chains');
  }
  
  // Stability recommendations
  if (factors.stability < 15) {
    if (locator.testCount === 0) {
      recommendations.push('This locator is unused - consider removing or verifying it works');
    } else {
      recommendations.push('Add test-id or role attributes to improve stability');
    }
  }
  
  // Usage recommendations
  if (factors.usage < 5) {
    recommendations.push('This locator is only used in a few tests - verify it\'s still needed');
  }
  
  // Specific patterns
  if (locator.locator.includes('nth-child')) {
    recommendations.push('Replace nth-child with more stable selectors (role, test-id, or data attributes)');
  }
  
  if (locator.locator.length > 100) {
    recommendations.push('Break down this long locator into smaller, more maintainable parts');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Minor improvements could be made, but this locator is acceptable');
  }
  
  return recommendations;
}

/**
 * Get color for health status badge
 */
export function getHealthStatusColor(status: LocatorHealthStatus): string {
  switch (status) {
    case 'excellent':
      return '#2B8A3E'; // Green
    case 'good':
      return '#4C6EF5'; // Blue
    case 'fair':
      return '#E67700'; // Orange
    case 'poor':
      return '#FA5252'; // Red
    case 'critical':
      return '#C92A2A'; // Dark Red
    default:
      return '#4A4A4A'; // Gray
  }
}

/**
 * Get badge variant for health status
 */
export function getHealthBadgeVariant(status: LocatorHealthStatus): string {
  switch (status) {
    case 'excellent':
      return 'badge-success';
    case 'good':
      return 'badge-info';
    case 'fair':
      return 'badge-warning';
    case 'poor':
    case 'critical':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
}
