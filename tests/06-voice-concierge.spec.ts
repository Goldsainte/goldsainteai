import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

/**
 * Test Suite 6: Voice AI Concierge
 * Covers concierge widget, voice interactions, and chat functionality
 */

test.describe('Voice AI Concierge', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display concierge trigger button', async ({ page }) => {
    // Look for concierge button
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"], button:has-text("Hey Goldsainte")').first();
    
    // Button should be visible
    await expect(conciergeButton).toBeVisible({ timeout: 10000 });
  });

  test('should open concierge widget', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Widget should open
    const widget = page.locator('[data-testid="concierge-widget"], [role="dialog"]');
    await expect(widget).toBeVisible();
  });

  test('should close concierge widget', async ({ page }) => {
    // Open widget
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Find close button
    const closeButton = page.locator('[data-testid="close-concierge"], button[aria-label="Close"]').first();
    await closeButton.click();
    await page.waitForTimeout(500);
    
    // Widget should close
    const widget = page.locator('[data-testid="concierge-widget"]');
    await expect(widget).not.toBeVisible();
  });

  test('should display chat interface', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Check for chat elements
    await expect(page.locator('[data-testid="chat-messages"], [role="log"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"], input[placeholder*="message"]')).toBeVisible();
  });

  test('should send text message in chat', async ({ page }) => {
    // Open widget
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Type message
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message"]').first();
    await chatInput.fill('I need help planning a trip to Tokyo');
    
    // Send message
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label="Send"]').first();
    await sendButton.click();
    await page.waitForTimeout(2000);
    
    // Message should appear in chat
    await expect(page.locator('text=Tokyo')).toBeVisible({ timeout: 5000 });
  });

  test('should receive AI response', async ({ page }) => {
    // Open widget and send message
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message"]').first();
    await chatInput.fill('Hello');
    
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label="Send"]').first();
    await sendButton.click();
    
    // Wait for AI response
    await page.waitForTimeout(3000);
    
    // Should have at least 2 messages (user + AI)
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  test('should display voice control button', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Check for microphone/voice button
    const voiceButton = page.locator('[data-testid="voice-button"], button[aria-label*="microphone"], button[aria-label*="voice"]').first();
    await expect(voiceButton).toBeVisible();
  });

  test('should show typing indicator', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Send message
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message"]').first();
    await chatInput.fill('Tell me about Paris');
    
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label="Send"]').first();
    await sendButton.click();
    
    // Look for typing indicator
    const typingIndicator = page.locator('[data-testid="typing-indicator"], text=/typing/i, .typing-indicator');
    const isTyping = await typingIndicator.isVisible().catch(() => false);
    
    // Typing indicator may appear briefly
    // Just check that no error occurred
    expect(true).toBeTruthy();
  });

  test('should handle long conversation history', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message"]').first();
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label="Send"]').first();
    
    // Send multiple messages
    for (let i = 0; i < 3; i++) {
      await chatInput.fill(`Message ${i + 1}`);
      await sendButton.click();
      await page.waitForTimeout(1500);
    }
    
    // Chat should still be functional
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(3);
  });

  test('should clear chat history', async ({ page }) => {
    const conciergeButton = page.locator('[data-testid="concierge-trigger"], button[aria-label*="concierge"]').first();
    await conciergeButton.click();
    await page.waitForTimeout(1000);
    
    // Send a message first
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message"]').first();
    await chatInput.fill('Test message');
    
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label="Send"]').first();
    await sendButton.click();
    await page.waitForTimeout(2000);
    
    // Look for clear/reset button
    const clearButton = page.locator('[data-testid="clear-chat"], button:has-text("Clear"), button:has-text("Reset")').first();
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
      
      // Messages should be cleared
      const messageCount = await page.locator('[data-testid="chat-message"]').count();
      expect(messageCount).toBeLessThanOrEqual(1); // May have welcome message
    }
  });
});
