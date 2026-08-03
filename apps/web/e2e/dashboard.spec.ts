import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("dashboard renders KPI widgets and the widget grid", async ({ page }) => {
  await signInAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByTestId("dashboard-grid")).toBeVisible();
  await expect(page.getByText("Total projects")).toBeVisible();
});
