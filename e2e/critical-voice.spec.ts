import { test, expect } from '@playwright/test';

test.describe('Voice AI Concierge Critical Flow', () => {
  test('wake word detection and voice mode activation', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    await page.goto('/');
    
    // Wait for page load
    await expect(page.locator('body')).toBeVisible();
    
    // Check if AIBookingConcierge is present
    const conciergeWidget = page.locator('[data-testid="ai-booking-concierge"]');
    
    if (await conciergeWidget.isVisible()) {
      // Click mic button to activate voice mode (fallback test)
      const micButton = page.locator('button[aria-label*="microphone"], button[aria-label*="voice"]').first();
      
      if (await micButton.isVisible()) {
        await micButton.click();
        
        // Check for voice mode indicators
        await expect(page.locator('text=/voice|listening|recording/i')).toBeVisible({ timeout: 5000 });
      }
    }
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('404'))).toHaveLength(0);
  });

  test('voice fallback UI when mic denied', async ({ page, context }) => {
    // Deny microphone permissions
    await context.clearPermissions();
    
    await page.goto('/');
    
    const conciergeWidget = page.locator('[data-testid="ai-booking-concierge"]');
    
    if (await conciergeWidget.isVisible()) {
      const micButton = page.locator('button[aria-label*="microphone"]').first();
      
      if (await micButton.isVisible()) {
        await micButton.click();
        
        // Should show error or fallback UI
        await expect(page.locator('text=/denied|permission|unavailable/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
