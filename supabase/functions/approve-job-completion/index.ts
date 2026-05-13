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

    const { submissionId, feedback } = await req.json();

    // Get submission details
    const { data: submission, error: submissionError } = await supabaseClient
      .from('job_completion_submissions')
      .select(`
        *,
        marketplace_jobs(
          *,
          travel_agents(stripe_account_id, stripe_payouts_enabled)
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;

    // Verify user owns the job
    if (submission.marketplace_jobs.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    if (submission.status !== 'pending') {
      throw new Error('Submission already processed');
    }

    // Check if agent has Stripe Connect set up
    const agent = submission.marketplace_jobs.travel_agents;
    if (!agent?.stripe_account_id || !agent.stripe_payouts_enabled) {
      throw new Error('Agent has not set up payouts yet');
    }

    // Get the job and verify payment was already captured
    const job = submission.marketplace_jobs;
    const paymentIntentId = job.payment_intent_id;
    
    if (!paymentIntentId) {
      throw new Error('No payment intent found for this job');
    }

    // Get accepted bid amount
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_payout_amount, platform_success_fee')
      .eq('job_id', submission.job_id)
      .eq('status', 'accepted')
      .single();

    if (!bid) {
      throw new Error('No accepted bid found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    // Capture the payment - this automatically transfers to agent per the payment intent setup
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    console.log('Payment captured and transferred to agent:', paymentIntentId);

    // Update submission status
    await supabaseClient
      .from('job_completion_submissions')
      .update({
        status: 'approved',
        customer_response: feedback,
        customer_response_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    // Update job status with payment details
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        status: 'completed',
        customer_approved_at: new Date().toISOString(),
        payment_captured_at: new Date().toISOString(),
        payout_processed_at: new Date().toISOString(),
        payment_status: 'completed'
      })
      .eq('id', submission.job_id);

    // Create invoice record
    await supabaseClient
      .from('marketplace_invoices')
      .insert({
        job_id: submission.job_id,
        customer_id: submission.marketplace_jobs.user_id,
        agent_id: submission.marketplace_jobs.assigned_agent_id,
        total_amount: bid.customer_facing_price,
        agent_payout: bid.agent_payout_amount,
        platform_fee: bid.customer_facing_price - bid.agent_payout_amount,
        currency: bid.currency,
        status: 'paid',
        paid_at: new Date().toISOString(),
        transfer_date: new Date().toISOString()
      });

    console.log('Job completion approved and funds transferred');

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentIntentId: paymentIntent.id,
        captured: true
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error approving job completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
