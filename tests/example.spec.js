const { test, expect } = require('@playwright/test');

test('should navigate to the dashboard after login', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for the dashboard to load and check for a key element
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
