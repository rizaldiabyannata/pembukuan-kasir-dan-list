const { test, expect } = require('@play-test');
const { createTransactionForTest } = require('./test-setup.js');

test.describe('Report Generation', () => {
  let testTransaction;

  // Create a fresh transaction before running the report test
  test.beforeAll(async () => {
    testTransaction = await createTransactionForTest();
  });

  test('should generate a report containing recent transaction data', async ({ page }) => {
    await page.goto('/laporan');

    // Filter or generate the report if necessary
    const generateButton = page.getByRole('button', { name: 'Generate' });
    if (await generateButton.isVisible()) {
      await generateButton.click();
    }

    // Verify that the report contains the customer from our self-contained test transaction
    const reportTable = page.getByRole('table');
    await expect(reportTable).toBeVisible();

    const customerCell = reportTable.getByRole('cell', { name: testTransaction.customer_name });
    await expect(customerCell).toBeVisible();
  });
});
