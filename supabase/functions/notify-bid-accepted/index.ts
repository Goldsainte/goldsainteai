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

    const { bidId, jobId, customerId, agentId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name, user_id')
      .eq('id', agentId)
      .single();

    if (!job || !bid || !agent) {
      throw new Error('Job, bid, or agent not found');
    }

    // Notify customer
    await supabaseClient.from('notifications').insert({
      user_id: customerId,
      notification_type: 'bid_accepted',
      title: '🎉 Bid Accepted!',
      message: `Your bid for "${job.title}" has been accepted. Payment of ${bid.currency} ${bid.customer_facing_price} is required to proceed.`,
      metadata: { jobId, bidId, agentId },
      link: `/marketplace`,
    });

    // Notify agent
    if (agent.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: agent.user_id,
        notification_type: 'bid_accepted_agent',
        title: '🎉 Your Bid Was Accepted!',
        message: `Congratulations! Your bid for "${job.title}" has been accepted. The customer will process payment shortly.`,
        metadata: { jobId, bidId },
        link: `/agent-dashboard`,
      });
    }

    console.log(`Bid accepted notifications sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-bid-accepted:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
