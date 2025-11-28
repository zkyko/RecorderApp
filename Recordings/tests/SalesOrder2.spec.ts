import { test } from '@playwright/test';
import data from '../data/SalesOrder2.json';

test.describe('Sales Order2 - sales2 - Data Driven', () => {
  test.setTimeout(120_000); // 2 minutes for D365

  for (const row of data) {
    test(`${row.name || row.id || 'Test'}`, async ({ page }) => {
        await page.goto('https://fourhands-test.sandbox.operations.dynamics.com/?cmp=FH&mi=DefaultDashboard');
        await page.getByRole('button', { name: 'Expand the navigation pane' }).click();
        await page.getByRole('treeitem', { name: 'Modules' }).click();
        await page.getByRole('treeitem', { name: 'Accounts receivable' }).click();
        await page.getByText('All sales orders').click();
        await page.getByRole('button', { name: ' New' }).click();
        await page.getByRole('combobox', { name: 'Customer account' }).click();
        await page.getByRole('combobox', { name: 'Customer account' }).fill('100001');
        await page.getByRole('combobox', { name: 'Customer account' }).press('Enter');
        await page.getByRole('button', { name: 'OK' }).click();
        await page.goto('https://fourhands-test.sandbox.operations.dynamics.com/?cmp=FH&mi=SalesTableListPage');
        await page.getByRole('button', { name: ' Delete' }).click();
        await page.getByRole('button', { name: 'Yes' }).click();
      
    });
  }
});
