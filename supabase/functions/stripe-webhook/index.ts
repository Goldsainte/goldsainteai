import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { verifyStripeWebhook, validateWebhookEvent, checkWebhookRateLimit } from "../_shared/webhookSecurity.ts";
import { logger, generateTraceId } from "../_shared/structuredLogger.ts";

// Map your paid product IDs to tiers used in app:
const PRODUCT_TIER_MAP: Record<string, string> = { 
  'prod_TNOppvdXPriM3E': 'premium', 
  'prod_TNOpkzmfNXljRz': 'enterprise' 
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const requestId = generateTraceId();
  logger.setContext({ functionName: 'stripe-webhook', requestId });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logger.error("Missing stripe-signature header or webhook secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature with enhanced security
    const verification = await verifyStripeWebhook(body, signature, webhookSecret);
    
    if (!verification.valid) {
      logger.error("Webhook verification failed", new Error(verification.error || "Unknown error"));
      return new Response(`Webhook Error: ${verification.error}`, { status: 400 });
    }
    
    const event = verification.event!;
    logger.info("Webhook received", { eventType: event.type, eventId: event.id });
    
    // Additional security validation
    const validation = validateWebhookEvent(event);
    if (!validation.valid) {
      logger.warn("Webhook event validation failed", { error: validation.error });
      return new Response(`Validation Error: ${validation.error}`, { status: 400 });
    }
    
    // Rate limit check per event type
    const rateLimit = checkWebhookRateLimit(event.type, 100); // 100 events per minute per type
    if (!rateLimit.allowed) {
      logger.warn("Webhook rate limit exceeded", { 
        eventType: event.type,
        retryAfter: rateLimit.retryAfter 
      });
      return new Response("Rate limit exceeded", { 
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter || 60) }
      });
    }

    // IDEMPOTENCY CHECK
    const { error: insertError } = await supabaseClient
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event.data.object,
        processed_at: new Date().toISOString()
      });

    if (insertError?.code === '23505') {
      // Duplicate event (unique constraint violation)
      logger.info("Duplicate webhook ignored", { eventId: event.id });
      return new Response(JSON.stringify({ 
        received: true, 
        duplicate: true,
        requestId 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (insertError) {
      throw insertError; // Other database errors
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        await handleStandardCheckout(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.created":
        await upsertStandardSubscription(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        await handleStandardSubscriptionDeleted(event.data.object);
        break;
      
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        logger.info("Unhandled webhook event type", { eventType: event.type });
    }

    logger.info("Webhook processed successfully", { 
      eventType: event.type,
      eventId: event.id 
    });

    return new Response(JSON.stringify({ received: true, requestId }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.error("Webhook processing failed", error, { 
      eventType: (error as any)?.event?.type 
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId 
      }), 
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  logger.info("Processing checkout.session.completed", { sessionId: session.id });
  
  const userId = session.metadata?.user_id;
  const subscriptionType = session.metadata?.subscription_type;
  
  if (!userId || subscriptionType !== 'verification') {
    logger.info("Not a verification subscription, skipping");
    return;
  }

  try {
    // Grant verified badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId);

    if (profileError) {
      logger.error("Error updating profile", profileError);
      throw profileError;
    }

    // Store subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    const { error: subError } = await supabaseClient
      .from('verification_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      logger.error("Error storing subscription", subError);
      throw subError;
    }

    logger.info("Granted verification badge", { userId });
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_badge_granted',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
        }
      });
  } catch (error) {
    logger.error("Error in handleCheckoutSessionCompleted", error as Error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  logger.info("Processing customer.subscription.updated", { subscriptionId: subscription.id });
  
  // Only process verification subscriptions
  if (subscription.metadata?.subscription_type !== 'verification') {
    logger.info("Not a verification subscription, skipping");
    return;
  }

  try {
    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !subData) {
      logger.warn("Subscription not found in database", { subscriptionId: subscription.id });
      return;
    }

    const userId = subData.user_id;

    // Update subscription status
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      logger.error("Error updating subscription", updateError);
      throw updateError;
    }

    // Update verification badge based on status
    const isActive = subscription.status === 'active';
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: isActive })
      .eq('id', userId);

    if (profileError) {
      logger.error("Error updating profile", profileError);
      throw profileError;
    }

    logger.info("Updated verification status", { userId, isActive });
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: isActive ? 'verification_badge_renewed' : 'verification_badge_suspended',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
        }
      });
  } catch (error) {
    logger.error("Error in handleSubscriptionUpdated", error as Error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  logger.info("Processing customer.subscription.deleted", { subscriptionId: subscription.id });
  
  if (subscription.metadata?.subscription_type !== 'verification') {
    logger.info("Not a verification subscription, skipping");
    return;
  }

  try {
    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !subData) {
      logger.warn("Subscription not found in database", { subscriptionId: subscription.id });
      return;
    }

    const userId = subData.user_id;

    // Revoke verification badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', userId);

    if (profileError) {
      logger.error("Error updating profile", profileError);
      throw profileError;
    }

    // Update subscription status to canceled
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      logger.error("Error updating subscription", updateError);
      throw updateError;
    }

    logger.info("Revoked verification badge", { userId });
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_badge_revoked',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscription.id,
          reason: 'subscription_deleted',
        }
      });
  } catch (error) {
    logger.error("Error in handleSubscriptionDeleted", error as Error);
    throw error;
  }
}

// Persist standard (non-verification) subscriptions to user_subscriptions
async function handleStandardCheckout(session: any) {
  try {
    // verification flow already handled above
    if (session.metadata?.subscription_type === 'verification') return;
    if (session.mode !== 'subscription') return;
    const subscriptionId = session.subscription;
    const customerId = session.customer as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const productId = subscription.items.data[0]?.price?.product as string | undefined;
    if (!productId) return;
    const tier = PRODUCT_TIER_MAP[productId] || 'free';
    const userId = session.metadata?.user_id;
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const customer = typeof customerId === 'string' ? await stripe.customers.retrieve(customerId) : null;
      const email = (customer as any)?.email;
      if (email) {
        const { data } = await supabaseClient.from('profiles').select('id').eq('email', email).single();
        resolvedUserId = data?.id;
      }
    }
    if (!resolvedUserId) return;
    await supabaseClient.from('user_subscriptions').upsert({ user_id: resolvedUserId, tier });
  } catch (e) {
    logger.error('handleStandardCheckout failed', e as Error);
  }
}

async function upsertStandardSubscription(subscription: any) {
  try {
    if (subscription.metadata?.subscription_type === 'verification') return;
    const customerId = subscription.customer as string;
    const productId = subscription.items?.data?.[0]?.price?.product as string | undefined;
    if (!productId) return;
    const tier = PRODUCT_TIER_MAP[productId] || 'free';
    const customer = await stripe.customers.retrieve(customerId);
    const email = (customer as any)?.email;
    if (!email) return;
    const { data } = await supabaseClient.from('profiles').select('id').eq('email', email).single();
    const userId = data?.id;
    if (!userId) return;
    await supabaseClient.from('user_subscriptions').upsert({ user_id: userId, tier });
  } catch (e) {
    logger.error('upsertStandardSubscription failed', e as Error);
  }
}

async function handleStandardSubscriptionDeleted(subscription: any) {
  try {
    if (subscription.metadata?.subscription_type === 'verification') return;
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    const email = (customer as any)?.email;
    if (!email) return;
    const { data } = await supabaseClient.from('profiles').select('id').eq('email', email).single();
    const userId = data?.id;
    if (!userId) return;
    await supabaseClient.from('user_subscriptions').upsert({ user_id: userId, tier: 'free' });
  } catch (e) {
    logger.error('handleStandardSubscriptionDeleted failed', e as Error);
  }
}

async function handlePaymentFailed(invoice: any) {
  logger.info("Processing invoice.payment_failed", { invoiceId: invoice.id });
  
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    
    if (subscription.metadata?.subscription_type !== 'verification') {
      logger.info("Not a verification subscription, skipping");
      return;
    }

    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError || !subData) {
      logger.warn("Subscription not found in database", { subscriptionId });
      return;
    }

    const userId = subData.user_id;

    // Update subscription status to past_due
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      logger.error("Error updating subscription", updateError);
      throw updateError;
    }

    logger.warn("Payment failed, subscription past_due", { userId });
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_payment_failed',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscriptionId,
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
        }
      });

    // Note: Badge remains active during grace period (Stripe handles retry logic)
    // Badge will be revoked when subscription.deleted event fires if payment never succeeds
  } catch (error) {
    logger.error("Error in handlePaymentFailed", error as Error);
    throw error;
  }
}
