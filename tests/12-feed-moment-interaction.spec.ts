import { test, expect } from '@playwright/test';

/**
 * E2E Test: Feed Moment Interaction
 * Tests: feed scroll → open moment → add comment → like/unlike
 */

test.describe('Feed Moment Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('scroll feed and interact with moment', async ({ page }) => {
    // Step 1: Navigate to feed
    await page.goto('/travel-feed');
    await page.waitForLoadState('networkidle');
    
    // Wait for feed to load
    await expect(page.locator('[data-testid="feed-container"]').or(page.locator('.feed')).or(page.locator('main'))).toBeVisible();
    
    // Step 2: Verify initial posts are visible
    const initialPosts = page.locator('[data-testid="moment-card"]').or(page.locator('[data-testid="post-card"]')).or(page.locator('article'));
    await expect(initialPosts.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await initialPosts.count();
    expect(initialCount).toBeGreaterThan(0);

    // Step 3: Scroll down to load more posts
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    // Verify more posts loaded (infinite scroll)
    const afterScrollCount = await initialPosts.count();
    // May or may not have loaded more, depending on implementation
    expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount);

    // Step 4: Click on first moment/post to open viewer
    const firstPost = initialPosts.first();
    await firstPost.click();
    
    // Wait for moment viewer/modal to open
    await expect(
      page.locator('[data-testid="moment-viewer"]')
        .or(page.locator('[role="dialog"]'))
        .or(page.locator('.modal'))
    ).toBeVisible({ timeout: 5000 });

    // Step 5: Add a comment
    const commentInput = page.locator('input[placeholder*="comment" i]')
      .or(page.locator('textarea[placeholder*="comment" i]'))
      .or(page.locator('input[placeholder*="reply" i]'));
    
    if (await commentInput.isVisible()) {
      await commentInput.fill('Great moment! 🌟');
      
      // Find and click submit button
      const submitButton = page.getByRole('button', { name: /post|send|submit/i });
      await submitButton.click();
      
      // Verify comment appears
      await expect(page.getByText('Great moment! 🌟')).toBeVisible({ timeout: 5000 });
    }

    // Step 6: Like the moment
    const likeButton = page.getByRole('button', { name: /like|heart/i }).or(
      page.locator('[data-testid="like-button"]')
    );
    
    if (await likeButton.isVisible()) {
      // Get initial like state
      const initialLiked = await likeButton.getAttribute('aria-pressed') === 'true' ||
        await likeButton.getAttribute('data-liked') === 'true';
      
      // Click like
      await likeButton.click();
      await page.waitForTimeout(500);
      
      // Verify like state changed (button should update)
      const afterLiked = await likeButton.getAttribute('aria-pressed') === 'true' ||
        await likeButton.getAttribute('data-liked') === 'true';
      
      expect(afterLiked).not.toBe(initialLiked);

      // Step 7: Unlike the moment
      await likeButton.click();
      await page.waitForTimeout(500);
      
      // Verify like state changed back
      const finalLiked = await likeButton.getAttribute('aria-pressed') === 'true' ||
        await likeButton.getAttribute('data-liked') === 'true';
      
      expect(finalLiked).toBe(initialLiked);
    }

    // Step 8: Close moment viewer
    const closeButton = page.getByRole('button', { name: /close/i }).or(
      page.locator('[aria-label*="close" i]')
    );
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
      
      // Verify viewer is closed
      await expect(
        page.locator('[data-testid="moment-viewer"]')
          .or(page.locator('[role="dialog"]'))
      ).not.toBeVisible();
    }
  });

  test('feed scroll with keyboard navigation', async ({ page }) => {
    await page.goto('/travel-feed');
    await page.waitForLoadState('networkidle');
    
    // Wait for posts
    const posts = page.locator('[data-testid="moment-card"]').or(page.locator('article'));
    await expect(posts.first()).toBeVisible({ timeout: 10000 });

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify moment opens
    await expect(
      page.locator('[data-testid="moment-viewer"]')
        .or(page.locator('[role="dialog"]'))
    ).toBeVisible({ timeout: 3000 });
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await expect(
      page.locator('[data-testid="moment-viewer"]')
    ).not.toBeVisible();
  });
});
