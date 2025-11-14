import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkAndRecordWebhook, updateWebhookStatus } from "../_shared/webhookIdempotency.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
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
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Processing webhook event: ${event.type}`);

    // Check idempotency
    const { shouldProcess, isNew } = await checkAndRecordWebhook(
      supabaseClient,
      event.id,
      event.type,
      event.data.object as Record<string, any>
    );

    if (!shouldProcess) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object);
          break;
        
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object);
          break;
        
        case "payment_intent.payment_failed":
          await handlePaymentFailed(event.data.object);
          break;
        
        case "charge.refunded":
          await handleChargeRefunded(event.data.object);
          break;
        
        case "transfer.created":
          await handleTransferCreated(event.data.object);
          break;
        
        case "payout.paid":
          await handlePayoutPaid(event.data.object);
          break;
        
        case "account.updated":
          await handleAccountUpdated(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      await updateWebhookStatus(supabaseClient, event.id, 'success');
    } catch (handlerError: unknown) {
      console.error('Handler error:', handlerError);
      const errorMessage = handlerError instanceof Error ? handlerError.message : 'Unknown error occurred';
      await updateWebhookStatus(supabaseClient, event.id, 'failed', errorMessage);
      throw handlerError;
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

async function handleCheckoutCompleted(session: any) {
  console.log("Processing checkout.session.completed", session.id);
  
  const metadata = session.metadata || {};
  
  // Handle different checkout types based on metadata
  if (metadata.type === 'package_booking') {
    await supabaseClient.from('package_bookings').insert({
      package_id: metadata.package_id,
      customer_id: metadata.customer_id,
      stripe_payment_intent_id: session.payment_intent,
      total_price: session.amount_total / 100,
      currency: session.currency,
      status: 'confirmed',
    });
  } else if (metadata.type === 'group_payment') {
    await supabaseClient
      .from('group_participants')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', metadata.participant_id);
  } else if (metadata.type === 'coin_purchase') {
    const coins = parseInt(metadata.coins || '0');
    await supabaseClient.rpc('award_loyalty_points', {
      target_user_id: metadata.user_id,
      points: coins,
      transaction_reason: 'coin_purchase',
    });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log("Processing payment_intent.succeeded", paymentIntent.id);
  
  // Update payment records
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: paymentIntent.metadata?.user_id,
      action: 'payment_succeeded',
      entity_type: 'payment',
      entity_id: paymentIntent.id,
      details: { amount: paymentIntent.amount, currency: paymentIntent.currency },
    });
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log("Processing payment_intent.payment_failed", paymentIntent.id);
  
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: paymentIntent.metadata?.user_id,
      action: 'payment_failed',
      entity_type: 'payment',
      entity_id: paymentIntent.id,
      details: { 
        amount: paymentIntent.amount, 
        currency: paymentIntent.currency,
        failure_message: paymentIntent.last_payment_error?.message 
      },
    });
}

async function handleChargeRefunded(charge: any) {
  console.log("Processing charge.refunded", charge.id);
  
  // Log refund
  await supabaseClient.from('activity_logs').insert({
    action: 'charge_refunded',
    entity_type: 'charge',
    entity_id: charge.id,
    details: { amount_refunded: charge.amount_refunded, currency: charge.currency },
  });
}

async function handleTransferCreated(transfer: any) {
  console.log("Processing transfer.created", transfer.id);
  
  // Update creator balance if applicable
  if (transfer.metadata?.creator_id) {
    await supabaseClient
      .from('creator_balances')
      .update({ 
        pending_balance: supabaseClient.rpc('increment', { x: transfer.amount / 100 }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', transfer.metadata.creator_id);
  }
}

async function handlePayoutPaid(payout: any) {
  console.log("Processing payout.paid", payout.id);
  
  // Update creator balance - move from pending to paid
  if (payout.metadata?.creator_id) {
    const amount = payout.amount / 100;
    await supabaseClient
      .from('creator_balances')
      .update({ 
        available_balance: supabaseClient.rpc('increment', { x: amount }),
        pending_balance: supabaseClient.rpc('decrement', { x: amount }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', payout.metadata.creator_id);
  }
}

async function handleAccountUpdated(account: any) {
  console.log("Processing account.updated", account.id);
  
  // Update Stripe Connect status
  await supabaseClient
    .from('profiles')
    .update({ 
      stripe_account_id: account.id,
      stripe_onboarding_complete: account.details_submitted,
    })
    .eq('stripe_account_id', account.id);
}
