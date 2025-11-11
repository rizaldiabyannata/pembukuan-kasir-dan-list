const { test: setup, expect } = require('@playwright/test');

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // 1. Login
  await page.goto('/');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // 2. Wait for the dashboard to load
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // 3. Save authentication state
  await page.context().storageState({ path: adminFile });
});
