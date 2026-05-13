import { test, expect } from '@playwright/test';

/**
 * P0 — Bundle purchase flow.
 * Smoke-level: bundle detail page renders, builder requires auth,
 * and the checkout CTA invokes a checkout edge function.
 *
 * Set PLAYWRIGHT_TEST_BUNDLE_ID to exercise the detail page deeply.
 */

const BUNDLE_ID = process.env.PLAYWRIGHT_TEST_BUNDLE_ID;
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Bundle purchase — checkout flow', () => {
  test('bundle detail page renders without crashing', async ({ page }) => {
    const id = BUNDLE_ID ?? 'placeholder-bundle-id';
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/bundle/${id}`);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('bundle builder requires auth', async ({ page }) => {
    await page.goto('/bundle-builder');
    // Either redirected to /auth, or page renders an auth gate
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const onAuth = /\/auth/.test(url);
    const gateVisible = await page.locator('text=/sign in|log in|create account/i').first().isVisible().catch(() => false);
    expect(onAuth || gateVisible).toBe(true);
  });

  test('authenticated bundle checkout invokes edge function', async ({ page }) => {
    test.skip(!BUNDLE_ID || !TEST_EMAIL || !TEST_PASSWORD,
      'Requires PLAYWRIGHT_TEST_BUNDLE_ID + TEST_EMAIL + TEST_PASSWORD env vars');

    await page.goto('/auth');
    await page.locator('input[type="email"]').fill(TEST_EMAIL!);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD!);
    await page.locator('button:has-text("Sign in"), button:has-text("Log in")').first().click();
    await page.waitForURL(/\/(home|travel-feed|profile|traveler)/, { timeout: 15000 });

    const checkoutCall = page.waitForRequest(
      (req) => /functions\/v1\/(create-(bundle-)?checkout|create-stripe-checkout)/.test(req.url())
        && req.method() === 'POST',
      { timeout: 15000 },
    );

    await page.goto(`/bundle/${BUNDLE_ID}`);
    await page.waitForLoadState('networkidle');

    const cta = page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Checkout"), button:has-text("Continue to payment")').first();
    await cta.click();
    await checkoutCall;
  });
});