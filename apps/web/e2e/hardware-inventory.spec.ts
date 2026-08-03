import { test, expect } from "./fixtures";

test.describe("Hardware Inventory", () => {
  test("lists hardware and opens the scan page", async ({ page }) => {
    await page.goto("/hardware-inventory");
    await expect(page.getByRole("heading", { name: "Hardware Inventory" })).toBeVisible();

    await page.getByRole("link", { name: "Scan" }).click();
    await expect(page).toHaveURL(/\/hardware-inventory\/scan/);
    await expect(page.getByRole("heading", { name: "Scan hardware" })).toBeVisible();
  });

  test("opens the new item dialog", async ({ page }) => {
    await page.goto("/hardware-inventory");
    await page.getByRole("button", { name: "New item" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("SKU")).toBeVisible();
  });
});
