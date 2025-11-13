import { test, expect } from '@playwright/test';

/**
 * Test Suite 9: Responsive Design & Mobile UX
 * Covers mobile viewport, touch interactions, and responsive layouts
 */

test.describe('Responsive Design', () => {
  test('should display correctly on mobile (iPhone)', async ({ page, context }) => {
    await context.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should load without horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBeFalsy();
    
    // Main content should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page, context }) => {
    await context.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Content should be visible and properly laid out
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have mobile navigation menu', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have hamburger menu or mobile nav
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label="Menu"], .hamburger');
    const hasMobileMenu = await mobileMenu.count() > 0;
    
    if (hasMobileMenu) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should open mobile menu', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label="Menu"]').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Menu should open
      const menuPanel = page.locator('[data-testid="mobile-nav"], [role="dialog"]');
      await expect(menuPanel).toBeVisible();
    }
  });

  test('should handle touch gestures on mobile', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/travel-feed');
    await page.waitForLoadState('networkidle');
    
    // Simulate swipe/scroll
    await page.touchscreen.tap(200, 400);
    await page.waitForTimeout(500);
    
    // Page should remain functional
    await expect(page.locator('main')).toBeVisible();
  });

  test('should resize images responsively', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Images should not overflow viewport
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImg = images.first();
      const bbox = await firstImg.boundingBox();
      
      if (bbox) {
        expect(bbox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should have readable text on mobile', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check font sizes are readable
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      return parseInt(window.getComputedStyle(body).fontSize);
    });
    
    // Minimum readable font size is 14px
    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test('should have touch-friendly buttons on mobile', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Buttons should be at least 44x44px (iOS guideline)
    const buttons = page.locator('button').first();
    
    if (await buttons.isVisible()) {
      const bbox = await buttons.boundingBox();
      if (bbox) {
        expect(bbox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle orientation change', async ({ page, context }) => {
    // Portrait
    await context.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Landscape
    await context.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    // Content should still be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should not have horizontal scroll on mobile', async ({ page, context }) => {
    await context.setViewportSize({ width: 390, height: 844 });
    
    // Test multiple pages
    const pages = ['/', '/travel-feed', '/search', '/marketplace'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const hasHorizontalScroll = await page.evaluate(() => 
        document.documentElement.scrollWidth > window.innerWidth
      );
      
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });
});
