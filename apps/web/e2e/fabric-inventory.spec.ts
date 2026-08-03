import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("create a fabric and see it in the grid", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/fabric-inventory");
  await expect(
    page.getByRole("heading", { name: "Fabric Inventory" }),
  ).toBeVisible();
  await expect(page.getByTestId("fabric-grid")).toBeVisible();

  const code = `FAB-${Date.now()}`;

  await page.getByRole("button", { name: "New fabric" }).click();
  await page.getByLabel("Fabric code").fill(code);
  await page.getByLabel("Name").fill("Playwright Test Fabric");
  await page.getByRole("button", { name: "Create fabric" }).click();

  await expect(page.getByText(code)).toBeVisible();
});
