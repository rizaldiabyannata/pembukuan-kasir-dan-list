const { test, expect } = require('@playwright/test');
const { ensureTestData } = require('./test-setup.js');

test.describe('Transaction Management', () => {
  let testData;

  // Ensure prerequisite data exists before running any transaction tests
  test.beforeAll(async () => {
    testData = await ensureTestData();
  });

  const newTransaction = {
    customerName: 'Test Customer Transaksi',
    customerPhone: '081122334455',
    bookingDate: '2025-11-12',
    checkoutTime: '08:00',
    checkinTime: '20:00',
    rate: '500000',
  };

  test('should allow admin to create and delete a transaction', async ({ page }) => {
    // Handle confirmation dialogs automatically
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/transaksi');

    // 1. Create a new transaction
    await page.getByRole('button', { name: 'Add Transaksi' }).click();

    await expect(page.getByRole('heading', { name: 'Add Transaksi' })).toBeVisible();

    await page.getByLabel('Customer Name').fill(newTransaction.customerName);
    await page.getByLabel('Customer Phone').fill(newTransaction.customerPhone);

    // Select Armada and Driver using the data from our setup script
    await page.getByLabel('Armada').selectOption({ label: new RegExp(testData.armada.license_plate) });
    await page.getByLabel('Driver').selectOption({ label: new RegExp(testData.driver.driver_name) });

    await page.getByLabel('Booking Date').fill(newTransaction.bookingDate);
    await page.getByLabel('Checkout Time').fill(newTransaction.checkoutTime);
    await page.getByLabel('Checkin Time').fill(newTransaction.checkinTime);
    await page.getByLabel('All-in Rate').fill(newTransaction.rate);

    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Verify the new transaction
    const transactionRow = page.getByRole('row', { name: new RegExp(newTransaction.customerName) });
    await expect(transactionRow).toBeVisible();
    await expect(transactionRow.getByRole('cell', { name: 'UNPAID' })).toBeVisible();

    // 3. Delete the transaction
    await transactionRow.getByRole('button', { name: 'Delete' }).click();

    // 4. Verify the transaction is deleted
    await expect(transactionRow).not.toBeVisible();
  });
});
