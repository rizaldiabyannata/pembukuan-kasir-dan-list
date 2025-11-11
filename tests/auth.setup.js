const { test: setup, expect } = require("@playwright/test");

const adminFile = "playwright/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  // 1. Login
  await page.goto("/");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // Take screenshot before login
  await page.screenshot({
    path: "test-results/before-login.png",
    fullPage: true,
  });

  // Credentials must match actual database (from seed-complete.js)
  await page.getByLabel("Email").fill("admin@pembukuan.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  // Wait a bit for response
  await page.waitForTimeout(2000);

  // Take screenshot after login attempt
  await page.screenshot({
    path: "test-results/after-login.png",
    fullPage: true,
  });

  // Check if there's an error message
  const errorAlert = page.locator('[role="alert"]');
  if (await errorAlert.isVisible()) {
    const errorText = await errorAlert.textContent();
    console.log("Login error:", errorText);
  }

  // 2. Wait for navigation to dashboard (more lenient)
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(async (e) => {
    console.log("Failed to navigate to dashboard. Current URL:", page.url());
    await page.screenshot({
      path: "test-results/failed-navigation.png",
      fullPage: true,
    });
    throw e;
  });

  // 3. Wait for the dashboard heading to be visible
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 10000,
  });

  // 4. Save authentication state
  await page.context().storageState({ path: adminFile });
});
