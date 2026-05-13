import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DisputeRequest {
  escrowTransactionId: string;
  milestoneId?: string;
  disputeType: 'non_delivery' | 'quality_issue' | 'partial_completion' | 'cancellation' | 'other';
  description: string;
  evidence?: Array<{ type: string; url: string; description?: string }>;
  requestedResolution: 'full_refund' | 'partial_refund' | 'rework' | 'mediation';
  refundAmount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const disputeData: DisputeRequest = await req.json();

    // Verify user is part of the escrow transaction
    const { data: escrowTransaction, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('id', disputeData.escrowTransactionId)
      .single();

    if (escrowError || !escrowTransaction) {
      throw new Error('Escrow transaction not found');
    }

    if (escrowTransaction.creator_id !== user.id && escrowTransaction.customer_id !== user.id) {
      throw new Error('Unauthorized: You are not part of this transaction');
    }

    // Check for existing open disputes
    const { data: existingDispute } = await supabaseClient
      .from('escrow_disputes')
      .select('id')
      .eq('escrow_transaction_id', disputeData.escrowTransactionId)
      .in('status', ['open', 'under_review'])
      .single();

    if (existingDispute) {
      throw new Error('An open dispute already exists for this transaction');
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('escrow_disputes')
      .insert({
        escrow_transaction_id: disputeData.escrowTransactionId,
        milestone_id: disputeData.milestoneId || null,
        filed_by: user.id,
        dispute_type: disputeData.disputeType,
        description: disputeData.description,
        evidence: disputeData.evidence || [],
        requested_resolution: disputeData.requestedResolution,
        refund_amount: disputeData.refundAmount || null,
        status: 'open'
      })
      .select()
      .single();

    if (disputeError) {
      console.error('Dispute creation error:', disputeError);
      throw new Error('Failed to create dispute');
    }

    // Update escrow status to disputed
    await supabaseClient
      .from('escrow_transactions')
      .update({ status: 'disputed' })
      .eq('id', disputeData.escrowTransactionId);

    // Update milestone status if specified
    if (disputeData.milestoneId) {
      await supabaseClient
        .from('payment_milestones')
        .update({ status: 'disputed' })
        .eq('id', disputeData.milestoneId);
    }

    // Notify the other party
    const otherPartyId = escrowTransaction.creator_id === user.id 
      ? escrowTransaction.customer_id 
      : escrowTransaction.creator_id;

    await supabaseClient
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        type: 'system_announcement',
        title: 'Dispute Filed',
        message: `A dispute has been filed regarding your transaction`,
        entity_type: 'escrow_dispute',
        entity_id: dispute.id,
        action_url: '/my-bookings'
      });

    // Notify admins
    const { data: admins } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'system_announcement',
        title: 'New Dispute',
        message: `New ${disputeData.disputeType} dispute requires review`,
        entity_type: 'escrow_dispute',
        entity_id: dispute.id,
        action_url: '/admin/disputes'
      }));

      await supabaseClient
        .from('notifications')
        .insert(adminNotifications);
    }

    console.log(`Dispute ${dispute.id} filed for escrow ${disputeData.escrowTransactionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        disputeId: dispute.id,
        message: 'Dispute filed successfully. An admin will review it soon.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error filing dispute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
