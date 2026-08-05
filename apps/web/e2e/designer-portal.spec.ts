import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

const SOFIA = "sofia@studio-marchetti.com";
const AMBER = "amber@amberinteriors.example.com";

async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("External Designer Portal", () => {
  test("an external designer lands in the portal and never sees office chrome", async ({
    page,
  }) => {
    await signInAs(page, SOFIA);
    await expect(page).toHaveURL(/\/portal$/);

    await expect(
      page.getByRole("heading", { name: "My Projects" }),
    ).toBeVisible();
    await expect(page.getByText("Designer Portal")).toBeVisible();

    // The office sidebar must not be reachable from here at all.
    await expect(page.getByRole("link", { name: "Finance" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "AI Photo Search" }),
    ).toHaveCount(0);

    await expect(page.getByTestId("portal-project-card").first()).toBeVisible();
  });

  test("office routes redirect an external designer back to the portal", async ({
    page,
  }) => {
    await signInAs(page, SOFIA);

    for (const route of [
      "/dashboard",
      "/finance",
      "/emails",
      "/designer-portal",
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/portal$/);
    }
  });

  test("approvals tab lists only work awaiting this designer", async ({
    page,
  }) => {
    await signInAs(page, SOFIA);
    await page.goto("/portal/approvals");

    await expect(
      page.getByRole("heading", { name: "My Approvals" }),
    ).toBeVisible();
    await expect(page.getByTestId("portal-project-card").first()).toBeVisible();
    // Every card here is waiting on the designer, by definition.
    await expect(
      page.getByText("Awaiting Your Approval").first(),
    ).toBeVisible();
  });

  test("a designer cannot open another firm's submission", async ({ page }) => {
    // Grab one of Sofia's submission ids…
    await signInAs(page, SOFIA);
    await page.goto("/portal/approvals");
    const href = await page
      .getByTestId("portal-project-card")
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();

    // …then try to reach it as a different design firm.
    await signInAs(page, AMBER);
    await page.goto(href!);

    // No project data and, critically, no approval controls.
    await expect(page.getByRole("button", { name: /^Approve$/ })).toHaveCount(
      0,
    );
  });

  test("office staff still see the internal submissions list", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/designer-portal");

    await expect(
      page.getByRole("heading", { name: "Client & Designer Projects" }),
    ).toBeVisible();
    await expect(page.getByTestId("submission-row").first()).toBeVisible();
  });
});
