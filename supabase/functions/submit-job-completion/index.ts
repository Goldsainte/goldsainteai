import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

    const { jobId, completionNotes, deliverablesDescription } = await req.json();

    // Get agent ID from user
    const { data: agent, error: agentError } = await supabaseClient
      .from('travel_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError) throw new Error('Agent not found');

    // Verify agent is assigned to this job
    const { data: job, error: jobError } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('assigned_agent_id', agent.id)
      .single();

    if (jobError) throw new Error('Job not found or not assigned to you');

    if (job.status !== 'in_progress') {
      throw new Error('Job is not in progress');
    }

    // Create completion submission
    const { data: submission, error: submissionError } = await supabaseClient
      .from('job_completion_submissions')
      .insert({
        job_id: jobId,
        agent_id: agent.id,
        completion_notes: completionNotes,
        deliverables_description: deliverablesDescription,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Update job status
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        status: 'pending_approval',
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes
      })
      .eq('id', jobId);

    console.log('Job completion submitted:', submission.id);

    // TODO: Send notification to customer

    return new Response(
      JSON.stringify({ 
        success: true,
        submissionId: submission.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting job completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
