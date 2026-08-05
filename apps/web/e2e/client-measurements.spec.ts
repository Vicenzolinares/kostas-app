import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("client measurements page renders the canvas editor", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/client-measurements");
  await expect(
    page.getByRole("heading", { name: "Client Measurements" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New measurement" }).click();
  await expect(page.getByTestId("measurement-canvas")).toBeVisible();
  await expect(page.getByLabel("Furniture piece")).toBeVisible();
});

test.describe("Illustrated measurement sheets", () => {
  test("the list links through to both standard sheets", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/client-measurements");

    await page.getByTestId("open-measurement").first().click();
    await page.waitForURL(/client-measurements\/[0-9a-f-]{36}/);

    await expect(page.getByText("Sofa / Furniture Measurements")).toBeVisible();
    await expect(
      page.getByText("Window Treatments Measurements"),
    ).toBeVisible();
    // Both render even when only one has values — the pair is the standard
    // set someone walks into the house with.
    await expect(page.getByLabel("Overall Width in in")).toBeVisible();
    await expect(page.getByLabel("Rod Height in in")).toBeVisible();
  });

  test("switching to centimetres converts the displayed values", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/client-measurements");
    await page.getByTestId("open-measurement").first().click();
    await page.waitForURL(/client-measurements\/[0-9a-f-]{36}/);

    await expect(page.getByLabel("Overall Width in in")).toHaveValue("96");

    await page.getByRole("button", { name: "cm", exact: true }).first().click();
    await expect(page.getByLabel("Overall Width in cm")).toHaveValue("243.84");
  });

  test("dimensions can be hidden without losing the table", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/client-measurements");
    await page.getByTestId("open-measurement").first().click();
    await page.waitForURL(/client-measurements\/[0-9a-f-]{36}/);

    await page.getByRole("button", { name: "Hide dimensions" }).first().click();
    await expect(
      page.getByRole("button", { name: "Show dimensions" }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Overall Width in in")).toBeVisible();
  });
});
