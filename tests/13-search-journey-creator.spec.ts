import { test, expect } from '@playwright/test';

/**
 * E2E Test: Search Journey and Follow Creator
 * Tests: search → open journey → follow creator
 * 
 * NOTE: Legacy social feed disabled in favor of TikTok creator ecosystem
 */

test.describe.skip('Search Journey and Follow Creator - DISABLED', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('search for journey and follow creator', async ({ page }) => {
    // Step 1: Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Step 2: Perform search
    const searchInput = page.locator('input[type="search"]')
      .or(page.locator('input[placeholder*="search" i]'))
      .or(page.locator('[data-testid="search-input"]'));
    
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Paris travel');
    await page.waitForTimeout(500); // Debounce
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Step 3: Verify results appear
    const results = page.locator('[data-testid="search-result"]')
      .or(page.locator('[data-testid="journey-card"]'))
      .or(page.locator('article'));
    
    await expect(results.first()).toBeVisible({ timeout: 10000 });
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);

    // Step 4: Open first journey
    const firstResult = results.first();
    await firstResult.click();
    
    // Wait for journey detail page/modal
    await expect(
      page.locator('[data-testid="journey-detail"]')
        .or(page.locator('h1'))
        .or(page.locator('[role="dialog"]'))
    ).toBeVisible({ timeout: 5000 });

    // Step 5: Locate and verify creator info
    const creatorSection = page.locator('[data-testid="creator-info"]')
      .or(page.locator('.creator'))
      .or(page.getByText(/created by|author/i));
    
    await expect(creatorSection).toBeVisible({ timeout: 5000 });

    // Step 6: Find and click follow button
    const followButton = page.getByRole('button', { name: /follow|subscribe/i })
      .or(page.locator('[data-testid="follow-button"]'));
    
    if (await followButton.isVisible()) {
      // Get initial follow state
      const initialText = await followButton.textContent();
      const isFollowing = initialText?.toLowerCase().includes('following') || 
                          initialText?.toLowerCase().includes('unfollow');
      
      // Click follow/unfollow
      await followButton.click();
      await page.waitForTimeout(1000);
      
      // Verify button text changed
      const afterText = await followButton.textContent();
      expect(afterText?.toLowerCase()).not.toBe(initialText?.toLowerCase());
      
      // If we just followed, verify it shows "Following" or "Unfollow"
      if (!isFollowing) {
        expect(
          afterText?.toLowerCase().includes('following') || 
          afterText?.toLowerCase().includes('unfollow')
        ).toBeTruthy();
      }

      // Step 7: Unfollow to restore state
      await followButton.click();
      await page.waitForTimeout(1000);
      
      // Verify we're back to original state
      const finalText = await followButton.textContent();
      expect(finalText?.toLowerCase()).toBe(initialText?.toLowerCase());
    }
  });

  test('search with filters', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Perform initial search
    const searchInput = page.locator('input[type="search"]')
      .or(page.locator('input[placeholder*="search" i]'));
    
    await searchInput.fill('travel');
    await page.waitForTimeout(500);

    // Try to apply filters if available
    const filterButton = page.getByRole('button', { name: /filter/i })
      .or(page.locator('[data-testid="filter-button"]'));
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Select a category filter if available
      const categoryOption = page.locator('[data-testid*="category"]')
        .or(page.getByText(/destination|adventure|luxury/i)).first();
      
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForTimeout(1000);
        
        // Verify filtered results
        const filteredResults = page.locator('[data-testid="search-result"]')
          .or(page.locator('article'));
        await expect(filteredResults.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('navigate from search to creator profile', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Search for content
    const searchInput = page.locator('input[type="search"]')
      .or(page.locator('input[placeholder*="search" i]'));
    
    await searchInput.fill('destination');
    await page.waitForTimeout(1000);

    // Find result with creator info
    const creatorLink = page.locator('a[href*="/profile/"]')
      .or(page.locator('[data-testid="creator-link"]')).first();
    
    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      
      // Verify we're on creator profile page
      await expect(page).toHaveURL(/profile/, { timeout: 5000 });
      
      // Verify profile content
      await expect(
        page.locator('h1').or(page.locator('[data-testid="profile-name"]'))
      ).toBeVisible();
    }
  });
});
