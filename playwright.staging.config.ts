// 1097: Staging journeys config — WRITE-PATH tests against staging only.
// Deliberately separate from playwright.prod.config.ts (read-only prod smoke):
// these journeys create accounts and spend test-mode money, and must never
// be pointed at production. The workflow hard-guards the target URL.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "staging-journeys.spec.ts",
  timeout: 180_000, // journeys cross Stripe-hosted pages; give them room
  retries: 1,
  workers: 1, // journeys share account state within a run — run serially
  reporter: [["list"], ["github"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.STAGING_BASE_URL || "https://staging.goldsainte.ai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
