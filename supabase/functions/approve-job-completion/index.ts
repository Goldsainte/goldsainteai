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

    const { submissionId, feedback } = await req.json();

    // Get submission details
    const { data: submission, error: submissionError } = await supabaseClient
      .from('job_completion_submissions')
      .select('*, marketplace_jobs(*)')
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

    // Get payment intent details from job
    const paymentIntentId = submission.marketplace_jobs.payment_intent_id;
    
    if (!paymentIntentId) {
      throw new Error('No payment found for this job');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Get payment intent metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadata = paymentIntent.metadata;

    // Create transfer to agent's connected account
    const agentPayoutAmount = Math.round(parseFloat(metadata.agent_payout_amount) * 100);
    const stripeAccountId = metadata.stripe_account_id;

    const transfer = await stripe.transfers.create({
      amount: agentPayoutAmount,
      currency: paymentIntent.currency,
      destination: stripeAccountId,
      description: `Payout for ${submission.marketplace_jobs.title}`,
      metadata: {
        job_id: submission.job_id,
        submission_id: submissionId,
      },
    });

    console.log('Transfer created:', transfer.id);

    // Update submission status
    await supabaseClient
      .from('job_completion_submissions')
      .update({
        status: 'approved',
        customer_response: feedback,
        customer_response_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    // Update job status
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        status: 'completed',
        customer_approved_at: new Date().toISOString(),
        funds_released: true,
        funds_released_at: new Date().toISOString(),
        payment_status: 'completed'
      })
      .eq('id', submission.job_id);

    // Update payment record
    await supabaseClient
      .from('payments')
      .update({
        transferred_to_agent: true,
        transfer_id: transfer.id,
        transferred_at: new Date().toISOString(),
        escrow_held: false
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    console.log('Job completion approved and funds released');

    // TODO: Send notification to agent
    // TODO: Prompt customer to leave review

    return new Response(
      JSON.stringify({ 
        success: true,
        transferId: transfer.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error approving job completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
