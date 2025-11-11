const { test, expect } = require('@playwright/test');

test.describe('Staff Management', () => {
  const newStaff = {
    name: 'Test Staff',
    nik: `1234567890${Date.now()}`.slice(0, 16), // Ensure NIK is unique
    position: 'Cashier',
    phone: `081234${Date.now()}`.slice(0, 12),
    email: `staff${Date.now()}@example.com`,
    salary: '5000000',
  };

  const updatedStaff = {
    name: 'Test Staff Updated',
  };

  test('should allow admin to perform CRUD operations on staff', async ({ page }) => {
    // Handle confirmation dialogs
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/staff');

    // 1. Create new staff
    await page.getByRole('button', { name: 'Add Staff' }).click();
    await expect(page.getByRole('heading', { name: 'Add Staff' })).toBeVisible();
    await page.getByLabel('Name').fill(newStaff.name);
    await page.getByLabel('NIK').fill(newStaff.nik);
    await page.getByLabel('Position').fill(newStaff.position);
    await page.getByLabel('Phone Number').fill(newStaff.phone);
    await page.getByLabel('Email').fill(newStaff.email);
    await page.getByLabel('Salary').fill(newStaff.salary);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Read the new staff in the table
    const staffRow = page.getByRole('row', { name: new RegExp(newStaff.name) });
    await expect(staffRow).toBeVisible();
    await expect(staffRow.getByRole('cell', { name: newStaff.position })).toBeVisible();
    await expect(staffRow.getByRole('cell', { name: newStaff.phone })).toBeVisible();

    // 3. Update the staff
    await staffRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Staff' })).toBeVisible();
    await page.getByLabel('Name').fill(updatedStaff.name);
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    const updatedStaffRow = page.getByRole('row', { name: new RegExp(updatedStaff.name) });
    await expect(updatedStaffRow).toBeVisible();

    // 4. Delete the staff
    await updatedStaffRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the staff is no longer in the table
    await expect(updatedStaffRow).not.toBeVisible();
  });
});
