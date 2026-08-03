import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("project view lists projects and opens the adaptive detail view", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/project-view");
  await expect(
    page.getByRole("heading", { name: "Project View" }),
  ).toBeVisible();

  const firstProjectLink = page.locator('a[href^="/project-view/"]').first();
  await expect(firstProjectLink).toBeVisible();
  await firstProjectLink.click();

  await expect(page.getByTestId("desktop-accordion")).toBeVisible();
});
