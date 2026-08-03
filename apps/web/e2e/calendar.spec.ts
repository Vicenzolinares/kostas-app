import { test, expect } from "./fixtures";

test.describe("Calendar", () => {
  test("renders the calendar with month/week/day/list views", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
    await expect(page.locator(".fc")).toBeVisible();
    await expect(page.getByRole("button", { name: "month" })).toBeVisible();
  });
});
