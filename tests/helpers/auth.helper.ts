import { Page } from '@playwright/test';

/**
 * Authentication helper functions for E2E tests
 */

export const TEST_USER = {
  email: 'test@goldsainte.ai',
  password: 'TestPassword123!',
  name: 'Test User'
};

export async function signUp(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  
  // Look for signup form
  await page.click('text=Sign up');
  
  // Fill signup form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button:has-text("Sign up")');
  
  // Wait for redirect or success
  await page.waitForURL('/', { timeout: 10000 });
}

export async function login(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button:has-text("Sign in"), button:has-text("Log in")');
  
  // Wait for successful login
  await page.waitForURL('/', { timeout: 10000 });
}

export async function logout(page: Page) {
  // Click user menu or logout button
  await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
  await page.click('text=Logout, text=Sign out');
  
  // Wait for redirect to auth page
  await page.waitForURL('/auth', { timeout: 5000 });
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for user menu or profile indicator
  const userMenu = await page.locator('[data-testid="user-menu"], [aria-label="User menu"]').count();
  return userMenu > 0;
}
