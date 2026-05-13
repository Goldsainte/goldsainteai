import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { cancellationId } = await req.json();
    
    console.log("Processing refund for cancellation:", cancellationId);

    // Get authenticated user (admin check could be added here)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Get cancellation details
    const { data: cancellation, error: cancellationError } = await supabaseClient
      .from("booking_cancellations")
      .select(`
        *,
        bookings (
          id,
          stripe_session_id,
          stripe_payment_intent_id,
          total_price,
          currency
        )
      `)
      .eq("id", cancellationId)
      .single();

    if (cancellationError || !cancellation) {
      throw new Error("Cancellation not found");
    }

    // Check if cancellation is pending approval
    if (cancellation.status !== "pending" && cancellation.status !== "approved") {
      throw new Error(`Cannot process refund for cancellation with status: ${cancellation.status}`);
    }

    // Check if refund already exists
    const { data: existingRefund } = await supabaseClient
      .from("booking_refunds")
      .select("*")
      .eq("cancellation_id", cancellationId)
      .maybeSingle();

    if (existingRefund && existingRefund.status === "succeeded") {
      throw new Error("Refund has already been processed");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    const booking = cancellation.bookings as any;
    const paymentIntentId = booking?.stripe_payment_intent_id;

    if (!paymentIntentId) {
      throw new Error("No payment intent found for this booking");
    }

    console.log("Processing Stripe refund for payment intent:", paymentIntentId);

    // Create refund in Stripe
    const refundAmountCents = Math.round(cancellation.refund_amount * 100);
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        cancellation_id: cancellationId,
        booking_id: cancellation.booking_id,
        user_id: cancellation.user_id,
      },
    });

    console.log("Stripe refund created:", refund.id);

    // Create or update refund record
    if (existingRefund) {
      await supabaseClient
        .from("booking_refunds")
        .update({
          stripe_refund_id: refund.id,
          status: refund.status === "succeeded" ? "succeeded" : "processing",
          refunded_at: refund.status === "succeeded" ? new Date().toISOString() : null,
        })
        .eq("id", existingRefund.id);
    } else {
      await supabaseClient
        .from("booking_refunds")
        .insert({
          cancellation_id: cancellationId,
          booking_id: cancellation.booking_id,
          stripe_payment_intent_id: paymentIntentId,
          stripe_refund_id: refund.id,
          refund_amount: cancellation.refund_amount,
          currency: cancellation.currency,
          status: refund.status === "succeeded" ? "succeeded" : "processing",
          refunded_at: refund.status === "succeeded" ? new Date().toISOString() : null,
        });
    }

    // Update cancellation status
    await supabaseClient
      .from("booking_cancellations")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq("id", cancellationId);

    // Update booking status
    await supabaseClient
      .from("bookings")
      .update({
        cancellation_status: "refunded",
        status: "refunded",
      })
      .eq("id", cancellation.booking_id);

    // Create notification
    await supabaseClient.from("notifications").insert({
      user_id: cancellation.user_id,
      type: "payment_received",
      title: "Refund Processed",
      message: `Your refund of ${cancellation.currency} ${cancellation.refund_amount.toFixed(2)} has been processed. It may take 5-10 business days to appear in your account.`,
      entity_type: 'booking_cancellation',
      entity_id: cancellationId,
    });

    console.log("Refund processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        refund: {
          id: refund.id,
          amount: cancellation.refund_amount,
          currency: cancellation.currency,
          status: refund.status,
        },
        message: "Refund processed successfully",
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing refund:", error);
    
    // If we have a cancellation ID, log the failure
    const { cancellationId } = await req.json().catch(() => ({}));
    if (cancellationId) {
      await supabaseClient
        .from("booking_refunds")
        .upsert({
          cancellation_id: cancellationId,
          status: "failed",
          failure_reason: error instanceof Error ? error.message : "Unknown error",
        });
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
