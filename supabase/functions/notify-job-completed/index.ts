import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

    const { jobId, submissionId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, user_id, assigned_agent_id')
      .eq('id', jobId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name, user_id')
      .eq('id', job?.assigned_agent_id)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Notify customer to review completion
    await supabaseClient.from('notifications').insert({
      user_id: job.user_id,
      type: 'review_received',
      title: '✅ Job Completed - Review Required',
      message: `${agent?.agency_name || 'Your agent'} has marked "${job.title}" as complete. Please review their work and approve or request revisions.`,
      entity_type: 'marketplace_job',
      entity_id: jobId,
      action_url: `/marketplace`,
    });

    console.log(`Job completion notification sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-job-completed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
