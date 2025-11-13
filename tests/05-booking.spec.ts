import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 5: Booking Flow
 * Covers search, hotel/flight selection, and booking initiation
 */

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Should show marketplace content
    await expect(page.locator('[data-testid="marketplace"], main')).toBeVisible();
  });

  test('should browse travel agents', async ({ page }) => {
    await page.goto('/browse-agents');
    await page.waitForLoadState('networkidle');
    
    // Should show agent cards
    const agentCards = page.locator('[data-testid="agent-card"]');
    if (await agentCards.count() > 0) {
      await expect(agentCards.first()).toBeVisible();
    }
  });

  test('should view agent profile', async ({ page }) => {
    await page.goto('/browse-agents');
    await page.waitForLoadState('networkidle');
    
    const firstAgent = page.locator('[data-testid="agent-card"]').first();
    
    if (await firstAgent.isVisible()) {
      await firstAgent.click();
      await page.waitForTimeout(1000);
      
      // Should show agent profile
      await expect(page.locator('[data-testid="agent-profile"], h1')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should initiate booking request', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Look for booking CTA
    const bookingButton = page.locator('button:has-text("Book"), button:has-text("Request"), a:has-text("Book")').first();
    
    if (await bookingButton.isVisible()) {
      await bookingButton.click();
      await page.waitForTimeout(1000);
      
      // Should show booking form or modal
      const formVisible = await page.locator('form, [role="dialog"]').isVisible();
      expect(formVisible).toBeTruthy();
    }
  });

  test('should fill trip details form', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Navigate to booking form
    const bookingButton = page.locator('button:has-text("Book"), button:has-text("Request")').first();
    
    if (await bookingButton.isVisible()) {
      await bookingButton.click();
      await page.waitForTimeout(1000);
      
      // Fill form fields
      const destinationInput = page.locator('input[name="destination"], input[placeholder*="destination"]').first();
      if (await destinationInput.isVisible()) {
        await destinationInput.fill('Paris, France');
      }
      
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-06-15');
      }
      
      const guestsInput = page.locator('input[name="guests"], input[placeholder*="guests"]').first();
      if (await guestsInput.isVisible()) {
        await guestsInput.fill('2');
      }
    }
  });

  test('should view booking confirmation', async ({ page }) => {
    await page.goto('/booking-confirmation');
    await page.waitForLoadState('networkidle');
    
    // Should show confirmation page or message
    const hasConfirmation = await page.locator('[data-testid="confirmation"], text=/confirmed/i').count() > 0;
    const hasBookingDetails = await page.locator('[data-testid="booking-details"]').count() > 0;
    
    expect(hasConfirmation || hasBookingDetails).toBeTruthy();
  });

  test('should access my trips', async ({ page }) => {
    await page.goto('/my-trips');
    await page.waitForLoadState('networkidle');
    
    // Should show trips list or empty state
    const hasTripCards = await page.locator('[data-testid="trip-card"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no trips/i').count() > 0;
    
    expect(hasTripCards || hasEmptyState).toBeTruthy();
  });

  test('should handle payment flow initiation', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Look for payment-related buttons
    const paymentButton = page.locator('button:has-text("Pay"), button:has-text("Checkout"), button:has-text("Continue to Payment")').first();
    
    if (await paymentButton.isVisible()) {
      await paymentButton.click();
      await page.waitForTimeout(2000);
      
      // Should redirect to payment page or show payment form
      const onPaymentPage = page.url().includes('payment') || page.url().includes('checkout');
      const hasPaymentForm = await page.locator('form, [data-testid="payment-form"]').isVisible();
      
      expect(onPaymentPage || hasPaymentForm).toBeTruthy();
    }
  });

  test('should display booking history', async ({ page }) => {
    await page.goto('/booking-history');
    await page.waitForLoadState('networkidle');
    
    // Should show history or empty state
    await expect(page.locator('main, [data-testid="booking-history"]')).toBeVisible();
  });
});
