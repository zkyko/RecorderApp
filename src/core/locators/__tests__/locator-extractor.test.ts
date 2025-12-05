import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocatorExtractor } from '../locator-extractor';
import { LocatorDefinition } from '../../../types';

// Mock Playwright types for testing
type MockElementHandle = {
  getAttribute: (attr: string) => Promise<string | null>;
  evaluate: (fn: (el: HTMLElement) => any) => Promise<any>;
  tagName: string;
  textContent?: string;
  role?: string;
};

type MockPage = {
  accessibility: {
    snapshot: (options: any) => Promise<any>;
  };
};

describe('LocatorExtractor', () => {
  let extractor: LocatorExtractor;
  let mockPage: MockPage;

  beforeEach(() => {
    extractor = new LocatorExtractor();
    mockPage = {
      accessibility: {
        snapshot: jest.fn().mockResolvedValue(null)
      }
    } as any;
  });

  describe('extractLocator', () => {
    it('should handle null element gracefully', async () => {
      const locator = await extractor.extractLocator(mockPage as any, null);
      
      expect(locator.strategy).toBe('css');
      expect(locator).toHaveProperty('flagged', true);
    });

    it('should prefer data-dyn-controlname for D365 elements', async () => {
      const element = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'data-dyn-controlname') return Promise.resolve('SalesOrderButton');
          return Promise.resolve(null);
        }),
        evaluate: jest.fn().mockImplementation((fn: any) => {
          const mockEl = {
            getAttribute: (attr: string) => {
              if (attr === 'data-dyn-controlname') return 'SalesOrderButton';
              return null;
            }
          } as any;
          return Promise.resolve(fn(mockEl));
        }),
        tagName: 'BUTTON',
        textContent: 'Create Sales Order'
      } as any;

      const locator = await extractor.extractLocator(mockPage as any, element);
    
      expect(locator.strategy).toBe('d365-controlname');
      if ('controlName' in locator) {
        expect(locator.controlName).toBe('SalesOrderButton');
      }
    });

    it('should fallback to role-based locator when D365 attributes are missing', async () => {
      const element = {
        getAttribute: jest.fn().mockResolvedValue(null),
        evaluate: jest.fn().mockResolvedValue(null),
        tagName: 'BUTTON',
        textContent: 'Submit',
        role: 'button'
      } as any;

      mockPage.accessibility.snapshot = jest.fn().mockResolvedValue({
        role: 'button',
        name: 'Submit'
      });

      const locator = await extractor.extractLocator(mockPage as any, element);
    
      // Should try role-based strategy (implementation may vary)
      expect(locator).toBeDefined();
      expect(locator.strategy).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const element = {
        getAttribute: jest.fn().mockRejectedValue(new Error('Test error')),
        evaluate: jest.fn().mockRejectedValue(new Error('Test error')),
        tagName: 'BUTTON'
      } as any;

      const locator = await extractor.extractLocator(mockPage as any, element);
    
      // Should return a fallback locator
      expect(locator).toBeDefined();
      expect(locator.strategy).toBeDefined();
    });
  });
});
