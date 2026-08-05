import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

const MARIA_PIN = "1234";

test.describe("Employee portal", () => {
  test("the kiosk lists only PIN-enabled staff and signs them in", async ({
    page,
  }) => {
    // Public by design — this is what an unauthenticated wall tablet shows.
    await page.goto("/employee-login");

    await expect(page.getByText(/Employee Login/)).toBeVisible();
    await expect(page.getByText("Maria Gallardo")).toBeVisible();
    // Office accounts have no PIN, so they must never appear on the grid.
    await expect(page.getByText("Victoria Alvarez")).toHaveCount(0);

    await page.getByText("Maria Gallardo").click();
    await expect(page.getByText(/Enter your PIN/)).toBeVisible();

    for (const digit of MARIA_PIN.split("")) {
      await page
        .getByRole("button", { name: new RegExp(`^${digit}`) })
        .first()
        .click();
      await page.waitForTimeout(150);
    }

    await page.waitForURL("**/employee-portal", { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /Maria/ })).toBeVisible();
  });

  test("a wrong PIN is refused without saying which part was wrong", async ({
    page,
  }) => {
    await page.goto("/employee-login");
    await page.getByText("Maria Gallardo").click();

    for (const digit of "9999".split("")) {
      await page
        .getByRole("button", { name: new RegExp(`^${digit}`) })
        .first()
        .click();
      await page.waitForTimeout(150);
    }

    // Scoped to the PIN screen: Next's route announcer is also role="alert".
    await expect(page.getByText(/Incorrect PIN/)).toBeVisible();
    await expect(page).toHaveURL(/\/employee-login/);
  });

  test("the dashboard shows derived hours and a running timer", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/employee-portal");

    await expect(page.getByText(/Active Timer/)).toBeVisible();
    await expect(page.getByText(/Hours This Week/).first()).toBeVisible();
    await expect(page.getByText(/My Tasks/)).toBeVisible();
    await expect(page.getByText(/Work Orders/).first()).toBeVisible();
  });

  test("the language toggle switches the portal to Spanish", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/employee-portal");

    await page.getByRole("button", { name: "Español" }).click();
    await expect(page.getByText("Horas Esta Semana").first()).toBeVisible();
    // Spanish only — the combined EN + ES mode is a separate setting.
    await expect(page.getByText("Hours This Week")).toHaveCount(0);
  });
});
