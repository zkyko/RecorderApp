/**
 * Failure Analysis Utilities
 * Categorize, group, and analyze test failures
 */

import { TestRunMeta } from '../../../types/v1.5';

export type FailureCategory = 
  | 'timeout'
  | 'assertion'
  | 'element_not_found'
  | 'network'
  | 'javascript_error'
  | 'unknown';

export interface FailureAnalysis {
  category: FailureCategory;
  pattern: string;
  count: number;
  tests: string[];
  runs: TestRunMeta[];
  flakiness: number; // 0-100, higher = more flaky
}

export interface FlakyTest {
  testName: string;
  flakinessScore: number; // 0-100
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  recentFailures: TestRunMeta[];
  failureRate: number; // 0-1
}

/**
 * Categorize a failure based on error message or assertion type
 */
export function categorizeFailure(run: TestRunMeta): FailureCategory {
  // Check assertion failures first
  if (run.assertionFailures && run.assertionFailures.length > 0) {
    const firstFailure = run.assertionFailures[0];
    
    // Check assertion type
    if (firstFailure.assertionType) {
      const type = firstFailure.assertionType.toLowerCase();
      if (type.includes('timeout') || type.includes('wait')) {
        return 'timeout';
      }
      if (type.includes('assert') || type.includes('expect')) {
        return 'assertion';
      }
    }
    
    // Check target/selector
    if (firstFailure.target) {
      const target = firstFailure.target.toLowerCase();
      if (target.includes('locator') || target.includes('element') || target.includes('selector')) {
        return 'element_not_found';
      }
    }
  }
  
  // Check trace paths for network issues (would need to parse trace, simplified here)
  if (run.tracePaths && run.tracePaths.length > 0) {
    // In a real implementation, you'd parse the trace to check for network errors
    // For now, we'll use heuristics
  }
  
  return 'unknown';
}

/**
 * Analyze failures and group them by category
 */
export function analyzeFailures(runs: TestRunMeta[]): FailureAnalysis[] {
  const failedRuns = runs.filter(r => r.status === 'failed');
  
  if (failedRuns.length === 0) {
    return [];
  }
  
  const categories = new Map<FailureCategory, {
    runs: TestRunMeta[];
    tests: Set<string>;
  }>();
  
  failedRuns.forEach(run => {
    const category = categorizeFailure(run);
    if (!categories.has(category)) {
      categories.set(category, { runs: [], tests: new Set() });
    }
    const group = categories.get(category)!;
    group.runs.push(run);
    group.tests.add(run.testName);
  });
  
  return Array.from(categories.entries()).map(([category, data]) => {
    // Calculate flakiness (simplified: based on how many different tests have this failure)
    const uniqueTests = data.tests.size;
    const totalFailures = data.runs.length;
    const flakiness = uniqueTests > 1 ? Math.min(100, (uniqueTests / totalFailures) * 50) : 0;
    
    return {
      category,
      pattern: getFailurePattern(category),
      count: data.runs.length,
      tests: Array.from(data.tests),
      runs: data.runs,
      flakiness,
    };
  });
}

/**
 * Get failure pattern description
 */
function getFailurePattern(category: FailureCategory): string {
  switch (category) {
    case 'timeout':
      return 'Timeout waiting for element or condition';
    case 'assertion':
      return 'Assertion failed - expected value mismatch';
    case 'element_not_found':
      return 'Element not found - locator issue';
    case 'network':
      return 'Network error or request failure';
    case 'javascript_error':
      return 'JavaScript error in page';
    case 'unknown':
      return 'Unknown failure type';
    default:
      return 'Uncategorized failure';
  }
}

/**
 * Detect flaky tests (tests that fail intermittently)
 */
export function detectFlakyTests(runs: TestRunMeta[]): FlakyTest[] {
  const testGroups = new Map<string, TestRunMeta[]>();
  
  // Group runs by test name
  runs.forEach(run => {
    if (!testGroups.has(run.testName)) {
      testGroups.set(run.testName, []);
    }
    testGroups.get(run.testName)!.push(run);
  });
  
  const flakyTests: FlakyTest[] = [];
  
  testGroups.forEach((testRuns, testName) => {
    const totalRuns = testRuns.length;
    const passedRuns = testRuns.filter(r => r.status === 'passed').length;
    const failedRuns = testRuns.filter(r => r.status === 'failed').length;
    const failureRate = totalRuns > 0 ? failedRuns / totalRuns : 0;
    
    // Calculate flakiness score
    // High score if: fails sometimes but not always (30-70% failure rate)
    // Low score if: always fails (100%) or always passes (0%)
    let flakinessScore = 0;
    if (failureRate > 0 && failureRate < 1) {
      // Peak flakiness at 50% failure rate
      const distanceFrom50 = Math.abs(failureRate - 0.5);
      flakinessScore = Math.round((1 - distanceFrom50 * 2) * 100);
    }
    
    // Only include tests with some flakiness (score > 20) and at least 3 runs
    if (flakinessScore > 20 && totalRuns >= 3) {
      const recentFailures = testRuns
        .filter(r => r.status === 'failed')
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 5);
      
      flakyTests.push({
        testName,
        flakinessScore,
        totalRuns,
        passedRuns,
        failedRuns,
        recentFailures,
        failureRate,
      });
    }
  });
  
  // Sort by flakiness score (most flaky first)
  return flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore);
}

/**
 * Get failure trend (improving, worsening, stable)
 */
export function getFailureTrend(runs: TestRunMeta[]): {
  trend: 'improving' | 'worsening' | 'stable';
  recentFailureRate: number;
  previousFailureRate: number;
} {
  if (runs.length < 4) {
    return { trend: 'stable', recentFailureRate: 0, previousFailureRate: 0 };
  }
  
  // Split into recent and previous halves
  const sorted = [...runs].sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  
  const midpoint = Math.floor(sorted.length / 2);
  const recent = sorted.slice(0, midpoint);
  const previous = sorted.slice(midpoint);
  
  const recentFailures = recent.filter(r => r.status === 'failed').length;
  const previousFailures = previous.filter(r => r.status === 'failed').length;
  
  const recentRate = recent.length > 0 ? recentFailures / recent.length : 0;
  const previousRate = previous.length > 0 ? previousFailures / previous.length : 0;
  
  const diff = recentRate - previousRate;
  let trend: 'improving' | 'worsening' | 'stable';
  
  if (Math.abs(diff) < 0.05) {
    trend = 'stable';
  } else if (diff < 0) {
    trend = 'improving';
  } else {
    trend = 'worsening';
  }
  
  return { trend, recentFailureRate: recentRate, previousFailureRate: previousRate };
}

/**
 * Get icon for failure category
 */
export function getFailureCategoryIcon(category: FailureCategory) {
  switch (category) {
    case 'timeout':
      return '⏱️';
    case 'assertion':
      return '❌';
    case 'element_not_found':
      return '🔍';
    case 'network':
      return '🌐';
    case 'javascript_error':
      return '💥';
    default:
      return '❓';
  }
}

/**
 * Get color for failure category
 */
export function getFailureCategoryColor(category: FailureCategory): string {
  switch (category) {
    case 'timeout':
      return '#E67700'; // Orange
    case 'assertion':
      return '#C92A2A'; // Red
    case 'element_not_found':
      return '#FA5252'; // Light Red
    case 'network':
      return '#1C7ED6'; // Blue
    case 'javascript_error':
      return '#862E9C'; // Purple
    default:
      return '#4A4A4A'; // Gray
  }
}
