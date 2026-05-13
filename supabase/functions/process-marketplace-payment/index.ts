import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { jobId, bidId } = await req.json();

    // Get job and bid details
    const { data: job, error: jobError } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    const { data: bid, error: bidError } = await supabaseClient
      .from('agent_bids')
      .select('*, travel_agents(*)')
      .eq('id', bidId)
      .single();

    if (bidError) throw bidError;

    // Verify user is job owner
    if (job.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Verify agent has Stripe Connect setup
    if (!bid.travel_agents.stripe_account_id || !bid.travel_agents.stripe_payouts_enabled) {
      throw new Error('Agent payment account not set up');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Customer pays the customer_facing_price
    const customerAmount = Math.round(bid.customer_facing_price * 100); // Convert to cents
    const agentPayoutAmount = Math.round(bid.agent_payout_amount * 100);
    const platformFees = customerAmount - agentPayoutAmount; // Service fee + success fee

    // Create payment intent with automatic transfer to agent using destination charges
    // This provides escrow - we capture payment but transfer happens on job completion
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency: bid.currency.toLowerCase(),
      customer: user.email,
      capture_method: 'manual', // Requires manual capture after job completion
      application_fee_amount: platformFees,
      on_behalf_of: bid.travel_agents.stripe_account_id, // Agent's account
      transfer_data: {
        destination: bid.travel_agents.stripe_account_id,
      },
      metadata: {
        job_id: jobId,
        bid_id: bidId,
        agent_id: bid.agent_id,
        agent_quoted_price: bid.agent_quoted_price.toString(),
        service_fee: bid.platform_service_fee.toString(),
        success_fee: bid.platform_success_fee.toString(),
        agent_payout_amount: bid.agent_payout_amount.toString(),
      },
      description: `Escrow payment for ${job.title}`,
      // When captured, agent automatically receives their payout, platform keeps fees
    });

    // Update job with payment intent and set to in_progress
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        status: 'in_progress' // Agent can now start working
      })
      .eq('id', jobId);

    // Create payment record with escrow tracking
    await supabaseClient
      .from('payments')
      .insert({
        booking_id: jobId, // Reusing booking_id for marketplace jobs
        amount: bid.customer_facing_price,
        currency: bid.currency,
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        escrow_held: true,
        transferred_to_agent: false
      });

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing payment:', error);
    // SECURITY: Return generic error message
    return new Response(
      JSON.stringify({ error: 'Payment processing failed. Please try again.' }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
