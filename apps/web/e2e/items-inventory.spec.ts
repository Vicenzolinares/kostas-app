import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("create an inventory item and see it in the table", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/items-inventory");
  await expect(
    page.getByRole("heading", { name: "Items & Inventory" }),
  ).toBeVisible();

  const sku = `SKU-${Date.now()}`;

  await page.getByRole("button", { name: "New item" }).click();
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Name").fill("Playwright Test Item");
  await page.getByRole("button", { name: "Create item" }).click();

  await expect(page.getByText(sku)).toBeVisible();
  await expect(page.getByTestId("warehouse-map")).toBeVisible();
});
