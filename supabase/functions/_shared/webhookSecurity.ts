import Stripe from "https://esm.sh/stripe@18.5.0";
import { logger } from "./structuredLogger.ts";

/**
 * Verify Stripe webhook signature with enhanced security
 */
export async function verifyStripeWebhook(
  body: string,
  signature: string,
  secret: string
): Promise<{ valid: boolean; event?: Stripe.Event; error?: string }> {
  try {
    if (!signature) {
      return { valid: false, error: "Missing stripe-signature header" };
    }

    if (!secret) {
      return { valid: false, error: "Webhook secret not configured" };
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Verify signature and construct event
    // Deno SubtleCrypto is async-only — must use constructEventAsync.
    const event = await stripe.webhooks.constructEventAsync(body, signature, secret);

    logger.info("Webhook signature verified", {
      eventType: event.type,
      eventId: event.id,
    });

    return { valid: true, event };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log different types of verification failures
    if (errorMessage.includes("timestamp")) {
      logger.warn("Webhook timestamp verification failed - possible replay attack", {
        error: errorMessage,
      });
    } else if (errorMessage.includes("signature")) {
      logger.error("Webhook signature mismatch", error as Error);
    } else {
      logger.error("Webhook verification failed", error as Error);
    }

    return { valid: false, error: errorMessage };
  }
}

/**
 * Additional security checks for webhook events
 */
export function validateWebhookEvent(
  event: Stripe.Event
): { valid: boolean; error?: string } {
  // Check event age - reject events older than 5 minutes
  const eventAge = Date.now() - event.created * 1000;
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (eventAge > maxAge) {
    logger.warn("Webhook event too old - possible replay", {
      eventId: event.id,
      eventAge: eventAge / 1000,
    });
    return { valid: false, error: "Event too old" };
  }

  // Check if event is in test mode when in production
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";
  if (isProduction && event.livemode === false) {
    logger.warn("Test event received in production", {
      eventId: event.id,
      eventType: event.type,
    });
    return { valid: false, error: "Test event in production" };
  }

  return { valid: true };
}

/**
 * Rate limit webhook processing per event type
 */
const webhookRateLimits = new Map<string, number>();

export function checkWebhookRateLimit(
  eventType: string,
  maxPerMinute: number = 60
): { allowed: boolean; retryAfter?: number } {
  const key = `webhook_${eventType}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const lastTimestamp = webhookRateLimits.get(key) || 0;
  const timeSinceLastCall = now - lastTimestamp;

  if (timeSinceLastCall < windowMs / maxPerMinute) {
    const retryAfter = Math.ceil((windowMs / maxPerMinute - timeSinceLastCall) / 1000);
    logger.warn("Webhook rate limit exceeded", {
      eventType,
      retryAfter,
    });
    return { allowed: false, retryAfter };
  }

  webhookRateLimits.set(key, now);
  return { allowed: true };
}
