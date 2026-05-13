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

interface CompletionRequest {
  milestoneId: string;
  evidence: {
    description: string;
    files?: string[];
    notes?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { milestoneId, evidence }: CompletionRequest = await req.json();

    // Get milestone and verify creator ownership
    const { data: milestone, error: milestoneError } = await supabaseClient
      .from('payment_milestones')
      .select(`
        *,
        escrow_transactions:escrow_transaction_id (
          creator_id,
          customer_id
        )
      `)
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      throw new Error('Milestone not found');
    }

    const escrowTransaction = milestone.escrow_transactions as any;
    if (escrowTransaction.creator_id !== user.id) {
      throw new Error('Unauthorized: You are not the creator of this milestone');
    }

    if (milestone.status !== 'pending') {
      throw new Error(`Cannot submit completion for milestone with status: ${milestone.status}`);
    }

    // Update milestone with completion evidence
    const { error: updateError } = await supabaseClient
      .from('payment_milestones')
      .update({
        status: 'met',
        completion_evidence: evidence,
        completed_at: new Date().toISOString()
      })
      .eq('id', milestoneId);

    if (updateError) {
      throw new Error('Failed to update milestone');
    }

    // Notify customer
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: escrowTransaction.customer_id,
        type: 'milestone_funded',
        title: 'Milestone Completed',
        message: `${milestone.milestone_name} has been marked complete. Please review.`,
        entity_type: 'payment_milestone',
        entity_id: milestoneId,
        action_url: '/my-bookings'
      });

    console.log(`Milestone ${milestoneId} marked as completed by creator`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Milestone completion submitted for review'
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting milestone completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
