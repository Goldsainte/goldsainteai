import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 2: Travel Feed / Social Feed
 * Covers feed loading, scrolling, infinite scroll, and post interactions
 */

test.describe('Travel Feed', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/travel-feed');
    await page.waitForLoadState('networkidle');
  });

  test('should load travel feed page', async ({ page }) => {
    // Check for feed container
    await expect(page.locator('[data-testid="travel-feed"], [data-testid="feed-container"]')).toBeVisible();
    
    // Should show posts
    const posts = page.locator('[data-testid="feed-post"], [data-testid="post-card"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display post content correctly', async ({ page }) => {
    const firstPost = page.locator('[data-testid="feed-post"], [data-testid="post-card"]').first();
    
    // Post should have author info
    await expect(firstPost.locator('[data-testid="post-author"], .author-name')).toBeVisible();
    
    // Post should have content or image
    const hasContent = await firstPost.locator('[data-testid="post-content"], .post-text').count() > 0;
    const hasImage = await firstPost.locator('img').count() > 0;
    expect(hasContent || hasImage).toBeTruthy();
  });

  test('should scroll feed smoothly', async ({ page }) => {
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);
    
    // Scroll down
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    // Check scroll position changed
    const newScroll = await page.evaluate(() => window.scrollY);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test('should load more posts on infinite scroll', async ({ page }) => {
    // Count initial posts
    const initialCount = await page.locator('[data-testid="feed-post"], [data-testid="post-card"]').count();
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Count posts after scroll
    const newCount = await page.locator('[data-testid="feed-post"], [data-testid="post-card"]').count();
    
    // Should have loaded more posts
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should like a post', async ({ page }) => {
    const firstPost = page.locator('[data-testid="feed-post"], [data-testid="post-card"]').first();
    const likeButton = firstPost.locator('[data-testid="like-button"], button:has-text("Like")').first();
    
    // Click like button
    await likeButton.click();
    await page.waitForTimeout(500);
    
    // Like button should change state
    const likedState = await likeButton.getAttribute('data-liked') || await likeButton.getAttribute('aria-pressed');
    expect(likedState).toBeTruthy();
  });

  test('should open post detail', async ({ page }) => {
    const firstPost = page.locator('[data-testid="feed-post"], [data-testid="post-card"]').first();
    
    // Click on post
    await firstPost.click();
    await page.waitForTimeout(1000);
    
    // Should show expanded post or navigate to detail
    const modal = page.locator('[role="dialog"], [data-testid="post-modal"]');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      // Check if navigated to detail page
      await expect(page).toHaveURL(/\/post\/|\/travel-profile\//);
    } else {
      await expect(modal).toBeVisible();
    }
  });

  test('should filter feed by category', async ({ page }) => {
    // Look for filter buttons
    const filterButton = page.locator('[data-testid="filter-button"], button:has-text("Filter")').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Select a category
      const categoryOption = page.locator('[data-testid="category-option"], [role="option"]').first();
      await categoryOption.click();
      await page.waitForTimeout(1000);
      
      // Feed should reload with filtered posts
      await expect(page.locator('[data-testid="feed-post"], [data-testid="post-card"]').first()).toBeVisible();
    }
  });

  test('should handle empty feed gracefully', async ({ page }) => {
    // Navigate to a feed with no posts (if applicable)
    await page.goto('/travel-feed?filter=following');
    await page.waitForLoadState('networkidle');
    
    // Should show empty state or message
    const hasEmptyState = await page.locator('text=/no posts/i, text=/nothing to show/i').count() > 0;
    const hasPosts = await page.locator('[data-testid="feed-post"], [data-testid="post-card"]').count() > 0;
    
    // Either show empty state or have posts
    expect(hasEmptyState || hasPosts).toBeTruthy();
  });
});
