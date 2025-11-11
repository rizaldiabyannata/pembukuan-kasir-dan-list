const { test, expect } = require('@playwright/test');

test.describe('Dashboard Verification', () => {

  test('should display updated data after a transaction is made', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');

    // Verification: Check for key metrics.
    // The exact selectors and expected values will depend on the dashboard's implementation.
    // This is a generic example.

    // Example 1: Check if a "Total Revenue" card exists and has a numeric value.
    const totalRevenueCard = page.locator('div:has-text("Total Revenue")');
    await expect(totalRevenueCard).toBeVisible();

    // This regex looks for a number, possibly with currency symbols or commas.
    const revenueValue = totalRevenueCard.locator('p').first();
    await expect(revenueValue).toHaveText(/[0-9,.]+/);

    // Example 2: Check for "Total Transactions"
    const totalTransactionsCard = page.locator('div:has-text("Total Transactions")');
    await expect(totalTransactionsCard).toBeVisible();

    const transactionCount = totalTransactionsCard.locator('p').first();
    // Assuming at least the one transaction from our test exists.
    await expect(transactionCount).not.toHaveText('0');
  });
});
