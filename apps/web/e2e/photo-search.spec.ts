import { test, expect } from "./fixtures";

test.describe("AI Photo Search", () => {
  test("renders the upload dropzone", async ({ page }) => {
    await page.goto("/photo-search");
    await expect(page.getByRole("heading", { name: "AI Photo Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose photo" })).toBeVisible();
  });
});
