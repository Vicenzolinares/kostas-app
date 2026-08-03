import { test as base, expect } from "@playwright/test";

/**
 * Logs in as the seeded admin (see packages/database/src/scripts/seed.ts)
 * before each test. Assumes `pnpm db:seed` has been run against the
 * target database.
 */
/* eslint-disable react-hooks/rules-of-hooks -- `use` below is Playwright's
   fixture-teardown callback, not React's `use()` hook. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@kostas.local");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await use(page);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect };
