import { test, expect } from '@playwright/test';

/**
 * Test Suite 4: Homepage & Core Navigation
 * Covers homepage loading, hero section, navigation, and key CTAs
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page loaded
    await expect(page).toHaveTitle(/Goldsainte/i);
    
    // Should show main content
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should display header navigation', async ({ page }) => {
    // Check for header
    await expect(page.locator('header, [role="banner"]')).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    // Check for hero content
    const hero = page.locator('[data-testid="hero"], .hero-section, h1').first();
    await expect(hero).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Click on a navigation link
    const navLink = page.locator('nav a, [role="navigation"] a').first();
    const linkText = await navLink.textContent();
    
    await navLink.click();
    await page.waitForLoadState('networkidle');
    
    // URL should have changed
    expect(page.url()).not.toBe(`${page.url().split('?')[0]}`);
  });

  test('should display CTA buttons', async ({ page }) => {
    // Check for primary CTA
    const ctaButton = page.locator('button:has-text("Start"), button:has-text("Get Started"), a:has-text("Start"), a:has-text("Get Started")').first();
    await expect(ctaButton).toBeVisible({ timeout: 5000 });
  });

  test('should open AI concierge widget', async ({ page }) => {
    // Look for concierge trigger button
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button:has-text("Hey Goldsainte"), [aria-label="AI Concierge"]').first();
    
    if (await conciergeButton.isVisible()) {
      await conciergeButton.click();
      await page.waitForTimeout(1000);
      
      // Widget should open
      await expect(page.locator('[data-testid="concierge-widget"], [role="dialog"]')).toBeVisible();
    }
  });

  test('should close welcome modal if present', async ({ page }) => {
    // Check for welcome modal
    const modal = page.locator('[data-testid="welcome-modal"], [role="dialog"]:has-text("Welcome")');
    
    if (await modal.isVisible()) {
      const closeButton = modal.locator('button[aria-label="Close"], button:has-text("Close")').first();
      await closeButton.click();
      await page.waitForTimeout(500);
      
      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    }
  });

  test('should have footer with links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Check for footer
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toBeVisible();
    
    // Should have links
    const footerLinks = footer.locator('a');
    await expect(footerLinks.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, context }) => {
    // Set mobile viewport
    await context.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check for mobile menu button if present
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label="Menu"]');
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should load images correctly', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Check all images loaded
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first few images loaded
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const img = images.nth(i);
        await expect(img).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
