import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * P0 — Email pipeline side-effect smoke.
 * After signup, an `email_send_log` row should appear (queued or sent)
 * via the auth-email-hook → enqueue_email → process-email-queue path.
 *
 * Requires PLAYWRIGHT_SUPABASE_URL + PLAYWRIGHT_SUPABASE_SERVICE_KEY to
 * read email_send_log. Without them the spec falls back to verifying the
 * signup flow completes without a client-side error.
 */

const SUPABASE_URL = process.env.PLAYWRIGHT_SUPABASE_URL;
const SERVICE_KEY = process.env.PLAYWRIGHT_SUPABASE_SERVICE_KEY;

async function pollEmailLog(email: string, timeoutMs = 30_000): Promise<any | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const ctx = await pwRequest.newContext({
    baseURL: SUPABASE_URL,
    extraHTTPHeaders: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await ctx.get(
      `/rest/v1/email_send_log?recipient_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`,
    );
    if (res.ok()) {
      const rows = await res.json();
      if (rows.length > 0) {
        await ctx.dispose();
        return rows[0];
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await ctx.dispose();
  return null;
}

test.describe('Email pipeline — signup triggers queued auth email', () => {
  test('new signup produces an email_send_log row', async ({ page }) => {
    const email = `e2e-email-${Date.now()}@goldsainte.test`;
    const password = 'TestPassword123!';

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/auth');
    const signupTab = page.locator('button:has-text("Sign up"), [role="tab"]:has-text("Sign up")').first();
    if (await signupTab.isVisible().catch(() => false)) await signupTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button:has-text("Sign up"), button:has-text("Create account")').first().click();

    // Don't require a specific redirect — admin-approval flow may stay on /auth.
    await page.waitForLoadState('networkidle');
    expect(errors, `Client errors: ${errors.join('; ')}`).toEqual([]);

    if (!SUPABASE_URL || !SERVICE_KEY) {
      test.info().annotations.push({
        type: 'skip-deep',
        description: 'Set PLAYWRIGHT_SUPABASE_URL + SERVICE_KEY to verify email_send_log',
      });
      return;
    }

    const row = await pollEmailLog(email);
    expect(row, 'expected an email_send_log row for the new signup').not.toBeNull();
    expect(['pending', 'sent']).toContain(row.status);
  });
});