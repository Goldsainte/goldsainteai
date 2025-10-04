import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      apiVersion: '2025-08-27.basil',
    });

    // Customer pays the customer_facing_price
    const customerAmount = Math.round(bid.customer_facing_price * 100); // Convert to cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency: bid.currency.toLowerCase(),
      customer: user.email,
      metadata: {
        job_id: jobId,
        bid_id: bidId,
        agent_id: bid.agent_id,
        agent_quoted_price: bid.agent_quoted_price.toString(),
        service_fee: bid.platform_service_fee.toString(),
        success_fee: bid.platform_success_fee.toString(),
      },
      description: `Payment for ${job.title}`,
      // Platform receives the full amount initially
      application_fee_amount: Math.round((bid.platform_service_fee + bid.platform_success_fee) * 100),
      transfer_data: {
        // Transfer agent payout amount to agent's connected account
        amount: Math.round(bid.agent_payout_amount * 100),
        destination: bid.travel_agents.stripe_account_id,
      },
    });

    // Update job with payment intent
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
