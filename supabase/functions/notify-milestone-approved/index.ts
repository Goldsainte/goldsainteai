import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { milestoneId, jobId } = await req.json();

    // Get milestone details
    const { data: milestone } = await supabaseClient
      .from('payment_milestones')
      .select('title, amount, currency')
      .eq('id', milestoneId)
      .single();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, assigned_agent_id')
      .eq('id', jobId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('user_id')
      .eq('id', job?.assigned_agent_id)
      .single();

    if (!milestone || !job) {
      throw new Error('Milestone or job not found');
    }

    // Notify agent
    if (agent?.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: agent.user_id,
        type: 'milestone_released',
        title: '✅ Milestone Approved!',
        message: `Milestone "${milestone.title}" for "${job.title}" has been approved. Payment of ${milestone.currency} ${milestone.amount} will be released.`,
        entity_type: 'booking_milestone',
        entity_id: milestoneId,
        action_url: `/agent-dashboard`,
      });
    }

    console.log(`Milestone approval notification sent for milestone ${milestoneId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-milestone-approved:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
