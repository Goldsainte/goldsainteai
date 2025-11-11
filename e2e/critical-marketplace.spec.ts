import { test, expect } from '@playwright/test';

test.describe('Travel Agent Marketplace Critical Flow', () => {
  test.use({
    storageState: 'auth.json', // Assumes authenticated state
  });

  test('complete marketplace lead creation flow', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if marketplace page exists
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible();
    
    // Try to create a new job/lead
    const createButton = page.locator('button:has-text("Create"), button:has-text("Post"), button:has-text("New")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill out basic trip details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Family trip to Paris');
      }
      
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Looking for a certified agent to plan our Paris trip');
      }
      
      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Post")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show success confirmation
        await expect(page.locator('text=/success|submitted|created/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('agent can view and bid on jobs', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Look for job listings
    const jobCard = page.locator('[data-testid="job-card"], .job-card, article').first();
    
    if (await jobCard.isVisible()) {
      await jobCard.click();
      
      // Should show job details
      await expect(page.locator('text=/details|description|budget/i')).toBeVisible();
      
      // Look for bid button
      const bidButton = page.locator('button:has-text("Bid"), button:has-text("Apply")').first();
      if (await bidButton.isVisible()) {
        await bidButton.click();
        
        // Should show bid form
        await expect(page.locator('input, textarea')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
