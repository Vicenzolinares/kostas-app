import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

test("project fabrics page renders the grid and pipeline overview", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/project-fabrics");
  await expect(
    page.getByRole("heading", { name: "Project Fabrics" }),
  ).toBeVisible();
  await expect(page.getByTestId("project-fabrics-grid")).toBeVisible();
  await expect(page.getByText("Pipeline overview")).toBeVisible();
});
