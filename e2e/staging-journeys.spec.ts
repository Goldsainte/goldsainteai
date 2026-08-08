// 1098: Staging journeys — the Phase 1 payoff. A synthetic traveler is born,
// subscribes to Goldsainte Verified with a Stripe test card, and (once the
// identity journey is enabled) earns a gold seal — on a schedule, end to end,
// with zero real users and zero real dollars.
//
// STAGING ONLY. The config and workflow both guard against prod targets, and
// every account is unique per run: e2e+<runid>@goldsainte.ai. Staging will
// slowly accumulate synthetic users; to wipe it, run the public-schema reset
// SQL in the staging SQL editor and re-run Sync Staging Schema.
//
// Selector philosophy: ids where the code has them (#signupEmail etc., read
// from src/pages/Auth.tsx), text/role selectors elsewhere. Stripe-hosted
// pages use Stripe's stable placeholders. First runs of write-path journeys
// routinely need one round of selector tuning — failures attach screenshots
// and traces precisely so that tuning takes minutes, not guesswork.
import { test, expect, type Page } from "@playwright/test";

const RUN_ID = `${Date.now()}`;
const EMAIL = `e2e+${RUN_ID}@goldsainte.ai`;
const PASSWORD = `E2e!${RUN_ID}x`;
const FIRST = "Synthetic";
const LAST = `Traveler${RUN_ID.slice(-4)}`;

// Stripe's universal test card: succeeds instantly, no 3DS.
const TEST_CARD = "4242424242424242";

async function signUpTraveler(page: Page) {
  // The signup flow is a THREE-step machine (read from Auth.tsx, not guessed):
  //   1. account-type cards  — skipped entirely via the app's own ?role= param
  //   2. "email" step        — placeholder "Email address" + a 'Continue' button
  //   3. "signup" step       — the #signupEmail details form (email prefilled)
  // Runs 1-2 died waiting for #signupEmail while standing on step 2.
  await page.goto("/auth?mode=signup&role=traveler");
  const stepEmail = page.getByPlaceholder("Email address").first();
  await expect(stepEmail, "email step should appear").toBeVisible({ timeout: 20_000 });
  await stepEmail.fill(EMAIL);
  // exact:true — "Continue with Google" also matches a bare 'Continue'
  // (run 4's strict-mode violation; the log itself printed this fix).
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const emailField = page.locator("#signupEmail");
  await expect(emailField, "signup details form should appear").toBeVisible({
    timeout: 20_000,
  });
  // Email arrives prefilled from the previous step; fill only if empty.
  if (!(await emailField.inputValue().catch(() => "x"))) {
    await emailField.fill(EMAIL);
  }
  await page.locator("#firstName").fill(FIRST);
  await page.locator("#lastName").fill(LAST);
  await page.locator("#password").fill(PASSWORD);
  // Exact label from auth.createAccount — no fuzzy matching near a screen
  // that also contains Continue-family buttons.
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  // Staging signups sometimes report "Account already exists" even though
  // THIS very request created the user (verified in auth.users, Aug 8 — a
  // network-layer replay artifact the page can't see past). Both outcomes
  // mean the credentials are now real, so accept either: navigation, or the
  // exists-toast → its own Sign In action → password → session.
  const navigated = () =>
    page.waitForURL(
      (url) => !url.pathname.startsWith("/auth") || url.pathname.includes("complete-profile"),
      { timeout: 45_000 },
    );
  const existsToast = page.getByText("Account already exists").first();
  const outcome = await Promise.race([
    navigated().then(() => "navigated" as const),
    existsToast.waitFor({ state: "visible", timeout: 45_000 }).then(() => "exists" as const),
  ]).catch(() => "neither" as const);
  if (outcome === "exists") {
    // Toast action → password-only signin step (email carried in state).
    await page.getByRole("button", { name: "Sign In", exact: true }).first().click();
    const pw = page.locator("#password");
    await expect(pw, "signin password step should appear").toBeVisible({ timeout: 20_000 });
    await pw.fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await navigated();
  } else if (outcome === "neither") {
    throw new Error("signup neither navigated nor reported an existing account within 45s");
  }
  if (page.url().includes("complete-profile")) {
    const travelerCard = page.getByText(/^traveler$/i).first();
    if (await travelerCard.isVisible().catch(() => false)) {
      await travelerCard.click();
    }
    // Names arrive prefilled from signup metadata; fill only if empty.
    for (const [sel, val] of [["#firstName", FIRST], ["#lastName", LAST]] as const) {
      const field = page.locator(sel).first();
      if (await field.isVisible().catch(() => false)) {
        if (!(await field.inputValue().catch(() => "x"))) await field.fill(val);
      }
    }
    await page
      .getByRole("button", { name: "Continue to Goldsainte", exact: true })
      .click();
  }
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 45_000,
  });
}

// Stripe Checkout (with Link enabled) renders its email/card fields inside
// IFRAMES (link-login-inner, elements-inner — seen in the Aug 8 trace), so
// page-level locators never find them. These helpers hunt every frame.
async function fillInAnyFrame(
  page: Page,
  placeholder: RegExp | string,
  value: string,
  timeoutMs = 60_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const loc = frame.getByPlaceholder(placeholder).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.fill(value);
        return true;
      }
    }
    await page.waitForTimeout(500);
  }
  return false;
}

async function clickInAnyFrame(page: Page, name: RegExp, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const loc = frame.getByRole("button", { name }).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.click();
        return true;
      }
    }
    await page.waitForTimeout(500);
  }
  return false;
}

test.describe.serial("staging journeys — signup to seal", () => {
  test("J1: a traveler account is born and lands signed in", async ({ page }) => {
    await signUpTraveler(page);
    // The account menu avatar / dashboard chrome proves an authenticated
    // session, whatever the landing route is for a fresh traveler.
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("link", { name: /goldsainte/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("J2: the traveler subscribes to Goldsainte Verified with a test card", async ({
    page,
  }) => {
    await signUpTraveler(page);
    // Settings is role-forwarded by /settings (SettingsRedirect); the
    // Get Verified card sits at the top of the traveler settings tab.
    await page.goto("/settings");
    // Exact CTA from the gv i18n namespace: "Get Verified".
    const buyButton = page
      .getByRole("button", { name: /^get verified$/i })
      .first();
    await expect(buyButton, "Get Verified card should render in settings").toBeVisible({
      timeout: 30_000,
    });
    await buyButton.click();

    // Stripe-hosted Checkout (sandbox), frame-aware — fields live in iframes.
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 });
    await fillInAnyFrame(page, /email/i, EMAIL, 30_000); // may be prefilled/absent
    const cardFilled = await fillInAnyFrame(page, "1234 1234 1234 1234", TEST_CARD);
    expect(cardFilled, "card number field should be found in some frame").toBe(true);
    await fillInAnyFrame(page, "MM / YY", "12 / 30", 20_000);
    await fillInAnyFrame(page, "CVC", "123", 20_000);
    await fillInAnyFrame(page, /full name/i, `${FIRST} ${LAST}`, 10_000);
    await fillInAnyFrame(page, /zip|postal/i, "28134", 10_000);
    const paid = await clickInAnyFrame(page, /subscribe|^pay/i);
    expect(paid, "a Subscribe/Pay button should be clickable in some frame").toBe(true);

    // Back on Goldsainte: the card polls the webhook-driven activation and
    // flips to "One step left: confirm your identity". This one assertion
    // proves checkout fn + test price ids + sandbox webhook + signing secret
    // + profile activation, end to end.
    await page.waitForURL(/goldsainte\.ai/, { timeout: 90_000 });
    await expect(
      page.getByText(/one step left/i),
      "verification should activate via the sandbox webhook after checkout",
    ).toBeVisible({ timeout: 60_000 });
  });

  // J3 exercises Stripe Identity's HOSTED verification page in sandbox mode.
  // Stripe owns that UI and its test-mode controls; automating it blind is
  // how flaky suites are born. ENABLE THIS after one manual pass: complete
  // the identity step by hand on staging once, note the buttons the sandbox
  // shows (it offers simulated verification), replace the marked selectors,
  // and delete the .skip. Everything up to Stripe's page is already covered.
  test.skip("J3: identity verification completes and the seal appears", async ({
    page,
  }) => {
    await signUpTraveler(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: /confirm my identity/i }).click();
    await page.waitForURL(/verify\.stripe\.com/, { timeout: 45_000 });
    // TUNE ME: sandbox Identity offers simulated documents / test completion.
    await page.getByRole("button", { name: /simulate|test/i }).click();
    await page.waitForURL(/goldsainte\.ai/, { timeout: 120_000 });
    await expect(
      page.getByRole("img", { name: "Goldsainte Verified" }).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});
