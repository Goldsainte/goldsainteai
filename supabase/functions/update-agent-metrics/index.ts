import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active agents
    const { data: agents, error: agentsError } = await supabaseClient
      .from('travel_agents')
      .select('id')
      .eq('is_active', true);

    if (agentsError) throw agentsError;

    console.log(`Updating metrics for ${agents?.length || 0} agents`);

    // Update metrics and badges for each agent
    const updates = agents?.map(async (agent) => {
      try {
        // Update performance metrics
        const { error: metricsError } = await supabaseClient
          .rpc('update_agent_performance_metrics', { target_agent_id: agent.id });
        
        if (metricsError) {
          console.error(`Error updating metrics for agent ${agent.id}:`, metricsError);
        }

        // Evaluate and update badges
        const { error: badgesError } = await supabaseClient
          .rpc('evaluate_agent_badges', { target_agent_id: agent.id });
        
        if (badgesError) {
          console.error(`Error updating badges for agent ${agent.id}:`, badgesError);
        }
      } catch (error) {
        console.error(`Error processing agent ${agent.id}:`, error);
      }
    }) || [];

    await Promise.all(updates);

    console.log('Successfully updated agent metrics and badges');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated metrics for ${agents?.length || 0} agents` 
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update-agent-metrics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
