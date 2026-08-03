import { test, expect } from "./fixtures";

test.describe("Emails", () => {
  test("lists emails and opens the compose page", async ({ page }) => {
    await page.goto("/emails");
    await expect(page.getByRole("heading", { name: "Emails" })).toBeVisible();

    await page.getByRole("link", { name: "Compose" }).click();
    await expect(page).toHaveURL(/\/emails\/compose/);
    await expect(page.getByLabel(/^To/)).toBeVisible();
  });
});
