import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("client measurements page renders the canvas editor", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/client-measurements");
  await expect(
    page.getByRole("heading", { name: "Client Measurements" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New measurement" }).click();
  await expect(page.getByTestId("measurement-canvas")).toBeVisible();
  await expect(page.getByLabel("Furniture piece")).toBeVisible();
});
