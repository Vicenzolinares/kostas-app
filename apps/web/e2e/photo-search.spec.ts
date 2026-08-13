import { test, expect } from "./fixtures";

const SEEDED_SWATCH = ".local-storage/demo/searches/search-emerald-chair.png";

test.describe("AI Photo Search", () => {
  test("renders the upload dropzone", async ({ page }) => {
    await page.goto("/photo-search");
    await expect(
      page.getByRole("heading", { name: "AI Photo Search" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choose photo" }),
    ).toBeVisible();
  });

  test("an upload surfaces a confidence card that names the heuristic", async ({
    page,
  }) => {
    await page.goto("/photo-search");
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(SEEDED_SWATCH);

    const card = page.getByTestId("confidence-banner");
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toContainText("%");
    // The score must never read as semantic AI matching while the app is
    // ranking by colour distance — the label is the honesty guarantee.
    await expect(card).toContainText(/colour similarity/i);
  });

  test("recent searches show each review state, not one blanket status", async ({
    page,
  }) => {
    await page.goto("/photo-search");
    const recent = page.getByTestId("recent-searches");
    await expect(recent).toBeVisible();
    await expect(recent).toContainText("No match");
    await expect(recent).toContainText("Confirmed");
  });
});
