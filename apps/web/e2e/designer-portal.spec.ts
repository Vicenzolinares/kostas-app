import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("designer portal lists submissions", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/designer-portal");
  await expect(
    page.getByRole("heading", { name: "Designer Portal" }),
  ).toBeVisible();
});
