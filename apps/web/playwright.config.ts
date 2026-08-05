import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3100";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Same `dotenv -e ../../.env` wrapper the dev/start scripts use. A bare
    // `next start` here inherits none of the monorepo-root env, so every
    // spec that signs in died on "AUTH_SECRET is not set" — invisible when
    // the suite only ever ran in CI, where the vars come from the workflow.
    command: `pnpm exec dotenv -e ../../.env -- next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
