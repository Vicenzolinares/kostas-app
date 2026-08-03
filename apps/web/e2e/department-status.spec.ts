import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("department status board renders departments and utilization chart", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/department-status");
  await expect(
    page.getByRole("heading", { name: "Department Status" }),
  ).toBeVisible();
  await expect(page.getByTestId("utilization-chart")).toBeVisible();
  await expect(page.getByTestId("department-card").first()).toBeVisible();
});
