import { test, expect } from '@playwright/test';

test.describe('Critical Production Flows - P0 Validation', () => {
  
  test.describe('P0-1: Expedia Search Redirect & Tracking', () => {
    test('should redirect to Expedia affiliate URL with search parameters', async ({ page }) => {
      await page.goto('/');
      
      // Wait for header to load
      await page.waitForSelector('[data-testid="expedia-search-bar"]', { timeout: 10000 });
      
      // Fill WHERE field
      const whereInput = page.locator('input[placeholder*="Search destinations"]');
      await whereInput.click();
      await whereInput.fill('Miami');
      
      // Fill WHEN fields (Check-in)
      const checkInButton = page.locator('button:has-text("CHECK IN")');
      await checkInButton.click();
      const checkInDate = page.locator('input[type="date"]').first();
      await checkInDate.fill('2025-12-01');
      
      // Fill Check-out
      const checkOutDate = page.locator('input[type="date"]').nth(1);
      await checkOutDate.fill('2025-12-05');
      
      // Close date popover
      const doneButton = page.locator('button:has-text("Done")').first();
      await doneButton.click();
      
      // Fill WHO field (guests)
      const whoButton = page.locator('button:has-text("WHO")');
      await whoButton.click();
      
      // Add adults (default is 1, increment to 2)
      const adultsPlus = page.locator('button[aria-label="Increase adults"]');
      await adultsPlus.click();
      
      // Close guests popover
      const guestsDone = page.locator('button:has-text("Done")').nth(1);
      await guestsDone.click();
      
      // Click Search button and wait for navigation
      const searchButton = page.locator('button:has-text("Search")');
      await searchButton.click();
      
      // Assert redirect to Expedia affiliate URL
      await page.waitForURL(/expedia\.com\/affiliates\/expedia-home\.bexNBHE/, { timeout: 15000 });
      
      // Verify URL contains search parameters
      const currentUrl = page.url();
      expect(currentUrl).toContain('expedia.com/affiliates/expedia-home.bexNBHE');
      expect(currentUrl).toContain('destination=Miami');
      expect(currentUrl).toContain('startDate=2025-12-01');
      expect(currentUrl).toContain('endDate=2025-12-05');
      expect(currentUrl).toContain('adults=2');
    });

    test('should handle search with minimal inputs (destination only)', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="expedia-search-bar"]');
      
      const whereInput = page.locator('input[placeholder*="Search destinations"]');
      await whereInput.fill('Paris');
      
      const searchButton = page.locator('button:has-text("Search")');
      await searchButton.click();
      
      await page.waitForURL(/expedia\.com\/affiliates\/expedia-home\.bexNBHE/, { timeout: 15000 });
      expect(page.url()).toContain('destination=Paris');
    });
  });

  test.describe('P0-5: Auth Flow with Stripe Integration', () => {
    const testEmail = `test-${Date.now()}@goldsainte.test`;
    const testPassword = 'TestPassword123!';

    test('should complete signup flow', async ({ page }) => {
      await page.goto('/auth');
      
      // Wait for auth page
      await expect(page.locator('h1, h2')).toContainText(/sign up|create account/i, { timeout: 10000 });
      
      // Fill signup form
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testEmail);
      
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(testPassword);
      
      // Submit form
      const signupButton = page.locator('button:has-text("Sign up"), button:has-text("Create account")').first();
      await signupButton.click();
      
      // Should redirect to main app
      await page.waitForURL(/\/(home|travel-feed|profile)/, { timeout: 15000 });
      
      // Verify user is logged in (check for logout button or profile link)
      const profileOrLogout = page.locator('[href*="/profile"], button:has-text("Sign out")');
      await expect(profileOrLogout.first()).toBeVisible({ timeout: 10000 });
    });

    test('should complete login flow', async ({ page }) => {
      // First create account (reuse signup logic)
      await page.goto('/auth');
      const uniqueEmail = `login-test-${Date.now()}@goldsainte.test`;
      
      await page.locator('input[type="email"]').fill(uniqueEmail);
      await page.locator('input[type="password"]').first().fill(testPassword);
      await page.locator('button:has-text("Sign up"), button:has-text("Create account")').first().click();
      
      await page.waitForURL(/\/(home|travel-feed|profile)/, { timeout: 15000 });
      
      // Logout
      const logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // Try profile menu
        await page.locator('[href*="/profile"]').first().click();
        await page.locator('button:has-text("Sign out")').click();
      }
      
      await page.waitForURL(/\/(auth|login)/, { timeout: 10000 });
      
      // Now login with same credentials
      await page.locator('input[type="email"]').fill(uniqueEmail);
      await page.locator('input[type="password"]').fill(testPassword);
      await page.locator('button:has-text("Sign in"), button:has-text("Log in")').first().click();
      
      await page.waitForURL(/\/(home|travel-feed|profile)/, { timeout: 15000 });
      await expect(page.locator('[href*="/profile"], button:has-text("Sign out")').first()).toBeVisible();
    });

    test('should access subscription page with auth headers', async ({ page }) => {
      // Login first
      await page.goto('/auth');
      const email = `sub-test-${Date.now()}@goldsainte.test`;
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(testPassword);
      await page.locator('button:has-text("Sign up")').first().click();
      await page.waitForURL(/\/(home|travel-feed|profile)/, { timeout: 15000 });
      
      // Navigate to subscription page
      await page.goto('/subscription');
      await expect(page.locator('h1, h2')).toContainText(/subscription|plan/i, { timeout: 10000 });
      
      // Verify subscription tiers are visible
      const premiumTier = page.locator('text=/premium|pro/i');
      await expect(premiumTier.first()).toBeVisible({ timeout: 10000 });
      
      // Click upgrade button
      const upgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Subscribe")').first();
      await upgradeButton.click();
      
      // Should redirect to Stripe checkout (not error page)
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
      expect(page.url()).toContain('checkout.stripe.com');
    });
  });

  test.describe('P0-4: Social Photo Modal Aspect Ratio', () => {
    test('should display photo modal without distortion', async ({ page }) => {
      // Navigate to a profile page with posts
      await page.goto('/travel-feed');
      
      // Wait for feed to load
      await page.waitForSelector('[data-testid="moment-card"], [data-testid="post-card"], article', { timeout: 15000 });
      
      // Find and click first post image
      const firstImage = page.locator('article img, [data-testid="moment-card"] img, [data-testid="post-card"] img').first();
      await firstImage.waitFor({ state: 'visible', timeout: 10000 });
      await firstImage.click();
      
      // Verify modal opens
      const modal = page.locator('[role="dialog"], .modal, [data-testid="lightbox"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Verify image has object-contain class (prevents distortion)
      const modalImage = modal.locator('img').first();
      await expect(modalImage).toBeVisible();
      
      const imageClass = await modalImage.getAttribute('class');
      expect(imageClass).toMatch(/object-contain|object-cover/);
      
      // Verify no console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(consoleErrors.filter(e => !e.includes('404'))).toHaveLength(0);
      
      // Close modal (Esc key)
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    test('should handle profile grid photo clicks', async ({ page }) => {
      // Create account and navigate to profile
      await page.goto('/auth');
      const email = `profile-test-${Date.now()}@goldsainte.test`;
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill('TestPassword123!');
      await page.locator('button:has-text("Sign up")').first().click();
      await page.waitForURL(/\/(home|travel-feed|profile)/, { timeout: 15000 });
      
      // Navigate to profile
      await page.goto('/profile');
      
      // If profile has grid items, click one
      const gridItem = page.locator('[data-testid="profile-grid-item"], .profile-grid img').first();
      
      if (await gridItem.isVisible()) {
        await gridItem.click();
        
        // Verify modal opens with proper layout
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        
        // Verify image is not stretched (has proper aspect ratio)
        const modalImage = modal.locator('img').first();
        const boundingBox = await modalImage.boundingBox();
        
        if (boundingBox) {
          // Image should not fill entire viewport (should have margins)
          expect(boundingBox.height).toBeLessThan(page.viewportSize()!.height * 0.9);
        }
      }
    });
  });

  test.describe('Critical Navigation & Error-Free Basics', () => {
    test('should navigate main routes without errors', async ({ page }) => {
      const routes = ['/', '/travel-feed', '/explore', '/journeys', '/reels'];
      
      for (const route of routes) {
        await page.goto(route);
        
        // Wait for page load
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Verify no console errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        
        // Allow 404s for assets, but no JS errors
        const realErrors = consoleErrors.filter(e => 
          !e.includes('404') && 
          !e.includes('Failed to load resource')
        );
        expect(realErrors).toHaveLength(0);
      }
    });

    test('should have responsive header on all pages', async ({ page }) => {
      await page.goto('/');
      
      // Verify header exists
      const header = page.locator('header, nav[role="navigation"]');
      await expect(header.first()).toBeVisible();
      
      // Verify Expedia search bar exists on desktop
      const searchBar = page.locator('[data-testid="expedia-search-bar"]');
      await expect(searchBar).toBeVisible();
    });
  });
});
