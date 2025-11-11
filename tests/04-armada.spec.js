const { test, expect } = require('@playwright/test');

test.describe('Armada Management', () => {
  const newArmada = {
    licensePlate: 'B 1234 TST',
    brand: 'Toyota',
    model: 'Avanza',
  };

  const updatedArmada = {
    model: 'Innova',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/armada');
  });

  test('should allow admin to perform CRUD operations on armada', async ({ page }) => {
    // 1. Create a new armada
    await page.getByRole('button', { name: 'Add Armada' }).click();

    await expect(page.getByRole('heading', { name: 'Add Armada' })).toBeVisible();

    await page.getByLabel('License Plate').fill(newArmada.licensePlate);
    await page.getByLabel('Brand').fill(newArmada.brand);
    await page.getByLabel('Model').fill(newArmada.model);

    await page.getByRole('button', { name: 'Save' }).click();

    // 2. Read the new armada in the table
    await expect(page.getByRole('cell', { name: newArmada.licensePlate })).toBeVisible();
    await expect(page.getByRole('cell', { name: newArmada.brand })).toBeVisible();
    await expect(page.getByRole('cell', { name: newArmada.model })).toBeVisible();

    // 3. Update the armada
    const armadaRow = page.getByRole('row', { name: new RegExp(newArmada.licensePlate) });
    await armadaRow.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('heading', { name: 'Edit Armada' })).toBeVisible();

    await page.getByLabel('Model').fill(updatedArmada.model);
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    await expect(page.getByRole('cell', { name: updatedArmada.model })).toBeVisible();

    // 4. Delete the armada
    const updatedArmadaRow = page.getByRole('row', { name: new RegExp(newArmada.licensePlate) });
    await updatedArmadaRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the armada is no longer in the table
    await expect(page.getByRole('cell', { name: newArmada.licensePlate })).not.toBeVisible();
  });
});
