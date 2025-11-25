import { test, expect } from "@playwright/test";

test.describe("health check", () => {
  test("renders the OK marker", async ({ page }) => {
    await page.goto("/health");
    await expect(page.getByTestId("health-check")).toHaveText("OK");
  });
});
