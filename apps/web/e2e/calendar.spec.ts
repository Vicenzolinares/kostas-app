import { test, expect } from "./fixtures";

test.describe("Calendar", () => {
  test("renders the calendar with month/week/day/list views", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
    await expect(page.locator(".fc")).toBeVisible();
    // exact: true — FullCalendar's Previous/Next nav buttons also have
    // "month" as a substring of their accessible name (from their
    // title="Previous month"/"Next month" attributes), which the default
    // substring match ambiguously resolves to all three buttons.
    await expect(
      page.getByRole("button", { name: "month", exact: true }),
    ).toBeVisible();
  });
});
