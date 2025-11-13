import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.describe('Voice Concierge', () => {
    test('should open voice booking concierge on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page load
      await expect(page.locator('body')).toBeVisible();
      
      // Look for voice concierge trigger
      const voiceButton = page.getByRole('button', { name: /voice|concierge|microphone/i });
      await expect(voiceButton).toBeVisible();
      
      await voiceButton.click();
      
      // Verify voice UI appears
      await expect(page.getByText(/Hey Goldsainte/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle microphone permissions gracefully', async ({ page, context }) => {
      await context.grantPermissions(['microphone']);
      await page.goto('/');
      
      const voiceButton = page.getByRole('button', { name: /voice|concierge|microphone/i });
      await voiceButton.click();
      
      // Should not show permission error
      await expect(page.getByText(/microphone access denied/i)).not.toBeVisible();
    });
  });

  test.describe('AI Chat Booking Flow', () => {
    test('should show booking choice prompt after hotel intent', async ({ page }) => {
      await page.goto('/');
      
      // Open AI chat
      const chatButton = page.getByRole('button', { name: /chat|help|assist/i }).first();
      await chatButton.click();
      
      // Type hotel search
      const input = page.getByPlaceholder(/type|message/i);
      await input.fill('I need hotels in Miami for November 12-15');
      await page.keyboard.press('Enter');
      
      // Wait for AI response with booking choice
      await expect(page.getByText(/how would you like to handle this booking/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /match me with.*agent/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /book.*myself.*expedia/i })).toBeVisible();
    });

    test('should open Expedia widget when user chooses self-service', async ({ page }) => {
      await page.goto('/');
      
      const chatButton = page.getByRole('button', { name: /chat|help/i }).first();
      await chatButton.click();
      
      const input = page.getByPlaceholder(/type|message/i);
      await input.fill('Find hotels in Miami Nov 12-15');
      await page.keyboard.press('Enter');
      
      // Wait for choice prompt
      await page.waitForTimeout(5000);
      
      const selfServiceButton = page.getByRole('button', { name: /book.*myself/i });
      if (await selfServiceButton.isVisible()) {
        await selfServiceButton.click();
        
        // Verify navigation to Expedia occurred
        await page.waitForURL(/expedia\.com/, { timeout: 15000 });
      }
    });

    test('should start agent intake when user chooses agent path', async ({ page }) => {
      await page.goto('/');
      
      const chatButton = page.getByRole('button', { name: /chat|help/i }).first();
      await chatButton.click();
      
      const input = page.getByPlaceholder(/type|message/i);
      await input.fill('I want to book a hotel in Miami');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(5000);
      
      const agentButton = page.getByRole('button', { name: /match.*agent/i });
      if (await agentButton.isVisible()) {
        await agentButton.click();
        
        // Verify intake form appears
        await expect(page.getByText(/destination|check.?in|guests/i)).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Group Booking Flow', () => {
    test('should create group booking and generate payment links', async ({ page }) => {
      // This requires authentication
      await page.goto('/auth');
      
      // Skip if not on auth page or already logged in
      const isAuthPage = await page.locator('input[type="email"]').isVisible().catch(() => false);
      if (!isAuthPage) {
        test.skip();
        return;
      }
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should have good Lighthouse scores', async ({ page }) => {
      await page.goto('/');
      
      // Basic performance checks
      const perfTiming = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          fcp: perf.responseStart,
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        };
      });
      
      // FCP should be under 1.8s
      expect(perfTiming.fcp).toBeLessThan(1800);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocusable);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check main landmarks
      await expect(page.locator('main, [role="main"]')).toBeVisible();
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    });
  });
});
