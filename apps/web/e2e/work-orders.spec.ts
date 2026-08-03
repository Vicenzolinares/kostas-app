import { test, expect } from "./fixtures";

test.describe("Work Orders", () => {
  test("lists work orders and starts the new work order wizard", async ({ page }) => {
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();

    await page.getByRole("link", { name: "New work order" }).click();
    await expect(page).toHaveURL(/\/work-orders\/new/);
    await expect(page.getByText("1. Choose Type")).toBeVisible();
  });

  test("wizard advances from type to project step", async ({ page }) => {
    await page.goto("/work-orders/new");
    await page.getByRole("button", { name: "Reupholstery" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("2. Project")).toBeVisible();
  });
});
