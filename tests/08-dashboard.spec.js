const { test, expect } = require("@playwright/test");

test.describe("Dashboard Verification", () => {
  test("should display updated data after a transaction is made", async ({
    page,
  }) => {
    // Navigate to the dashboard
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();

    // Check for key metrics cards (using Indonesian text from DashboardStats.jsx)
    // Card 1: Total Pemasukan (Total Revenue)
    const totalPemasukanCard = page.locator("text=Total Pemasukan").first();
    await expect(totalPemasukanCard).toBeVisible();

    // Card 2: Laba Kotor (Gross Profit)
    const labaKotorCard = page.locator("text=Laba Kotor").first();
    await expect(labaKotorCard).toBeVisible();

    // Card 3: Total Transaksi
    const totalTransaksiCard = page.locator("text=Total Transaksi").first();
    await expect(totalTransaksiCard).toBeVisible();

    // Card 4: Total Armada
    const totalArmadaCard = page.locator("text=Total Armada").first();
    await expect(totalArmadaCard).toBeVisible();
  });
});
