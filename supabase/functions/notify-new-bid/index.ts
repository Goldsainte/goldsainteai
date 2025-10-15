import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bidId, jobId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, user_id')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_id')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name')
      .eq('id', bid?.agent_id)
      .single();

    if (!job || !bid) {
      throw new Error('Job or bid not found');
    }

    // Notify customer
    await supabaseClient.from('notifications').insert({
      user_id: job.user_id,
      notification_type: 'new_bid',
      title: '📬 New Bid Received!',
      message: `${agent?.agency_name || 'An agent'} placed a bid of ${bid.currency} ${bid.customer_facing_price} on "${job.title}".`,
      metadata: { jobId, bidId },
      link: `/marketplace`,
    });

    console.log(`New bid notification sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-new-bid:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
