const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  // Disable parallelism
  fullyParallel: true,
  workers: 3,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Video recording configuration
    video: "on", // Always record video (for testing purposes)
    screenshot: "only-on-failure", // Take screenshot only on failure
    // Alternative options:
    // video: "on-first-retry" - Record only on retry
    // video: "off" - No video recording
    // screenshot: "on" - Always take screenshots
    // screenshot: "off" - No screenshots
  },
  projects: [
    // Setup project
    { name: "setup", testMatch: /.*\.setup\.js/ },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
        headless: true,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
});
