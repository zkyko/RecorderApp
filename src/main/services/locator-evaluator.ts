import { Page } from 'playwright';
import { LocatorDefinition } from '../../types';
import { LocatorExtractor } from '../../core/locators/locator-extractor';

export interface LocatorQuality {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'medium' | 'poor' | 'weak';
  reason: string;
}

export interface LocatorUniqueness {
  isUnique: boolean;
  matchCount: number;
  score: number; // 0-100
}

export interface LocatorUsability {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'medium' | 'poor';
  recommendation: string;
}

export interface LocatorEvaluation {
  locator: LocatorDefinition;
  quality: LocatorQuality;
  uniqueness: LocatorUniqueness;
  usability: LocatorUsability;
}

/**
 * Evaluates locator quality, uniqueness, and usability
 */
export class LocatorEvaluator {
  private locatorExtractor: LocatorExtractor;

  constructor() {
    this.locatorExtractor = new LocatorExtractor();
  }

  /**
   * Get quality score based on locator strategy (priority from LocatorExtractor)
   */
  getQualityScore(locator: LocatorDefinition): LocatorQuality {
    switch (locator.strategy) {
      case 'd365-controlname': // Priority 1
        return {
          score: 100,
          level: 'excellent',
          reason: 'D365-specific control name, most stable for Dynamics 365',
        };

      case 'role': // Priority 2
        return {
          score: 95,
          level: 'excellent',
          reason: 'Accessibility-based, semantic and stable',
        };

      case 'label': // Priority 3
        return {
          score: 90,
          level: 'good',
          reason: 'Label-based, user-friendly and relatively stable',
        };

      case 'placeholder': // Priority 4
        return {
          score: 85,
          level: 'good',
          reason: 'Placeholder-based, stable for form inputs',
        };

      case 'testid': // Priority 6
        return {
          score: 88,
          level: 'good',
          reason: 'Test ID attribute, purpose-built for testing',
        };

      case 'text': // Priority 5
        return {
          score: 70,
          level: 'medium',
          reason: 'Text-based, may change with translations or content updates',
        };

      case 'css': // Priority 7
        if (locator.flagged) {
          return {
            score: 40,
            level: 'poor',
            reason: 'CSS fallback selector, fragile and may break with UI changes',
          };
        }
        return {
          score: 60,
          level: 'medium',
          reason: 'CSS selector, moderate stability',
        };

      case 'xpath': // Priority 7
        return {
          score: 30,
          level: 'weak',
          reason: 'XPath selector, very fragile and not recommended',
        };

      default:
        return {
          score: 0,
          level: 'weak',
          reason: 'Unknown locator strategy',
        };
    }
  }

  /**
   * Evaluate uniqueness by counting how many elements match the locator
   */
  async evaluateUniqueness(
    page: Page,
    locator: LocatorDefinition
  ): Promise<LocatorUniqueness> {
    try {
      let count = 0;

      switch (locator.strategy) {
        case 'd365-controlname':
          count = await page.locator(`[data-dyn-controlname="${locator.controlName}"]`).count();
          break;

        case 'role':
          count = await page.getByRole(locator.role as any, { name: locator.name }).count();
          break;

        case 'label':
          count = await page.getByLabel(locator.text).count();
          break;

        case 'placeholder':
          count = await page.getByPlaceholder(locator.text).count();
          break;

        case 'text':
          count = await page.getByText(locator.text, { exact: locator.exact ?? false }).count();
          break;

        case 'testid':
          count = await page.getByTestId(locator.value).count();
          break;

        case 'css':
          count = await page.locator(locator.selector).count();
          break;

        case 'xpath':
          count = await page.locator(locator.expression).count();
          break;

        default:
          count = 0;
      }

      const isUnique = count === 1;
      // Score: 100 for unique, decreases by 10 per additional match, minimum 0
      const score = count === 1 ? 100 : count === 0 ? 0 : Math.max(0, 100 - (count - 1) * 10);

      return {
        isUnique,
        matchCount: count,
        score,
      };
    } catch (error) {
      console.error('Error evaluating uniqueness:', error);
      return {
        isUnique: false,
        matchCount: -1,
        score: 0,
      };
    }
  }

  /**
   * Evaluate overall usability (combines quality and uniqueness)
   */
  async evaluateLocator(
    page: Page,
    element: any
  ): Promise<LocatorEvaluation> {
    // Extract locator using existing LocatorExtractor
    const locator = await this.locatorExtractor.extractLocator(page, element);

    // Get quality score
    const quality = this.getQualityScore(locator);

    // Evaluate uniqueness
    const uniqueness = await this.evaluateUniqueness(page, locator);

    // Combined usability score (weighted: 60% quality, 40% uniqueness)
    const usabilityScore = Math.round((quality.score * 0.6) + (uniqueness.score * 0.4));

    let level: 'excellent' | 'good' | 'medium' | 'poor';
    let recommendation: string;

    if (usabilityScore >= 90) {
      level = 'excellent';
      recommendation = 'This locator is highly recommended. It\'s stable, semantic, and unique.';
    } else if (usabilityScore >= 75) {
      level = 'good';
      recommendation = 'This locator is good and should work reliably. Consider if there are better alternatives.';
    } else if (usabilityScore >= 50) {
      level = 'medium';
      recommendation = 'This locator may be fragile. It could break with UI changes. Look for better alternatives if possible.';
    } else {
      level = 'poor';
      recommendation = 'This locator is not recommended. It\'s likely to break and should be avoided.';
    }

    return {
      locator,
      quality,
      uniqueness,
      usability: {
        score: usabilityScore,
        level,
        recommendation,
      },
    };
  }
}

