import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("reports page loads the default report with chart and table", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByTestId("report-chart")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export CSV/XLSX" }),
  ).toBeVisible();
});
