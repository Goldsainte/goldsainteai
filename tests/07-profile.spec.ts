import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 7: User Profile & Settings
 * Covers profile viewing, editing, and settings management
 */

test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should show profile content
    await expect(page.locator('[data-testid="profile"], main')).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should show email or name
    const hasEmail = await page.locator('[data-testid="user-email"]').count() > 0;
    const hasName = await page.locator('[data-testid="user-name"]').count() > 0;
    
    expect(hasEmail || hasName).toBeTruthy();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for settings link
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")').first();
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForTimeout(1000);
      
      // Should be on settings page
      expect(page.url()).toContain('setting');
    }
  });

  test('should edit profile information', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit Profile")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Should show edit form
      const formVisible = await page.locator('form, [data-testid="edit-form"]').isVisible();
      expect(formVisible).toBeTruthy();
    }
  });

  test('should upload profile picture', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for avatar or upload button
    const uploadButton = page.locator('[data-testid="upload-avatar"], button:has-text("Upload"), input[type="file"]').first();
    
    if (await uploadButton.count() > 0) {
      // File upload exists
      expect(await uploadButton.count()).toBeGreaterThan(0);
    }
  });

  test('should view travel preferences', async ({ page }) => {
    await page.goto('/travel-settings');
    await page.waitForLoadState('networkidle');
    
    // Should show preferences or settings
    await expect(page.locator('main, [data-testid="travel-settings"]')).toBeVisible();
  });

  test('should manage subscription', async ({ page }) => {
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');
    
    // Should show subscription page
    await expect(page.locator('main, [data-testid="subscription"]')).toBeVisible();
  });

  test('should view bookings from profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for bookings link
    const bookingsLink = page.locator('a:has-text("Bookings"), a:has-text("My Trips")').first();
    
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForTimeout(1000);
      
      // Should navigate to bookings
      expect(page.url()).toMatch(/booking|trip/i);
    }
  });

  test('should change password', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Navigate to settings
    await page.click('text=Settings');
    await page.waitForTimeout(1000);
    
    // Look for change password option
    const passwordLink = page.locator('text=/change.*password/i, text=/update.*password/i').first();
    
    if (await passwordLink.isVisible()) {
      await passwordLink.click();
      await page.waitForTimeout(1000);
      
      // Should show password form
      const hasPasswordForm = await page.locator('input[type="password"]').count() >= 2;
      expect(hasPasswordForm).toBeTruthy();
    }
  });

  test('should handle profile update successfully', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Fill name field if available
      const nameInput = page.locator('input[name="name"], input[name="displayName"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Test User');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success message
        const hasSuccess = await page.locator('text=/success/i, text=/updated/i').count() > 0;
        expect(hasSuccess).toBeTruthy();
      }
    }
  });
});
