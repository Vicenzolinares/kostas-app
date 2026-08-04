import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("shop board kiosk display renders the three department columns", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/shop-board?department=upholstery");

  await expect(page.getByTestId("kiosk-board")).toBeVisible();

  // Defaults to the bilingual EN + ES mode from the mockups, so both
  // languages should be on screen at once.
  await expect(
    page.getByRole("heading", { name: /Working Now \/ Trabajando Ahora/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Up Next \/ Siguiente/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Needs Attention \/ Requiere Atención/i,
    }),
  ).toBeVisible();

  // The progress gauge and colour key are part of the TV layout.
  await expect(page.getByTestId("department-progress")).toBeVisible();
  await expect(page.getByTestId("board-legend")).toBeVisible();
});

test("shop board switches language and department", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/shop-board?department=seamstress");
  await expect(page.getByTestId("kiosk-board")).toBeVisible();

  // Spanish-only should drop the English column titles entirely.
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Trabajando Ahora" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Working Now/i })).toHaveCount(
    0,
  );

  // Each TV picks its own room.
  await expect(page.getByTestId("department-select")).toHaveValue("seamstress");
  await page.getByTestId("department-select").selectOption("carpentry");
  await expect(page.getByTestId("department-select")).toHaveValue("carpentry");
});
