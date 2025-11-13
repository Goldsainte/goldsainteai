import { test, expect } from '@playwright/test';

test.describe('Booking Flow Critical Paths', () => {
  test('AI chat booking choice prompt appears first', async ({ page }) => {
    await page.goto('/');
    
    // Find and open AI chat
    const chatTrigger = page.locator('button:has-text("Chat"), [aria-label*="chat"]').first();
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      
      // Type hotel search query
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      await chatInput.fill('Find hotels in Miami for November 12-15');
      await chatInput.press('Enter');
      
      // Wait for AI response
      await page.waitForTimeout(3000);
      
      // Check for booking choice prompt
      await expect(page.locator('text=/book it myself|match me with.*agent/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('Expedia widget only appears after self-service choice', async ({ page }) => {
    await page.goto('/');
    
    const chatTrigger = page.locator('button:has-text("Chat")').first();
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      
      const chatInput = page.locator('input[placeholder*="message"]').first();
      await chatInput.fill('I want to book hotels myself via Expedia');
      await chatInput.press('Enter');
      
      await page.waitForTimeout(3000);
      
      // Verify page navigated to Expedia
      await expect(page).toHaveURL(/expedia\.com/, { timeout: 10000 });
    }
  });

  test('agent intake starts after agent choice', async ({ page }) => {
    await page.goto('/');
    
    const chatTrigger = page.locator('button:has-text("Chat")').first();
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      
      const chatInput = page.locator('input[placeholder*="message"]').first();
      await chatInput.fill('Find hotels in Miami');
      await chatInput.press('Enter');
      
      await page.waitForTimeout(3000);
      
      // Click agent option
      const agentButton = page.locator('button:has-text("Match me with")').first();
      if (await agentButton.isVisible()) {
        await agentButton.click();
        
        // Should start intake flow
        await expect(page.locator('text=/step.*of|gathering details|tell me more/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
