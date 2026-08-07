// 1086: READ-ONLY production smoke suite (Phase 0 of the synthetic monitor).
// Safe against the live site: navigates and asserts only — never signs up,
// never submits a form, never touches Stripe. Write-path journeys (account
// creation, subscriptions) are Phase 1 and belong on staging with test keys.
//
// Every page visit checks three invariants:
//   1. No uncaught JS exception (would have caught the Aug 7 sealMap crash).
//   2. No unexpected console.error (allowlist below for benign noise).
//   3. No horizontal overflow at either viewport (the CSS/overflow class).
import { test, expect, type Page } from "@playwright/test";

const JORDAN_ID = "26f6cfd7-54f0-4af3-bef0-a3a400fd82bb";
const SUPABASE_URL = "https://ktzsgqrqvwtxlimctkaf.supabase.co";
// Publishable anon key — already public in every page load; safe to embed.
const SUPABASE_ANON_KEY = "sb_publishable_i5xwYqNzT3JOevhcl7-J3w_J2oofXm5";

// console.error noise that is expected on a public page (extend deliberately,
// with a dated comment, when a new benign pattern appears — never silently).
const CONSOLE_ERROR_ALLOWLIST: RegExp[] = [
  /favicon/i,
  /manifest/i,
  /Failed to load resource.*40[134]/i, // authed endpoints probed while signed out
  /net::ERR_BLOCKED_BY_CLIENT/i, // ad blockers in local runs
];

type PageErrors = { uncaught: string[]; console: string[] };

function armErrorTraps(page: Page): PageErrors {
  const errors: PageErrors = { uncaught: [], console: [] };
  page.on("pageerror", (err) => errors.uncaught.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_ERROR_ALLOWLIST.some((re) => re.test(text))) return;
    errors.console.push(text);
  });
  return errors;
}

async function assertHealthyPage(page: Page, errors: PageErrors) {
  // 1 + 2: error traps
  expect(errors.uncaught, "uncaught JS exceptions on the page").toEqual([]);
  expect(errors.console, "unexpected console.error output").toEqual([]);
  // 3: horizontal overflow — the page must not scroll sideways.
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: content is ${overflow.scrollWidth}px wide in a ${overflow.innerWidth}px viewport`,
  ).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

test.describe("prod smoke — read-only", () => {
  test("home renders clean", async ({ page }) => {
    const errors = armErrorTraps(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: /goldsainte/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await assertHealthyPage(page, errors);
  });

  test("health marker responds", async ({ page }) => {
    const errors = armErrorTraps(page);
    await page.goto("/health");
    await expect(page.getByTestId("health-check")).toHaveText("OK", { timeout: 20_000 });
    await assertHealthyPage(page, errors);
  });

  test("auth page renders its form", async ({ page }) => {
    const errors = armErrorTraps(page);
    await page.goto("/auth");
    await expect(page.locator("input[type='email']").first()).toBeVisible({ timeout: 20_000 });
    await assertHealthyPage(page, errors);
  });

  test("creators grid renders and Jordan wears the seal", async ({ page }) => {
    const errors = armErrorTraps(page);
    await page.goto("/creators");
    const jordanCard = page.getByText("Jordan Woods", { exact: false }).first();
    await expect(jordanCard, "creators grid should list Jordan Woods").toBeVisible({
      timeout: 25_000,
    });
    // The gold seal on the grid asserts the WHOLE badge pipeline end-to-end:
    // paid subscription + Stripe Identity + webhook stamp + verified_seals
    // view + frontend hook. If any link breaks, this line goes red.
    await expect(
      page.getByRole("img", { name: "Goldsainte Verified" }).first(),
      "Goldsainte Verified seal missing from the creators grid",
    ).toBeVisible({ timeout: 25_000 });
    await assertHealthyPage(page, errors);
  });

  test("Jordan's public profile renders with the seal", async ({ page }) => {
    const errors = armErrorTraps(page);
    await page.goto(`/creators/${JORDAN_ID}`);
    await expect(page.getByText("Jordan Woods").first()).toBeVisible({ timeout: 25_000 });
    await expect(
      page.getByRole("img", { name: "Goldsainte Verified" }).first(),
      "Goldsainte Verified seal missing from the public profile",
    ).toBeVisible({ timeout: 25_000 });
    await assertHealthyPage(page, errors);
  });

  test("platform probe: verified_seals API answers correctly", async ({ request }) => {
    // Direct REST probe — catches Supabase platform trouble (like the Aug 7
    // evening CLI/API incident) independently of the frontend.
    const res = await request.get(`${SUPABASE_URL}/rest/v1/verified_seals?select=id`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    expect(res.status(), "verified_seals REST endpoint should answer 200").toBe(200);
    const rows = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(rows)).toBe(true);
    expect(
      rows.some((r) => r.id === JORDAN_ID),
      "Jordan's id should be present in verified_seals",
    ).toBe(true);
  });
});
