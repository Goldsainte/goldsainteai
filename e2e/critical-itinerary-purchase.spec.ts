import { test, expect } from '@playwright/test';

/**
 * P0 — Itinerary (packaged trip) purchase flow.
 * Smoke-level: verifies the booking page loads, requires auth, and the
 * "Confirm & pay" action invokes a checkout-creation edge function.
 *
 * Set PLAYWRIGHT_TEST_TRIP_ID to a known packaged_trips row to exercise
 * the full path. Without it, the spec verifies the auth gate only.
 */

const TRIP_ID = process.env.PLAYWRIGHT_TEST_TRIP_ID;
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Itinerary purchase — packaged trip booking', () => {
  test('unauthenticated visitor is redirected to /auth from /book/:id', async ({ page }) => {
    const id = TRIP_ID ?? 'placeholder-trip-id';
    await page.goto(`/book/${id}`);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  });

  test('authenticated booking submits to checkout edge function', async ({ page }) => {
    test.skip(!TRIP_ID || !TEST_EMAIL || !TEST_PASSWORD,
      'Requires PLAYWRIGHT_TEST_TRIP_ID + TEST_EMAIL + TEST_PASSWORD env vars');

    await page.goto('/auth');
    await page.locator('input[type="email"]').fill(TEST_EMAIL!);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD!);
    await page.locator('button:has-text("Sign in"), button:has-text("Log in")').first().click();
    await page.waitForURL(/\/(home|travel-feed|profile|traveler)/, { timeout: 15000 });

    // Watch for the checkout-creation network call
    const checkoutCall = page.waitForRequest(
      (req) => /functions\/v1\/(create-(trip-)?checkout|create-stripe-checkout|book-trip)/.test(req.url())
        && req.method() === 'POST',
      { timeout: 15000 },
    );

    await page.goto(`/book/${TRIP_ID}`);
    await page.waitForLoadState('networkidle');

    // Acknowledge legal checkboxes if present
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check({ force: true }).catch(() => {});
    }

    const cta = page.locator('button:has-text("Confirm"), button:has-text("Pay"), button:has-text("Request a Trip"), button:has-text("Continue to payment")').first();
    await cta.click();
    const req = await checkoutCall;
    expect(req.url()).toMatch(/checkout|book/);
  });
});