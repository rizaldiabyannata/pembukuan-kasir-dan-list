const { test, expect } = require('@playwright/test');

test.describe('Driver Management', () => {
  const newDriver = {
    name: 'Test Driver',
    nik: `0987654321${Date.now()}`.slice(0, 16),
    phone: `089876${Date.now()}`.slice(0, 12),
    address: '123 Test Street',
  };

  const updatedDriver = {
    name: 'Test Driver Updated',
  };

  test('should allow admin to perform CRUD operations on drivers', async ({ page }) => {
    // Handle confirmation dialogs
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/sopir');

    // 1. Create a new driver
    await page.getByRole('button', { name: 'Add Sopir' }).click();
    await expect(page.getByRole('heading', { name: 'Add Sopir' })).toBeVisible();
    await page.getByLabel('Driver Name').fill(newDriver.name);
    await page.getByLabel('NIK').fill(newDriver.nik);
    await page.getByLabel('Phone Number').fill(newDriver.phone);
    await page.getByLabel('Address').fill(newDriver.address);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Read the new driver in the table
    const driverRow = page.getByRole('row', { name: new RegExp(newDriver.name) });
    await expect(driverRow).toBeVisible();
    await expect(driverRow.getByRole('cell', { name: newDriver.phone })).toBeVisible();

    // 3. Update the driver
    await driverRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Sopir' })).toBeVisible();
    await page.getByLabel('Driver Name').fill(updatedDriver.name);
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    const updatedDriverRow = page.getByRole('row', { name: new RegExp(updatedDriver.name) });
    await expect(updatedDriverRow).toBeVisible();

    // 4. Delete the driver
    await updatedDriverRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the driver is no longer in the table
    await expect(updatedDriverRow).not.toBeVisible();
  });
});
