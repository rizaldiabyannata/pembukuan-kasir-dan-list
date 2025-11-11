const { test, expect } = require('@playwright/test');

test.describe('User Management', () => {
  const newUser = {
    name: 'Test User',
    username: 'testuser' + Date.now(), // Ensure username is unique
    email: `testuser${Date.now()}@example.com`, // Ensure email is unique
    password: 'password123',
    role: 'OPERATOR',
  };

  const updatedUser = {
    name: 'Test User Updated',
  };

  test('should allow admin to create, read, update, and delete a user', async ({ page }) => {
    // Handle confirmation dialogs for delete action
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/users');

    // 1. Create a new user
    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(page.getByRole('heading', { name: 'Add User' })).toBeVisible();
    await page.getByLabel('Name').fill(newUser.name);
    await page.getByLabel('Username').fill(newUser.username);
    await page.getByLabel('Email').fill(newUser.email);
    await page.getByLabel('Password').fill(newUser.password);
    await page.getByLabel('Role').selectOption(newUser.role);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Read the new user in the table
    const userRow = page.getByRole('row', { name: new RegExp(newUser.name) });
    await expect(userRow).toBeVisible();
    await expect(userRow.getByRole('cell', { name: newUser.username })).toBeVisible();
    await expect(userRow.getByRole('cell', { name: newUser.email })).toBeVisible();

    // 3. Update the user
    await userRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit User' })).toBeVisible();
    await page.getByLabel('Name').fill(updatedUser.name);
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    const updatedUserRow = page.getByRole('row', { name: new RegExp(updatedUser.name) });
    await expect(updatedUserRow).toBeVisible();

    // 4. Delete the user
    await updatedUserRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the user is no longer in the table
    await expect(updatedUserRow).not.toBeVisible();
  });
});
