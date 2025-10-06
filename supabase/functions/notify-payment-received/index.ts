import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { jobId, amount, currency } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, user_id, assigned_agent_id')
      .eq('id', jobId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('user_id')
      .eq('id', job?.assigned_agent_id)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Notify customer
    await supabaseClient.from('notifications').insert({
      user_id: job.user_id,
      notification_type: 'payment_processed',
      title: '💳 Payment Processed',
      message: `Your payment of ${currency} ${amount} for "${job.title}" has been successfully processed and held in escrow.`,
      metadata: { jobId, amount, currency },
      link: `/marketplace`,
    });

    // Notify agent
    if (agent?.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: agent.user_id,
        notification_type: 'payment_received',
        title: '💰 Payment Received!',
        message: `Payment of ${currency} ${amount} received for "${job.title}". Funds are held in escrow and will be released upon completion approval.`,
        metadata: { jobId, amount, currency },
        link: `/agent-dashboard`,
      });
    }

    console.log(`Payment notifications sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-payment-received:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
