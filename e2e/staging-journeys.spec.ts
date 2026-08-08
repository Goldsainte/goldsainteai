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
  // Enter through the same door a human does: ?mode=signup lands directly in
  // the signup flow. (First run entered at bare /auth — the LOGIN view — and
  // spent 3 minutes waiting for a signup-only field that never existed there.)
  await page.goto("/auth?mode=signup");
  // Role picker precedes the details form; the cards are labeled exactly
  // "Traveler" / "Creator" / "Travel Agent". If the details form is already
  // showing (role preselected), skip the click.
  const emailField = page.locator("#signupEmail");
  if (!(await emailField.isVisible().catch(() => false))) {
    await page.getByText("Traveler", { exact: true }).first().click();
  }
  await expect(emailField, "signup details form should appear").toBeVisible({
    timeout: 20_000,
  });
  await emailField.fill(EMAIL);
  await page.locator("#firstName").fill(FIRST);
  await page.locator("#lastName").fill(LAST);
  await page.locator("#password").fill(PASSWORD);
  await page
    .getByRole("button", { name: /create account|sign up|continue|get started/i })
    .last()
    .click();
  // Confirm-email is OFF on staging, so signup logs straight into a session —
  // but travelers then hit a SECOND screen, /auth/complete-profile (role
  // re-pick + prefilled names; founder-discovered Aug 8, and note it's still
  // under /auth, so "left /auth" alone would hang here). Walk it like a human.
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/auth") || url.pathname.includes("complete-profile"),
    { timeout: 45_000 },
  );
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
    await page.getByRole("button", { name: /continue to goldsainte|continue/i }).click();
  }
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 45_000,
  });
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

    // Stripe-hosted Checkout (sandbox). Stable placeholder-based fills.
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 });
    const emailField = page.getByPlaceholder(/email/i).first();
    if (await emailField.isVisible().catch(() => false)) {
      const val = await emailField.inputValue().catch(() => "");
      if (!val) await emailField.fill(EMAIL);
    }
    await page.getByPlaceholder("1234 1234 1234 1234").fill(TEST_CARD);
    await page.getByPlaceholder("MM / YY").fill("12 / 30");
    await page.getByPlaceholder("CVC").fill("123");
    const nameOnCard = page.getByPlaceholder(/full name/i).first();
    if (await nameOnCard.isVisible().catch(() => false)) {
      await nameOnCard.fill(`${FIRST} ${LAST}`);
    }
    const zip = page.getByPlaceholder(/zip|postal/i).first();
    if (await zip.isVisible().catch(() => false)) {
      await zip.fill("28134");
    }
    await page.getByRole("button", { name: /subscribe|pay/i }).click();

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
