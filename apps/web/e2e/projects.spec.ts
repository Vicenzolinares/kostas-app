import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("create a project and see it in the table", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  const uniqueName = `Playwright Test Project ${Date.now()}`;

  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill(uniqueName);
  await page.getByLabel("Client name").fill("Playwright Client");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByRole("link", { name: uniqueName })).toBeVisible();
});
