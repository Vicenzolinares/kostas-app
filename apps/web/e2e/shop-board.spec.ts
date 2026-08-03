import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("shop board kiosk display renders", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/shop-board");
  await expect(page.getByTestId("kiosk-board")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shop Floor — Live Status" }),
  ).toBeVisible();
});
