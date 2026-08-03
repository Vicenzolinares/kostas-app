import type { Page } from "@playwright/test";

/**
 * Signs in as the seeded local admin user (see
 * packages/database/src/scripts/seed.ts). Tests assume the local
 * Postgres has been migrated + seeded before the Playwright webServer
 * starts (see docs/PROGRESS.md "Running tests locally").
 */
export async function signInAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@kostas.local");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}
