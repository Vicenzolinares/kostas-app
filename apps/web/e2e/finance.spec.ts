import { test, expect } from "./fixtures";

test.describe("Finance", () => {
  test("renders the revenue overview and links to invoices/transactions", async ({ page }) => {
    await page.goto("/finance");
    await expect(page.getByRole("heading", { name: "Finance" })).toBeVisible();

    await page.getByRole("link", { name: "Invoices" }).click();
    await expect(page).toHaveURL(/\/finance\/invoices/);
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
  });

  test("opens the new invoice form", async ({ page }) => {
    await page.goto("/finance/invoices/new");
    await expect(page.getByRole("heading", { name: "New invoice" })).toBeVisible();
    await expect(page.getByLabel("Client name")).toBeVisible();
  });
});
