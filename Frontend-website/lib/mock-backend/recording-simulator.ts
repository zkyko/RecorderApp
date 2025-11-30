/**
 * Simulates recording flow with mock steps
 * Used by mock backend to provide realistic recording experience
 */

import { mockStore } from './mock-store';

export interface SimulatedStep {
  order: number;
  description: string;
  action: string;
  timestamp: number;
}

const MOCK_STEPS: SimulatedStep[] = [
  { order: 1, description: 'Navigate to Sales Orders', action: 'navigate', timestamp: 0 },
  { order: 2, description: 'Click New button', action: 'click', timestamp: 500 },
  { order: 3, description: 'Fill Customer Account', action: 'fill', timestamp: 1000 },
  { order: 4, description: 'Add Sales Order Line', action: 'click', timestamp: 1500 },
  { order: 5, description: 'Enter Item Number', action: 'fill', timestamp: 2000 },
  { order: 6, description: 'Enter Quantity', action: 'fill', timestamp: 2500 },
  { order: 7, description: 'Save Sales Order', action: 'click', timestamp: 3000 },
];

export class RecordingSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private currentStepIndex = 0;
  private startTime = 0;
  private codeUpdateCallbacks: Set<(code: string) => void> = new Set();

  /**
   * Start simulating recording
   */
  start(onStepUpdate?: (step: SimulatedStep) => void, onCodeUpdate?: (code: string) => void): void {
    this.currentStepIndex = 0;
    this.startTime = Date.now();
    
    if (onCodeUpdate) {
      this.codeUpdateCallbacks.add(onCodeUpdate);
    }

    // Simulate steps appearing over time
    this.intervalId = setInterval(() => {
      if (this.currentStepIndex < MOCK_STEPS.length) {
        const step = MOCK_STEPS[this.currentStepIndex];
        const steps = MOCK_STEPS.slice(0, this.currentStepIndex + 1);
        
        // Update store
        mockStore.setRecordingSteps(steps);
        
        // Notify step update
        if (onStepUpdate) {
          onStepUpdate(step);
        }

        // Generate and notify code update
        const code = this.generateCodeFromSteps(steps);
        mockStore.setCurrentCode(code);
        this.codeUpdateCallbacks.forEach(cb => cb(code));

        this.currentStepIndex++;
      } else {
        this.stop();
      }
    }, 800); // New step every 800ms
  }

  /**
   * Stop simulation
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.codeUpdateCallbacks.clear();
  }

  /**
   * Generate mock code from steps
   */
  private generateCodeFromSteps(steps: SimulatedStep[]): string {
    const lines = [
      "import { test, expect } from '@playwright/test';",
      "",
      "test('Create Sales Order', async ({ page }) => {",
      "  await page.goto('https://demo.sandbox.operations.dynamics.com/');",
    ];

    steps.forEach((step, index) => {
      switch (step.action) {
        case 'navigate':
          lines.push(`  await page.getByText('Sales orders').click();`);
          break;
        case 'click':
          if (step.description.includes('New')) {
            lines.push(`  await page.getByRole('button', { name: 'New' }).click();`);
          } else if (step.description.includes('Add line')) {
            lines.push(`  await page.getByRole('button', { name: 'Add line' }).click();`);
          } else if (step.description.includes('Save')) {
            lines.push(`  await page.getByRole('button', { name: 'Save' }).click();`);
          }
          break;
        case 'fill':
          if (step.description.includes('Customer Account')) {
            lines.push(`  await page.getByLabel('Customer account').fill('US-001');`);
          } else if (step.description.includes('Item Number')) {
            lines.push(`  await page.locator('[data-dyn-controlname=\"SalesLine_ItemId\"]').fill('A0001');`);
          } else if (step.description.includes('Quantity')) {
            lines.push(`  await page.locator('[data-dyn-controlname=\"SalesLine_SalesQty\"]').fill('10');`);
          }
          break;
      }
    });

    lines.push("});");
    return lines.join('\n');
  }

  /**
   * Get current steps
   */
  getCurrentSteps(): SimulatedStep[] {
    return MOCK_STEPS.slice(0, this.currentStepIndex);
  }
}

export const recordingSimulator = new RecordingSimulator();

