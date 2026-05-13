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

    const { submissionId, rejectionReason, requestRevision } = await req.json();

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

    const newStatus = requestRevision ? 'revision_requested' : 'rejected';
    const jobStatus = requestRevision ? 'in_progress' : 'disputed';

    // Update submission status
    await supabaseClient
      .from('job_completion_submissions')
      .update({
        status: newStatus,
        customer_response: rejectionReason,
        customer_response_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    // Update job status
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        status: jobStatus,
        rejection_reason: rejectionReason
      })
      .eq('id', submission.job_id);

    console.log(`Job completion ${newStatus}:`, submissionId);

    // TODO: Send notification to agent

    return new Response(
      JSON.stringify({ 
        success: true,
        status: newStatus
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error rejecting job completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
