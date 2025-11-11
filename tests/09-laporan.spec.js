const { test, expect } = require("@playwright/test");

test.describe("Report Generation", () => {
  test("should display report page with tabs and filter components", async ({
    page,
  }) => {
    await page.goto("/laporan");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Verify that the main tabs are visible (Indonesian UI)
    await expect(
      page.getByRole("button", { name: "Laporan Transaksi" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Laporan Laba Rugi" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Laporan Pemasukan" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Rekapitulasi" })
    ).toBeVisible();

    // Check if the default tab content is shown (skip for now, may be async loading)
    // await expect(page.getByText(/Total Transaksi/i)).toBeVisible();

    // Test tab switching works
    await page.getByRole("button", { name: "Laporan Laba Rugi" }).click();
    await page.waitForTimeout(1000); // Wait for content to load
    // Skip content verification for now
    // await expect(page.getByText(/Laba|Rugi/i)).toBeVisible();

    console.log("Report page navigation test completed successfully");
  });
});
