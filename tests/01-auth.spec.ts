import { test, expect } from '@playwright/test';
import { signUp, login, logout, TEST_USER } from './helpers/auth.helper';

/**
 * Test Suite 1: Authentication Flows
 * Covers signup, login, logout, and session persistence
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button:has-text("Sign in"), button:has-text("Log in")')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in"), button:has-text("Log in")');
    
    // Should show error message
    await expect(page.locator('text=/invalid.*email/i, text=/enter.*valid.*email/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Sign in"), button:has-text("Log in")');
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials/i, text=/incorrect.*password/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully sign up new user', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@goldsainte.ai`;
    
    await signUp(page, uniqueEmail, TEST_USER.password);
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Should show user menu or profile indicator
    await expect(page.locator('[data-testid="user-menu"], [aria-label="User menu"]')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login existing user', async ({ page }) => {
    await login(page);
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    
    // Should show authenticated UI elements
    await expect(page.locator('[data-testid="user-menu"], [aria-label="User menu"]')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully logout', async ({ page }) => {
    // First login
    await login(page);
    await expect(page).toHaveURL('/');
    
    // Then logout
    await logout(page);
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should persist session after page reload', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Session should persist
    await expect(page.locator('[data-testid="user-menu"], [aria-label="User menu"]')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });
});
