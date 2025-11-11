const { test, expect } = require('@playwright/test');

test.describe('Service Package Management', () => {

  test.beforeEach(async ({ page }) => {
    // Handle confirmation dialogs automatically for all tests in this suite
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/paket');
  });

  test('should handle CRUD for CAR_RENTAL package type', async ({ page }) => {
    const carRentalPackage = {
      name: 'Test Package - Car Rental ' + Date.now(),
      type: 'CAR_RENTAL',
      description: 'A simple car rental package.',
      includes: 'Driver, Fuel',
      excludes: 'Toll, Parking',
      price: '500000',
      durationHours: '12',
    };

    // 1. Create a new package
    await page.getByRole('button', { name: 'Add Paket' }).click();
    await page.getByLabel('Name').fill(carRentalPackage.name);
    await page.getByLabel('Type').selectOption(carRentalPackage.type);
    await page.getByLabel('Description').fill(carRentalPackage.description);
    await page.getByLabel('Includes').fill(carRentalPackage.includes);
    await page.getByLabel('Excludes').fill(carRentalPackage.excludes);
    await page.getByLabel('Price').fill(carRentalPackage.price);
    await page.getByLabel('Duration (Hours)').fill(carRentalPackage.durationHours);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Verify the package is in the table
    const packageRow = page.getByRole('row', { name: new RegExp(carRentalPackage.name) });
    await expect(packageRow).toBeVisible();

    // 3. Delete the package
    await packageRow.getByRole('button', { name: 'Delete' }).click();
    await expect(packageRow).not.toBeVisible();
  });

  test('should handle CRUD for TOUR_PACKAGE package type', async ({ page }) => {
    const tourPackage = {
      name: 'Test Package - Tour ' + Date.now(),
      type: 'TOUR_PACKAGE',
      description: 'A multi-day tour package.',
      includes: 'Hotel, Breakfast, Tour Guide',
      excludes: 'Flights, Lunch, Dinner',
      durationDays: '3',
      durationNights: '2',
    };

    // 1. Create a new package
    await page.getByRole('button', { name: 'Add Paket' }).click();
    await page.getByLabel('Name').fill(tourPackage.name);
    await page.getByLabel('Type').selectOption(tourPackage.type);
    await page.getByLabel('Description').fill(tourPackage.description);
    await page.getByLabel('Includes').fill(tourPackage.includes);
    await page.getByLabel('Excludes').fill(tourPackage.excludes);
    await page.getByLabel('Duration (Days)').fill(tourPackage.durationDays);
    await page.getByLabel('Duration (Nights)').fill(tourPackage.durationNights);
    // This assumes there are more complex fields for hotel tiers etc.
    // For this test, we'll focus on the main fields.
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Verify the package is in the table
    const packageRow = page.getByRole('row', { name: new RegExp(tourPackage.name) });
    await expect(packageRow).toBeVisible();

    // 3. Delete the package
    await packageRow.getByRole('button', { name: 'Delete' }).click();
    await expect(packageRow).not.toBeVisible();
  });

  test('should handle CRUD for FULL_DAY_TRIP package type', async ({ page }) => {
    const fullDayTripPackage = {
        name: 'Test Package - Full Day Trip ' + Date.now(),
        type: 'FULL_DAY_TRIP',
        description: 'A full day trip package.',
        includes: 'Driver, Fuel, Lunch',
        excludes: 'Toll, Parking, Dinner',
        price: '750000',
        durationHours: '10',
    };

    // 1. Create a new package
    await page.getByRole('button', { name: 'Add Paket' }).click();
    await page.getByLabel('Name').fill(fullDayTripPackage.name);
    await page.getByLabel('Type').selectOption(fullDayTripPackage.type);
    await page.getByLabel('Description').fill(fullDayTripPackage.description);
    await page.getByLabel('Includes').fill(fullDayTripPackage.includes);
    await page.getByLabel('Excludes').fill(fullDayTripPackage.excludes);
    await page.getByLabel('Price').fill(fullDayTripPackage.price);
    await page.getByLabel('Duration (Hours)').fill(fullDayTripPackage.durationHours);
    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Verify the package is in the table
    const packageRow = page.getByRole('row', { name: new RegExp(fullDayTripPackage.name) });
    await expect(packageRow).toBeVisible();

    // 3. Delete the package
    await packageRow.getByRole('button', { name: 'Delete' }).click();
    await expect(packageRow).not.toBeVisible();
  });
});
