// 1085: Synthetic-monitor config — runs the READ-ONLY prod smoke suite
// against the live site. Deliberately separate from playwright.config.ts,
// whose webServer block always boots a localhost dev server (the reason the
// main suite has been parked since Jul 11). This config has NO webServer.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "prod-smoke.spec.ts",
  timeout: 60_000,
  retries: 1, // one retry absorbs transient network flakes without hiding real breakage
  fullyParallel: true,
  reporter: [["list"], ["github"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://goldsainte.ai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Pixel 5 is Chromium-based — shares the Chromium install.
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    // Phase 3 wave 1 (Aug 8): real WebKit engine, so Safari-specific
    // rendering/JS quirks stop passing unseen. Workflow installs webkit too.
    { name: "safari", use: { ...devices["Desktop Safari"] } },
  ],
});
