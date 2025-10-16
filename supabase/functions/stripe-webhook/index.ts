import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    console.error("Missing stripe-signature header or webhook secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Processing checkout.session.completed", session.id);
  
  const userId = session.metadata?.user_id;
  const subscriptionType = session.metadata?.subscription_type;
  
  if (!userId || subscriptionType !== 'verification') {
    console.log("Not a verification subscription, skipping");
    return;
  }

  try {
    // Grant verified badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
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
      console.error("Error storing subscription:", subError);
      throw subError;
    }

    console.log(`✅ Granted verification badge to user ${userId}`);
    
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
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("Processing customer.subscription.updated", subscription.id);
  
  // Only process verification subscriptions
  if (subscription.metadata?.subscription_type !== 'verification') {
    console.log("Not a verification subscription, skipping");
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
      console.error("Subscription not found in database:", subscription.id);
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
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    // Update verification badge based on status
    const isActive = subscription.status === 'active';
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: isActive })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }

    console.log(`✅ Updated verification status for user ${userId}: ${isActive}`);
    
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
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Processing customer.subscription.deleted", subscription.id);
  
  if (subscription.metadata?.subscription_type !== 'verification') {
    console.log("Not a verification subscription, skipping");
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
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    const userId = subData.user_id;

    // Revoke verification badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
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
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log(`✅ Revoked verification badge from user ${userId}`);
    
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
    console.error("Error in handleSubscriptionDeleted:", error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log("Processing invoice.payment_failed", invoice.id);
  
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    
    if (subscription.metadata?.subscription_type !== 'verification') {
      console.log("Not a verification subscription, skipping");
      return;
    }

    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError || !subData) {
      console.error("Subscription not found in database:", subscriptionId);
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
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log(`⚠️ Payment failed for user ${userId}, subscription marked as past_due`);
    
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
    console.error("Error in handlePaymentFailed:", error);
    throw error;
  }
}
