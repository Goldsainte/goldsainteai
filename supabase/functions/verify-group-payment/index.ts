import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get authenticated user from JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { paymentIntentId, jobId, travelerNumber } = await req.json();
    
    console.log('Verifying group payment:', { paymentIntentId, jobId, travelerNumber });

    // Check idempotency
    const { data: existingPayment } = await supabaseClient
      .from("processed_payments")
      .select("id")
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (existingPayment) {
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Record payment as processed
    await supabaseClient
      .from("processed_payments")
      .insert({
        payment_intent_id: paymentIntentId,
        user_id: null,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_type: "group_booking",
        metadata: { job_id: jobId, traveler_number: travelerNumber }
      });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    // Update traveler payment status
    const { error: updateError } = await supabaseClient
      .from('group_booking_travelers')
      .update({
        payment_status: 'paid',
        payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
      .eq('traveler_number', travelerNumber);

    if (updateError) {
      console.error('Error updating traveler payment:', updateError);
      throw updateError;
    }

    // Check if all travelers have paid
    const { data: allTravelers } = await supabaseClient
      .from('group_booking_travelers')
      .select('*')
      .eq('job_id', jobId);

    const allPaid = allTravelers?.every(t => t.payment_status === 'paid');
    const paidCount = allTravelers?.filter(t => t.payment_status === 'paid').length || 0;

    // Update job payment status
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        payments_collected: paidCount,
        payment_status: allPaid ? 'completed' : 'partial',
        paid_at: allPaid ? new Date().toISOString() : null
      })
      .eq('id', jobId);

    // If all paid, notify organizer and agent
    if (allPaid) {
      console.log('All payments received for job:', jobId);
      
      const { data: job } = await supabaseClient
        .from('marketplace_jobs')
        .select('*, travel_agents(*)')
        .eq('id', jobId)
        .single();

      if (job) {
        // Notify organizer
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: job.user_id,
            title: 'All Payments Received!',
            message: `All travelers have completed payment for "${job.title}". Your booking is now fully confirmed.`,
            type: 'payment_received',
            action_url: `/my-jobs/${jobId}`
          });

        // Notify agent if assigned
        if (job.assigned_agent_id) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: job.travel_agents.user_id,
              title: 'Group Booking Fully Paid',
              message: `All payments received for "${job.title}". You can now proceed with the booking.`,
              type: 'payment_received',
              action_url: `/agent-dashboard/jobs/${jobId}`
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        allPaid,
        paidCount,
        totalTravelers: allTravelers?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error verifying group payment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Payment verification failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
