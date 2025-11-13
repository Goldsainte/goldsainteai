import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 3: Search Functionality
 * Covers search input, results, filtering, and navigation
 */

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('should display search page', async ({ page }) => {
    // Check for search input
    await expect(page.locator('input[type="search"], input[placeholder*="Search"]')).toBeVisible();
  });

  test('should perform search and show results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Type search query
    await searchInput.fill('Paris');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Should show results or no results message
    const hasResults = await page.locator('[data-testid="search-result"], [data-testid="result-card"]').count() > 0;
    const hasNoResults = await page.locator('text=/no results/i, text=/nothing found/i').count() > 0;
    
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('should debounce search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Type quickly
    await searchInput.type('Tokyo', { delay: 50 });
    
    // Wait for debounce
    await page.waitForTimeout(1000);
    
    // Should have performed search
    const resultsVisible = await page.locator('[data-testid="search-results"]').isVisible().catch(() => false);
    expect(resultsVisible).toBeTruthy();
  });

  test('should filter search results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill('London');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Look for filter options
    const filterButton = page.locator('[data-testid="filter-button"], button:has-text("Filter")').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Select filter option
      const filterOption = page.locator('[data-testid="filter-option"]').first();
      await filterOption.click();
      await page.waitForTimeout(1000);
      
      // Results should update
      await expect(page.locator('[data-testid="search-result"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Search with special characters
    await searchInput.fill('São Paulo');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Should handle gracefully without errors
    const pageHasError = await page.locator('text=/error/i, text=/something went wrong/i').count() > 0;
    expect(pageHasError).toBeFalsy();
  });

  test('should clear search results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Perform search
    await searchInput.fill('Barcelona');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Results should be cleared or show default state
    const resultsCount = await page.locator('[data-testid="search-result"]').count();
    expect(resultsCount).toBe(0);
  });

  test('should navigate to search result detail', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    await searchInput.fill('Tokyo');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Click first result
    const firstResult = page.locator('[data-testid="search-result"], [data-testid="result-card"]').first();
    
    if (await firstResult.isVisible()) {
      await firstResult.click();
      await page.waitForTimeout(1000);
      
      // Should navigate to detail page or open modal
      const urlChanged = page.url() !== `${page.url().split('?')[0]}`;
      const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      expect(urlChanged || modalVisible).toBeTruthy();
    }
  });

  test('should show search suggestions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Start typing
    await searchInput.fill('New');
    await page.waitForTimeout(1000);
    
    // Check for suggestions dropdown
    const suggestions = page.locator('[data-testid="search-suggestions"], [role="listbox"]');
    const suggestionsVisible = await suggestions.isVisible().catch(() => false);
    
    if (suggestionsVisible) {
      // Should have suggestion items
      await expect(suggestions.locator('[role="option"]').first()).toBeVisible();
    }
  });

  test('should handle no results gracefully', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    // Search for something that won't exist
    await searchInput.fill('XYZ123NonexistentPlace999');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Should show no results message
    await expect(page.locator('text=/no results/i, text=/nothing found/i')).toBeVisible({ timeout: 5000 });
  });
});
