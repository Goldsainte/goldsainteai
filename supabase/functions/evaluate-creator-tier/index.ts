import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // First calculate current progress metrics
    const { data: progressData, error: progressError } = await supabaseClient
      .rpc('calculate_creator_tier_progress', { p_user_id: user.id });

    if (progressError) {
      console.error('Error calculating progress:', progressError);
      throw progressError;
    }

    // Then evaluate and upgrade tier if eligible
    const { data: tierData, error: tierError } = await supabaseClient
      .rpc('evaluate_and_upgrade_creator_tier', { p_user_id: user.id });

    if (tierError) {
      console.error('Error evaluating tier:', tierError);
      throw tierError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics: progressData,
        tier_result: tierData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in evaluate-creator-tier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});