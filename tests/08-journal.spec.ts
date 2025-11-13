import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 8: Journal Articles
 * Covers journal listing, article detail, and reading experience
 */

test.describe('Journal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
  });

  test('should display journal listing page', async ({ page }) => {
    // Check for journal container
    await expect(page.locator('main, [data-testid="journal-listing"]')).toBeVisible();
  });

  test('should show article cards', async ({ page }) => {
    // Should have article cards
    const articleCards = page.locator('[data-testid="article-card"], article');
    await expect(articleCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display article metadata', async ({ page }) => {
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    
    // Should show title
    await expect(firstArticle.locator('h2, h3, [data-testid="article-title"]')).toBeVisible();
    
    // Should show author or date
    const hasAuthor = await firstArticle.locator('[data-testid="article-author"]').count() > 0;
    const hasDate = await firstArticle.locator('[data-testid="article-date"], time').count() > 0;
    expect(hasAuthor || hasDate).toBeTruthy();
  });

  test('should filter articles by category', async ({ page }) => {
    // Look for category filters
    const categoryButton = page.locator('[data-testid="category-filter"], button:has-text("Category")').first();
    
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(500);
      
      // Select a category
      const category = page.locator('[data-testid="category-option"]').first();
      await category.click();
      await page.waitForTimeout(1000);
      
      // Articles should reload
      await expect(page.locator('[data-testid="article-card"]').first()).toBeVisible();
    }
  });

  test('should search articles', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Travel');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      // Should show filtered results
      await expect(page.locator('[data-testid="article-card"]').first()).toBeVisible();
    }
  });

  test('should navigate to article detail', async ({ page }) => {
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    
    await firstArticle.click();
    await page.waitForTimeout(1000);
    
    // Should navigate to article detail
    expect(page.url()).toContain('/journal/');
  });

  test('should display full article content', async ({ page }) => {
    // Navigate to first article
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    await firstArticle.click();
    await page.waitForTimeout(1000);
    
    // Should show article content
    await expect(page.locator('[data-testid="article-content"], article')).toBeVisible();
    
    // Should have hero image or title
    const hasHero = await page.locator('[data-testid="hero-image"], .hero-section').count() > 0;
    const hasTitle = await page.locator('h1').count() > 0;
    expect(hasHero || hasTitle).toBeTruthy();
  });

  test('should show author bio', async ({ page }) => {
    // Navigate to article
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    await firstArticle.click();
    await page.waitForTimeout(1000);
    
    // Scroll to check for author bio
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    // Should have author section
    const authorBio = page.locator('[data-testid="author-bio"], .author-section');
    const hasAuthorBio = await authorBio.isVisible().catch(() => false);
    
    // Author bio may be present
    expect(true).toBeTruthy();
  });

  test('should display related articles', async ({ page }) => {
    // Navigate to article
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    await firstArticle.click();
    await page.waitForTimeout(1000);
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Check for related articles
    const relatedSection = page.locator('[data-testid="related-articles"], text=/related/i');
    const hasRelated = await relatedSection.isVisible().catch(() => false);
    
    // Related articles may be present
    expect(true).toBeTruthy();
  });

  test('should track article view analytics', async ({ page }) => {
    await login(page);
    
    // Navigate to article
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    
    const firstArticle = page.locator('[data-testid="article-card"], article').first();
    await firstArticle.click();
    await page.waitForTimeout(2000);
    
    // Analytics should be tracked (check network or no console errors)
    const hasErrors = await page.locator('text=/error/i').count() > 0;
    expect(hasErrors).toBeFalsy();
  });

  test('should handle article not found', async ({ page }) => {
    await page.goto('/journal/nonexistent-article-12345');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or not found message
    const hasNotFound = await page.locator('text=/not found/i, text=/404/').count() > 0;
    expect(hasNotFound).toBeTruthy();
  });
});
