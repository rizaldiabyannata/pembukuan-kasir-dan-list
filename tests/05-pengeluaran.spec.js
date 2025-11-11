const { test, expect } = require('@playwright/test');
const { ensureTestData } = require('./test-setup.js');

test.describe('Expense Management', () => {
  // Ensure prerequisite data exists before running tests
  test.beforeAll(async () => {
    await ensureTestData();
  });

  const newExpense = {
    category: 'Fuel',
    description: 'Gasoline for test vehicle',
    amount: '150000',
  };

  const updatedExpense = {
    description: 'Diesel for test vehicle',
  };

  test('should allow admin to perform CRUD operations on expenses', async ({ page }) => {
    // Handle confirmation dialogs
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/pengeluaran');

    // 1. Create a new expense
    await page.getByRole('button', { name: 'Add Pengeluaran' }).click();
    await expect(page.getByRole('heading', { name: 'Add Pengeluaran' })).toBeVisible();
    await page.getByLabel('Category').fill(newExpense.category);
    await page.getByLabel('Description').fill(newExpense.description);
    await page.getByLabel('Amount').fill(newExpense.amount);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Read the new expense in the table
    const expenseRow = page.getByRole('row', { name: new RegExp(newExpense.description) });
    await expect(expenseRow).toBeVisible();
    await expect(expenseRow.getByRole('cell', { name: newExpense.category })).toBeVisible();

    // 3. Update the expense
    await expenseRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Pengeluaran' })).toBeVisible();
    await page.getByLabel('Description').fill(updatedExpense.description);
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    const updatedExpenseRow = page.getByRole('row', { name: new RegExp(updatedExpense.description) });
    await expect(updatedExpenseRow).toBeVisible();

    // 4. Delete the expense
    await updatedExpenseRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the expense is no longer in the table
    await expect(updatedExpenseRow).not.toBeVisible();
  });
});
