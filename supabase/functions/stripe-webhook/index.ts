import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

// Type aliases for better type safety with metadata
type PaymentIntentWithMetadata = Stripe.PaymentIntent & {
  metadata: {
    booking_id?: string;
    milestone_id?: string;
    user_id?: string;
    booking_type?: string;
  };
};

type SubscriptionWithMetadata = Stripe.Subscription & {
  metadata: {
    user_id?: string;
    tier?: string;
  };
};

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

const createLogger = (requestId: string): Logger => {
  const log = (level: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId,
      message,
      ...(data && { data }),
    };
    console.log(JSON.stringify(logEntry));
  };

  return {
    info: (message: string, data?: any) => log("INFO", message, data),
    warn: (message: string, data?: any) => log("WARN", message, data),
    error: (message: string, data?: any) => log("ERROR", message, data),
  };
};

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

/**
 * Atomically claim a webhook event for processing. Returns true if THIS
 * invocation won the claim (event is new); false if a concurrent retry
 * has already claimed it. Relies on the unique constraint on
 * webhook_events.event_id.
 */
async function claimEvent(
  eventId: string,
  eventType: string,
  payload: any,
  logger: Logger
): Promise<boolean> {
  const { error } = await supabaseClient.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    event_source: "stripe",
    payload,
    processing_status: "processing",
    processed_at: new Date().toISOString(),
  });

  if (!error) return true;
  if (error.code === "23505") {
    logger.info("Duplicate event detected (already claimed)", { eventId });
    return false;
  }
  logger.error("Error claiming event", { error });
  throw error;
}

/**
 * Finalize a previously-claimed webhook event with success/error status
 * and processing duration.
 */
async function finalizeEvent(
  eventId: string,
  processingDuration: number,
  errorMessage?: string
): Promise<void> {
  await supabaseClient
    .from("webhook_events")
    .update({
      processing_status: errorMessage ? "failed" : "success",
      processing_duration_ms: processingDuration,
      error_message: errorMessage || null,
    })
    .eq("event_id", eventId);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter: 100 requests per minute per IP
 */
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = `webhook:${ip}`;
  const limit = 100;
  const windowMs = 60 * 1000; // 1 minute

  const entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    rateLimitStore.delete(key);
  }

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ============================================================================
// PAYMENT INTENT HANDLERS
// ============================================================================

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(
  paymentIntent: PaymentIntentWithMetadata,
  logger: Logger
): Promise<void> {
  const { metadata, amount, currency, id: paymentIntentId } = paymentIntent;
  const { booking_id, milestone_id, booking_type } = metadata;

  logger.info("Processing payment success", {
    paymentIntentId,
    bookingId: booking_id,
    milestoneId: milestone_id,
    amount,
    currency,
  });

  if (!booking_id) {
    logger.warn("No booking_id in payment metadata", { paymentIntentId });
    return;
  }

  try {
    // If milestone payment
    if (milestone_id) {
      await handleMilestonePayment(
        booking_id,
        milestone_id,
        paymentIntentId,
        amount,
        currency,
        logger
      );
    } else {
      // Full payment for booking
      await handleFullBookingPayment(
        booking_id,
        paymentIntentId,
        amount,
        currency,
        logger
      );
    }

    logger.info("Payment processed successfully", {
      bookingId: booking_id,
      paymentIntentId,
    });
  } catch (error: any) {
    logger.error("Error processing payment", {
      error: error.message,
      bookingId: booking_id,
    });
    throw error;
  }
}

/**
 * Handle milestone payment
 */
async function handleMilestonePayment(
  bookingId: string,
  milestoneId: string,
  paymentIntentId: string,
  amount: number,
  currency: string,
  logger: Logger
): Promise<void> {
  logger.info("Processing milestone payment", { bookingId, milestoneId });

  // Update milestone status
  const { error: milestoneError } = await supabaseClient
    .from("booking_milestones")
    .update({
      status: "funded",
      stripe_payment_intent_id: paymentIntentId,
      funded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (milestoneError) {
    logger.error("Failed to update milestone", { error: milestoneError });
    throw milestoneError;
  }

  // Update booking escrow amount
  const { data: booking, error: fetchError } = await supabaseClient
    .from("bookings")
    .select("escrow_held_cents")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    logger.error("Failed to fetch booking", { error: fetchError });
    throw fetchError;
  }

  const newEscrowAmount = (booking.escrow_held_cents || 0) + amount;

  const { error: bookingError } = await supabaseClient
    .from("bookings")
    .update({
      escrow_held_cents: newEscrowAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (bookingError) {
    logger.error("Failed to update booking escrow", { error: bookingError });
    throw bookingError;
  }

  // Create notification for agent/creator
  await createPaymentNotification(bookingId, milestoneId, amount, currency, logger);

  logger.info("Milestone payment processed", { milestoneId, amount });
}

/**
 * Handle full booking payment
 */
async function handleFullBookingPayment(
  bookingId: string,
  paymentIntentId: string,
  amount: number,
  currency: string,
  logger: Logger
): Promise<void> {
  logger.info("Processing full booking payment", { bookingId });

  const { error: updateError } = await supabaseClient
    .from("bookings")
    .update({
      payment_status: "captured",
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      status: "confirmed",
      payout_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    logger.error("Failed to update booking", { error: updateError });
    throw updateError;
  }

  // Fetch booking details for notifications
  const { data: booking, error: fetchError } = await supabaseClient
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      traveler_id,
      agent_id,
      creator_id,
      brand_id,
      total_price_cents,
      currency,
      destination,
      start_date,
      end_date
    `
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    logger.error("Failed to fetch booking details", { error: fetchError });
    throw fetchError;
  }

  // Create notifications for all parties
  const notifications = [];

  // Notify traveler
  if (booking.traveler_id) {
    notifications.push({
      user_id: booking.traveler_id,
      type: "payment_received",
      title: "Payment Confirmed",
      message: `Your payment for ${booking.destination} has been confirmed.`,
      entity_type: "booking",
      entity_id: bookingId,
      action_url: `/bookings/${bookingId}`,
      action_label: "View Booking",
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  // Notify agent
  if (booking.agent_id) {
    notifications.push({
      user_id: booking.agent_id,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment confirmed for booking ${booking.booking_number}`,
      entity_type: "booking",
      entity_id: bookingId,
      action_url: `/agent/bookings/${bookingId}`,
      action_label: "View Booking",
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  // Notify creator
  if (booking.creator_id) {
    notifications.push({
      user_id: booking.creator_id,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment confirmed for booking ${booking.booking_number}`,
      entity_type: "booking",
      entity_id: bookingId,
      action_url: `/creator/bookings/${bookingId}`,
      action_label: "View Booking",
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  if (notifications.length > 0) {
    await supabaseClient.from("notifications").insert(notifications);
  }

  logger.info("Full booking payment processed", { bookingId });
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(
  paymentIntent: PaymentIntentWithMetadata,
  logger: Logger
): Promise<void> {
  const { metadata, id: paymentIntentId, last_payment_error } = paymentIntent;
  const { booking_id, milestone_id } = metadata;

  logger.warn("Payment failed", {
    paymentIntentId,
    bookingId: booking_id,
    error: last_payment_error?.message,
  });

  if (!booking_id) {
    logger.warn("No booking_id in failed payment metadata", { paymentIntentId });
    return;
  }

  // Update booking status
  const { error: updateError } = await supabaseClient
    .from("bookings")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking_id);

  if (updateError) {
    logger.error("Failed to update booking after payment failure", {
      error: updateError,
    });
  }

  // Notify traveler of failed payment
  const { data: booking } = await supabaseClient
    .from("bookings")
    .select("traveler_id, booking_number")
    .eq("id", booking_id)
    .maybeSingle();

  if (booking?.traveler_id) {
    await supabaseClient.from("notifications").insert({
      user_id: booking.traveler_id,
      type: "payment_received",
      title: "Payment Failed",
      message: `Payment for booking ${booking.booking_number} failed. Please update your payment method.`,
      entity_type: "booking",
      entity_id: booking_id,
      action_url: `/bookings/${booking_id}/payment`,
      action_label: "Retry Payment",
      priority: "urgent",
      created_at: new Date().toISOString(),
    });
  }

  logger.info("Payment failure processed", { bookingId: booking_id });
}

/**
 * Create payment notification
 */
async function createPaymentNotification(
  bookingId: string,
  milestoneId: string,
  amount: number,
  currency: string,
  logger: Logger
): Promise<void> {
  // Fetch booking and milestone details
  const { data: booking } = await supabaseClient
    .from("bookings")
    .select("agent_id, creator_id")
    .eq("id", bookingId)
    .maybeSingle();

  const { data: milestone } = await supabaseClient
    .from("booking_milestones")
    .select("title")
    .eq("id", milestoneId)
    .maybeSingle();

  if (!booking) return;

  const notifications = [];
  const amountFormatted = (amount / 100).toFixed(2);
  const message = `Milestone payment received: ${milestone?.title || "Payment"} - ${currency.toUpperCase()} ${amountFormatted}`;

  if (booking.agent_id) {
    notifications.push({
      user_id: booking.agent_id,
      type: "milestone_funded",
      title: "Milestone Funded",
      message,
      entity_type: "milestone",
      entity_id: milestoneId,
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  if (booking.creator_id) {
    notifications.push({
      user_id: booking.creator_id,
      type: "milestone_funded",
      title: "Milestone Funded",
      message,
      entity_type: "milestone",
      entity_id: milestoneId,
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  if (notifications.length > 0) {
    await supabaseClient.from("notifications").insert(notifications);
  }
}

// ============================================================================
// SUBSCRIPTION HANDLERS
// ============================================================================

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(
  subscription: SubscriptionWithMetadata,
  logger: Logger
): Promise<void> {
  const { metadata, id, customer, status, current_period_start, current_period_end, cancel_at_period_end, items } = subscription;
  const { user_id, tier } = metadata;

  logger.info("Processing subscription update", {
    subscriptionId: id,
    userId: user_id,
    status,
  });

  if (!user_id) {
    logger.warn("No user_id in subscription metadata", { subscriptionId: id });
    return;
  }

  // Get price and product info
  const subscriptionItem = items.data[0];
  const priceId = subscriptionItem?.price.id;
  const productId = subscriptionItem?.price.product as string;

  // Upsert subscription record
  const { error: upsertError } = await supabaseClient
    .from("user_subscriptions")
    .upsert(
      {
        user_id,
        tier: tier || "premium",
        stripe_customer_id: customer as string,
        stripe_subscription_id: id,
        stripe_price_id: priceId,
        stripe_product_id: productId,
        status,
        cancel_at_period_end,
        current_period_start: new Date(current_period_start * 1000).toISOString(),
        current_period_end: new Date(current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (upsertError) {
    logger.error("Failed to upsert subscription", { error: upsertError });
    throw upsertError;
  }

  // Send notification
  let notificationTitle = "Subscription Updated";
  let notificationMessage = "Your subscription has been updated.";

  if (status === "active") {
    notificationTitle = "Subscription Active";
    notificationMessage = `Your ${tier || "premium"} subscription is now active!`;
  } else if (status === "canceled") {
    notificationTitle = "Subscription Canceled";
    notificationMessage = "Your subscription has been canceled.";
  } else if (status === "past_due") {
    notificationTitle = "Payment Past Due";
    notificationMessage = "Your subscription payment is past due. Please update your payment method.";
  }

  await supabaseClient.from("notifications").insert({
    user_id,
    type: "system_announcement",
    title: notificationTitle,
    message: notificationMessage,
    priority: status === "past_due" ? "urgent" : "normal",
    created_at: new Date().toISOString(),
  });

  logger.info("Subscription updated successfully", { subscriptionId: id, userId: user_id });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  subscription: SubscriptionWithMetadata,
  logger: Logger
): Promise<void> {
  const { metadata, id } = subscription;
  const { user_id } = metadata;

  logger.info("Processing subscription deletion", {
    subscriptionId: id,
    userId: user_id,
  });

  if (!user_id) {
    logger.warn("No user_id in subscription metadata", { subscriptionId: id });
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("user_subscriptions")
    .update({
      status: "canceled",
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (updateError) {
    logger.error("Failed to update subscription status", { error: updateError });
    throw updateError;
  }

  // Downgrade user to free tier
  const { error: tierError } = await supabaseClient
    .from("user_subscriptions")
    .update({
      tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (tierError) {
    logger.error("Failed to downgrade user tier", { error: tierError });
  }

  // Send notification
  await supabaseClient.from("notifications").insert({
    user_id,
    type: "system_announcement",
    title: "Subscription Ended",
    message: "Your subscription has ended. You've been moved to the free tier.",
    priority: "normal",
    created_at: new Date().toISOString(),
  });

  logger.info("Subscription deletion processed", { subscriptionId: id, userId: user_id });
}

// ============================================================================
// STRIPE CONNECT PAYOUT HANDLERS
// ============================================================================

/**
 * Handle payout paid (Stripe Connect)
 */
async function handlePayoutPaid(payout: Stripe.Payout, logger: Logger): Promise<void> {
  const { id, amount, currency, destination, arrival_date } = payout;

  logger.info("Processing payout paid", {
    payoutId: id,
    amount,
    currency,
    destination,
  });

  // Find bookings associated with this payout
  // This would require tracking payout IDs in your bookings table
  // For now, we'll log the event
  
  logger.info("Payout processed successfully", { payoutId: id, amount });

  // TODO: Implement payout tracking logic
  // Update booking payout status to "paid"
  // Create notifications for agents/creators
}

/**
 * Handle payout failed (Stripe Connect)
 */
async function handlePayoutFailed(payout: Stripe.Payout, logger: Logger): Promise<void> {
  const { id, amount, currency, failure_message } = payout;

  logger.error("Payout failed", {
    payoutId: id,
    amount,
    currency,
    failureMessage: failure_message,
  });

  // TODO: Implement failure handling
  // Update booking payout status to "failed"
  // Notify admin team
  // Create alert for agent/creator
}

// ============================================================================
// CHARGE DISPUTE HANDLERS
// ============================================================================

/**
 * Handle charge dispute created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute, logger: Logger): Promise<void> {
  const { id, charge, amount, currency, reason, status } = dispute;

  logger.warn("Dispute created", {
    disputeId: id,
    chargeId: charge,
    amount,
    reason,
    status,
  });

  // Find booking associated with charge
  const { data: booking } = await supabaseClient
    .from("bookings")
    .select("id, booking_number, traveler_id, agent_id, creator_id")
    .eq("stripe_payment_intent_id", charge)
    .maybeSingle();

  if (!booking) {
    logger.warn("No booking found for disputed charge", { chargeId: charge });
    return;
  }

  // Update booking status
  await supabaseClient
    .from("bookings")
    .update({
      is_disputed: true,
      dispute_reason: reason,
      dispute_opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  // Notify all parties
  const notifications = [];

  if (booking.agent_id) {
    notifications.push({
      user_id: booking.agent_id,
      type: "system_announcement",
      title: "⚠️ Payment Dispute",
      message: `A payment dispute has been opened for booking ${booking.booking_number}. Please provide evidence.`,
      entity_type: "booking",
      entity_id: booking.id,
      priority: "urgent",
      created_at: new Date().toISOString(),
    });
  }

  if (booking.creator_id) {
    notifications.push({
      user_id: booking.creator_id,
      type: "system_announcement",
      title: "⚠️ Payment Dispute",
      message: `A payment dispute has been opened for booking ${booking.booking_number}.`,
      entity_type: "booking",
      entity_id: booking.id,
      priority: "urgent",
      created_at: new Date().toISOString(),
    });
  }

  if (notifications.length > 0) {
    await supabaseClient.from("notifications").insert(notifications);
  }

  logger.info("Dispute created and processed", { disputeId: id, bookingId: booking.id });
}

/**
 * Handle charge dispute closed
 */
async function handleDisputeClosed(dispute: Stripe.Dispute, logger: Logger): Promise<void> {
  const { id, charge, status } = dispute;

  logger.info("Dispute closed", {
    disputeId: id,
    chargeId: charge,
    status,
  });

  // Find booking
  const { data: booking } = await supabaseClient
    .from("bookings")
    .select("id, booking_number, agent_id, creator_id")
    .eq("stripe_payment_intent_id", charge)
    .maybeSingle();

  if (!booking) {
    logger.warn("No booking found for closed dispute", { chargeId: charge });
    return;
  }

  // Update booking
  await supabaseClient
    .from("bookings")
    .update({
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolution: status === "won" ? "merchant_won" : "customer_won",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  // Notify parties
  const resultMessage =
    status === "won"
      ? "The dispute was resolved in your favor."
      : "The dispute was resolved in the customer's favor.";

  const notifications = [];

  if (booking.agent_id) {
    notifications.push({
      user_id: booking.agent_id,
      type: "system_announcement",
      title: "Dispute Resolved",
      message: `Dispute for booking ${booking.booking_number} has been resolved. ${resultMessage}`,
      entity_type: "booking",
      entity_id: booking.id,
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  if (booking.creator_id) {
    notifications.push({
      user_id: booking.creator_id,
      type: "system_announcement",
      title: "Dispute Resolved",
      message: `Dispute for booking ${booking.booking_number} has been resolved. ${resultMessage}`,
      entity_type: "booking",
      entity_id: booking.id,
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  if (notifications.length > 0) {
    await supabaseClient.from("notifications").insert(notifications);
  }

  logger.info("Dispute closed and processed", { disputeId: id, bookingId: booking.id });
}

// ============================================================================
// REFUND HANDLERS
// ============================================================================

/**
 * Handle refund created
 */
async function handleRefundCreated(refund: Stripe.Refund, logger: Logger): Promise<void> {
  const { id, charge, amount, currency, status, reason } = refund;

  logger.info("Processing refund", {
    refundId: id,
    chargeId: charge,
    amount,
    status,
    reason,
  });

  // Find booking
  const { data: booking } = await supabaseClient
    .from("bookings")
    .select("id, booking_number, traveler_id, agent_id, total_price_cents, status")
    .eq("stripe_payment_intent_id", charge)
    .maybeSingle();

  if (!booking) {
    logger.warn("No booking found for refund", { chargeId: charge });
    return;
  }

  // Update booking refund status
  const isFullRefund = amount >= booking.total_price_cents;
  
  await supabaseClient
    .from("bookings")
    .update({
      refund_amount_cents: amount,
      refunded_at: new Date().toISOString(),
      payment_status: isFullRefund ? "refunded" : "partially_refunded",
      status: isFullRefund ? "cancelled" : booking.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  // Notify traveler
  if (booking.traveler_id) {
    await supabaseClient.from("notifications").insert({
      user_id: booking.traveler_id,
      type: "payment_received",
      title: isFullRefund ? "Refund Processed" : "Partial Refund Processed",
      message: `A ${isFullRefund ? "full" : "partial"} refund of ${currency.toUpperCase()} ${(amount / 100).toFixed(2)} has been processed for booking ${booking.booking_number}.`,
      entity_type: "booking",
      entity_id: booking.id,
      priority: "high",
      created_at: new Date().toISOString(),
    });
  }

  logger.info("Refund processed", { refundId: id, bookingId: booking.id });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const logger = createLogger(requestId);
  const startTime = Date.now();

  logger.info("Webhook request received", {
    method: req.method,
    url: req.url,
  });

  // Only accept POST requests
  if (req.method !== "POST") {
    logger.warn("Invalid method", { method: req.method });
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { ip: clientIp });
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          requestId,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Get signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logger.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      logger.info("Webhook signature verified", { eventType: event.type });
    } catch (err: any) {
      logger.error("Webhook signature verification failed", {
        error: err.message,
      });
      return new Response(
        JSON.stringify({
          error: "Invalid signature",
          details: err.message,
          requestId,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Atomically claim the event for processing (idempotency).
    // If a concurrent retry has already claimed it, return immediately.
    const claimed = await claimEvent(
      event.id,
      event.type,
      event.data.object,
      logger
    );
    if (!claimed) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true, requestId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process the event
    let errorMessage: string | undefined;

    try {
      switch (event.type) {
        // Payment Intents
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object as PaymentIntentWithMetadata, logger);
          break;

        case "payment_intent.payment_failed":
          await handlePaymentFailed(event.data.object as PaymentIntentWithMetadata, logger);
          break;

        // Subscriptions
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object as SubscriptionWithMetadata, logger);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as SubscriptionWithMetadata, logger);
          break;

        // Payouts (Stripe Connect)
        case "payout.paid":
          await handlePayoutPaid(event.data.object as Stripe.Payout, logger);
          break;

        case "payout.failed":
          await handlePayoutFailed(event.data.object as Stripe.Payout, logger);
          break;

        // Disputes
        case "charge.dispute.created":
          await handleDisputeCreated(event.data.object as Stripe.Dispute, logger);
          break;

        case "charge.dispute.closed":
          await handleDisputeClosed(event.data.object as Stripe.Dispute, logger);
          break;

        // Refunds
        case "charge.refund.updated":
          await handleRefundCreated(event.data.object as Stripe.Refund, logger);
          break;

        default:
          logger.info("Unhandled event type", { eventType: event.type });
      }
    } catch (processingError: any) {
      errorMessage = processingError.message;
      logger.error("Error processing webhook event", {
        error: processingError.message,
        stack: processingError.stack,
      });
      throw processingError;
    } finally {
      // Finalize the previously-claimed event row with the outcome.
      const processingDuration = Date.now() - startTime;
      await finalizeEvent(event.id, processingDuration, errorMessage);
    }

    const processingDuration = Date.now() - startTime;
    logger.info("Webhook processed successfully", {
      processingDuration,
      eventType: event.type,
    });

    return new Response(
      JSON.stringify({
        received: true,
        requestId,
        processingDuration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const processingDuration = Date.now() - startTime;
    logger.error("Fatal error processing webhook", {
      error: error.message,
      stack: error.stack,
      processingDuration,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        requestId,
        processingDuration,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
