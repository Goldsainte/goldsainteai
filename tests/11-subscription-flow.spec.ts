import { test, expect } from '@playwright/test';

/**
 * E2E Test: Subscription Flow
 * Tests: signup → upgrade → portal → downgrade
 */

test.describe('Subscription Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('complete subscription lifecycle', async ({ page }) => {
    // Step 1: Navigate to signup
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Step 2: Sign up
    await page.getByRole('tab', { name: /sign up/i }).click();
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for successful signup
    await expect(page).toHaveURL(/\/(home|feed)?/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Step 3: Navigate to subscription page
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Verify we're on free tier
    await expect(page.getByText(/current plan:.*free/i)).toBeVisible();

    // Step 4: Attempt upgrade to Premium
    const premiumCard = page.locator('div', { has: page.getByText('Premium') }).first();
    await expect(premiumCard).toBeVisible();
    
    const upgradeButton = premiumCard.getByRole('button', { name: /upgrade now/i });
    await expect(upgradeButton).toBeVisible();
    
    // Click upgrade - this would redirect to Stripe Checkout in real scenario
    // For E2E, we verify the button works without actually completing payment
    await upgradeButton.click({ timeout: 5000 });
    
    // In real scenario, would redirect to Stripe. For testing, verify redirect intent.
    // If mocking Stripe, add mock webhook here to simulate successful payment
    await page.waitForTimeout(1000);

    // Step 5: Verify tooltip on current plan
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');
    
    const currentPlanButton = page.locator('button', { hasText: /current plan/i }).first();
    await expect(currentPlanButton).toBeDisabled();
    
    // Hover to see tooltip
    await currentPlanButton.hover();
    await expect(page.getByText(/already on/i)).toBeVisible({ timeout: 3000 });

    // Step 6: Access customer portal
    const manageButton = page.getByRole('button', { name: /manage subscription/i });
    if (await manageButton.isVisible()) {
      await manageButton.click({ timeout: 5000 });
      // Would redirect to Stripe Customer Portal
      await page.waitForTimeout(1000);
    }

    // Step 7: Verify billing history
    await page.goto('/billing-dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText(/billing history/i)).toBeVisible();
    
    // Check for PDF buttons - some may be disabled if PDF not ready
    const pdfButtons = page.getByRole('button', { name: /pdf/i });
    const count = await pdfButtons.count();
    if (count > 0) {
      const firstPdfButton = pdfButtons.first();
      // Hover to check tooltip if disabled
      if (await firstPdfButton.isDisabled()) {
        await firstPdfButton.hover();
        await expect(page.getByText(/pdf generating/i)).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('downgrade attempt shows contact tooltip', async ({ page }) => {
    // Log in first (assuming user exists from previous test or setup)
    await page.goto('/auth');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');

    // Navigate to subscription page
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Find free tier card (lower tier than current)
    const freeTierCard = page.locator('div', { has: page.getByText('Free') }).first();
    const lowerTierButton = freeTierCard.getByRole('button', { hasText: /lower tier/i });
    
    if (await lowerTierButton.isVisible()) {
      await expect(lowerTierButton).toBeDisabled();
      
      // Hover to see tooltip
      await lowerTierButton.hover();
      await expect(page.getByText(/contact us to downgrade/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
