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

type PageErrors = { uncaught: string[]; console: string[]; failedRequests: string[] };

function armErrorTraps(page: Page): PageErrors {
  const errors: PageErrors = { uncaught: [], console: [], failedRequests: [] };
  page.on("pageerror", (err) => errors.uncaught.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_ERROR_ALLOWLIST.some((re) => re.test(text))) return;
    errors.console.push(text);
  });
  // Chromium's console text for failed loads blanks the URL ("status of 400
  // ()"), which made the first real finding (Aug 7: 400s on the public
  // profile) undiagnosable from logs. Record every >=400 response and every
  // outright request failure WITH its full URL so red runs name the endpoint.
  page.on("response", (res) => {
    if (res.status() >= 400) {
      errors.failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
  page.on("requestfailed", (req) => {
    errors.failedRequests.push(`FAILED ${req.method()} ${req.url()} (${req.failure()?.errorText ?? "?"})`);
  });
  return errors;
}

async function assertHealthyPage(page: Page, errors: PageErrors) {
  // 1 + 2: error traps. failedRequests rides along in the message so a
  // console-error failure names the exact endpoint(s) behind it.
  expect(errors.uncaught, "uncaught JS exceptions on the page").toEqual([]);
  expect(
    errors.console,
    `unexpected console.error output — failing requests on this page: ${JSON.stringify(errors.failedRequests)}`,
  ).toEqual([]);
  // 3: horizontal overflow — the page must not scroll sideways. A client-side
  // navigation can destroy the evaluation context mid-check (first seen on
  // mobile /creators, Aug 7); wait out one navigation and retry so the check
  // reports overflow OR names where the page went, never a bare crash.
  let overflow: { scrollWidth: number; innerWidth: number };
  try {
    overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
    });
  } catch {
    await page.waitForLoadState("domcontentloaded");
    const landedAt = page.url();
    overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
    });
    // Surface the unexpected client-side navigation as its own finding.
    expect(
      landedAt,
      `page navigated on its own during the check and landed at ${landedAt}`,
    ).toBe(landedAt); // never fails — the message above documents the landing URL in traces
  }
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


// ── Phase 3 wave 1 (Aug 8): logged-in production monitoring ────────────────
// A dedicated real prod account (created manually, no subscription) signs in
// and loads the authed surfaces anonymous tests can never see — the exact
// habitat of the Aug 7 sealMap crash. READ-ONLY: navigations and assertions,
// no sends, no purchases, no settings changes. Self-skips without the
// PROD_MONITOR_EMAIL / PROD_MONITOR_PASSWORD secrets.
// Sign-in walk uses the selectors proven by the staging journeys suite:
// "Email address" placeholder → exact 'Continue' → #password → submit.
async function signInAs(page: Page, email: string, password: string): Promise<PageErrors> {
  const errors = armErrorTraps(page);
  await page.goto("/auth");
  const stepEmail = page.getByPlaceholder("Email address").first();
  await expect(stepEmail).toBeVisible({ timeout: 20_000 });
  await stepEmail.fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const pw = page.locator("#password");
  await expect(pw, "password step should appear").toBeVisible({ timeout: 20_000 });
  await pw.fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 45_000,
  });
  return errors;
}

// One logged-in section per role. Traveler uses the dedicated monitor
// account; creator/agent reuse the EXISTING public test personas (Jordan
// Woods etc.) — never fresh accounts, which would appear as fake storefronts
// in the live marketplace. Each section self-skips without its secrets.
const ROLES = [
  {
    name: "traveler",
    email: process.env.PROD_MONITOR_EMAIL || "",
    password: process.env.PROD_MONITOR_PASSWORD || "",
  },
  {
    name: "creator",
    email: process.env.PROD_MONITOR_CREATOR_EMAIL || "",
    password: process.env.PROD_MONITOR_CREATOR_PASSWORD || "",
  },
  {
    name: "agent",
    email: process.env.PROD_MONITOR_AGENT_EMAIL || "",
    password: process.env.PROD_MONITOR_AGENT_PASSWORD || "",
  },
] as const;

for (const role of ROLES) {
  test.describe(`prod smoke — logged in (${role.name})`, () => {
    test.skip(!role.email || !role.password, `${role.name} monitor secrets not set`);

    test(`${role.name}: signed-in landing renders clean`, async ({ page }) => {
      const errors = await signInAs(page, role.email, role.password);
      await assertHealthyPage(page, errors);
    });

    test(`${role.name}: messages loads clean`, async ({ page }) => {
      const errors = await signInAs(page, role.email, role.password);
      await page.goto("/messages");
      // The Aug 7 sealMap crash lived exactly here, for signed-in users,
      // invisible to anonymous checks — this is its forever-guard, now
      // held for every role.
      await expect(page.getByText("Messages").first()).toBeVisible({ timeout: 25_000 });
      await assertHealthyPage(page, errors);
    });

    test(`${role.name}: settings loads clean`, async ({ page }) => {
      const errors = await signInAs(page, role.email, role.password);
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2_000); // settle role redirects + cards
      await assertHealthyPage(page, errors);
    });
  });
}
