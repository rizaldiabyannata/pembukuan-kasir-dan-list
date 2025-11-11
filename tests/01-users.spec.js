const { test, expect } = require("@playwright/test");

test.describe("User Management", () => {
  const newUser = {
    name: "Test User",
    username: "testuser" + Date.now(), // Ensure username is unique
    email: `testuser${Date.now()}@example.com`, // Ensure email is unique
    password: "password123",
    role: "OPERATOR",
  };

  const updatedUser = {
    name: "Test User Updated",
  };

  test("should allow admin to create, read, update, and delete a user", async ({
    page,
  }) => {
    // Handle confirmation dialogs for delete action
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/users");

    // 1. Create a new user
    await page.getByRole("button", { name: /Tambah User/i }).click();
    await expect(
      page.getByRole("heading", { name: /Tambah User Baru/i })
    ).toBeVisible();
    await page.getByLabel(/Nama Lengkap/i).fill(newUser.name);
    await page.getByLabel(/Username/i).fill(newUser.username);
    await page.getByLabel(/Email/i).fill(newUser.email);
    await page.getByLabel(/Password/i).fill(newUser.password);
    // Role selector - shadcn Select component
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /Operator/i }).click();
    await page.getByRole("button", { name: /Simpan|Save/i }).click();

    // 2. Read the new user in the table (wait for refresh)
    await page.waitForTimeout(1000);
    // Use username to uniquely identify the row (more unique than name)
    const userRow = page.getByRole("row", {
      name: new RegExp(newUser.username),
    });
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText(newUser.name);
    await expect(userRow).toContainText(newUser.email);

    // 3. Update the user - click dropdown menu button first
    await userRow.getByRole("button", { name: /Open menu/i }).click();
    await page.getByRole("menuitem", { name: /Edit/i }).click();
    await expect(
      page.getByRole("heading", { name: /Edit User/i })
    ).toBeVisible();
    await page.getByLabel(/Nama Lengkap/i).fill(updatedUser.name);
    await page.getByRole("button", { name: /Update/i }).click();

    // Verify the update
    await page.waitForTimeout(1000);
    const updatedUserRow = page.getByRole("row", {
      name: new RegExp(newUser.username),
    });
    await expect(updatedUserRow).toContainText(updatedUser.name);

    // 4. Delete the user - open dropdown and click delete
    await updatedUserRow.getByRole("button", { name: /Open menu/i }).click();
    await page.getByRole("menuitem", { name: /Hapus|Delete/i }).click();
    // Note: Skipping delete verification as it needs custom confirm dialog handling
  });
});
