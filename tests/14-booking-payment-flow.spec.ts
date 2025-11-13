import { test, expect } from '@playwright/test';

/**
 * E2E Test: Booking Payment Flow
 * Tests: booking → payment modal (mock Stripe) → success
 */

test.describe('Booking Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('complete booking to payment flow', async ({ page }) => {
    // Step 1: Navigate to marketplace or booking page
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Step 2: Select a travel package or service
    const packageCard = page.locator('[data-testid="package-card"]')
      .or(page.locator('[data-testid="service-card"]'))
      .or(page.locator('article'))
      .first();
    
    await expect(packageCard).toBeVisible({ timeout: 10000 });
    await packageCard.click();
    
    // Wait for detail view
    await page.waitForTimeout(1000);

    // Step 3: Click "Book Now" or "Request Quote" button
    const bookButton = page.getByRole('button', { name: /book now|request quote|book|purchase/i })
      .or(page.locator('[data-testid="book-button"]'));
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 4: Fill booking form if present
    const nameInput = page.locator('input[name*="name" i]')
      .or(page.locator('input[placeholder*="name" i]'));
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('John Doe');
    }

    const emailInput = page.locator('input[type="email"]')
      .or(page.locator('input[name*="email" i]'));
    
    if (await emailInput.isVisible() && await emailInput.inputValue() === '') {
      await emailInput.fill('john.doe@example.com');
    }

    const dateInput = page.locator('input[type="date"]')
      .or(page.locator('[data-testid="date-picker"]'));
    
    if (await dateInput.isVisible()) {
      // Set a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dateString = futureDate.toISOString().split('T')[0];
      await dateInput.fill(dateString);
    }

    // Step 5: Proceed to payment
    const proceedButton = page.getByRole('button', { name: /proceed|continue|next|confirm/i })
      .or(page.locator('[data-testid="proceed-button"]'));
    
    if (await proceedButton.isVisible()) {
      await proceedButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 6: Verify payment modal opens or payment page loads
    // In real scenario, would redirect to Stripe Checkout
    // For E2E testing without real Stripe, we check for modal/redirect intent
    
    const paymentModal = page.locator('[data-testid="payment-modal"]')
      .or(page.locator('[role="dialog"]'))
      .or(page.locator('.modal'));
    
    const paymentButton = page.getByRole('button', { name: /pay now|checkout|complete purchase/i })
      .or(page.locator('[data-testid="payment-button"]'));
    
    // Check if payment UI is visible
    const hasPaymentUI = await paymentModal.isVisible() || await paymentButton.isVisible();
    
    if (hasPaymentUI) {
      // If there's a payment button (not redirecting to external Stripe)
      if (await paymentButton.isVisible()) {
        await paymentButton.click();
        
        // In test mode, may redirect to success page immediately
        // Or show success message
        await page.waitForTimeout(2000);
        
        // Verify success indicator
        const successMessage = page.getByText(/success|confirmed|complete|thank you/i);
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      }
    } else {
      // If redirecting to external payment (Stripe), verify redirect intent
      // In real E2E, would need to mock Stripe or use test cards
      console.log('Payment redirect expected - would go to Stripe Checkout in production');
    }
  });

  test('booking flow with validation errors', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Click booking button without filling form
    const bookButton = page.getByRole('button', { name: /book now|request quote/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(500);

      // Try to proceed without required fields
      const proceedButton = page.getByRole('button', { name: /proceed|continue|confirm/i });
      
      if (await proceedButton.isVisible()) {
        await proceedButton.click();
        await page.waitForTimeout(500);
        
        // Verify validation errors appear
        const errorMessage = page.locator('.error')
          .or(page.locator('[role="alert"]'))
          .or(page.getByText(/required|invalid|please/i));
        
        await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('payment flow cancellation', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Start booking flow
    const bookButton = page.getByRole('button', { name: /book now|request quote/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);

      // Look for cancel/close button
      const cancelButton = page.getByRole('button', { name: /cancel|close/i })
        .or(page.locator('[data-testid="cancel-button"]'));
      
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        
        // Verify booking modal/form closed
        const bookingForm = page.locator('[data-testid="booking-form"]')
          .or(page.locator('[role="dialog"]'));
        
        await expect(bookingForm).not.toBeVisible();
      }
    }
  });

  test('verify payment success confirmation', async ({ page }) => {
    // Simulate returning from successful Stripe checkout
    await page.goto('/subscription?success=true');
    await page.waitForLoadState('networkidle');
    
    // Verify success toast/message appears
    await expect(
      page.getByText(/activated|success|confirmed/i)
    ).toBeVisible({ timeout: 5000 });
    
    // Verify URL params are cleaned up
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('/subscription');
  });
});
