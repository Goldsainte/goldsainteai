import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  // Get authenticated user from JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { session_id } = await req.json();

    // Check idempotency
    const { data: existingPayment } = await supabaseClient
      .from("processed_payments")
      .select("id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (existingPayment) {
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid' && session.metadata?.user_id && session.metadata?.coin_amount) {
      const userId = session.metadata.user_id;
      const coinAmount = parseInt(session.metadata.coin_amount);

      // Record payment as processed
      await supabaseClient
        .from("processed_payments")
        .insert({
          payment_intent_id: session.payment_intent as string || session_id,
          stripe_session_id: session_id,
          user_id: userId,
          amount_cents: session.amount_total || 0,
          currency: session.currency || 'usd',
          payment_type: "coins",
          metadata: { coin_amount: coinAmount }
        });

      // Update coin purchase status
      await supabaseClient
        .from('coin_purchases')
        .update({ status: 'completed' })
        .eq('stripe_payment_intent_id', session.payment_intent as string);

      // Add coins to user balance
      const { data: existing } = await supabaseClient
        .from('user_coin_balance')
        .select('balance, lifetime_purchased')
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabaseClient
          .from('user_coin_balance')
          .update({
            balance: existing.balance + coinAmount,
            lifetime_purchased: existing.lifetime_purchased + coinAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        await supabaseClient
          .from('user_coin_balance')
          .insert({
            user_id: userId,
            balance: coinAmount,
            lifetime_purchased: coinAmount,
          });
      }

      return new Response(JSON.stringify({ success: true, coins_added: coinAmount }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, message: 'Payment not completed' }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
