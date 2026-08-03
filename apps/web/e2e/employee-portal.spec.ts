import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("employee portal renders clock panel and queues a clock-in offline-first", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/employee-portal");
  await expect(
    page.getByRole("heading", { name: "Employee Portal" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Time clock" })).toBeVisible();

  await page.getByRole("button", { name: "Clock in" }).click();
  await expect(page.getByRole("button", { name: "Clock out" })).toBeVisible();
});
