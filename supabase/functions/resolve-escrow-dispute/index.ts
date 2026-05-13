import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolutionRequest {
  disputeId: string;
  resolution: 'approved_full_refund' | 'approved_partial_refund' | 'approved_rework' | 'rejected' | 'escalated';
  refundAmount?: number;
  resolutionNotes: string;
  adminNotes?: string;
}

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
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Unauthorized: Admin access required');
    }

    const resolutionData: ResolutionRequest = await req.json();

    // Get dispute with escrow details
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('escrow_disputes')
      .select(`
        *,
        escrow_transactions:escrow_transaction_id (
          id,
          creator_id,
          customer_id,
          amount_held,
          payment_id
        )
      `)
      .eq('id', resolutionData.disputeId)
      .single();

    if (disputeError || !dispute) {
      throw new Error('Dispute not found');
    }

    const escrowTransaction = dispute.escrow_transactions as any;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    let refundId = null;

    // Process refund if applicable
    if (resolutionData.resolution.includes('refund') && resolutionData.refundAmount) {
      // Get original payment
      const { data: payment } = await supabaseClient
        .from('payments')
        .select('stripe_payment_intent_id')
        .eq('id', escrowTransaction.payment_id)
        .single();

      if (payment?.stripe_payment_intent_id) {
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: Math.round(resolutionData.refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
            dispute_id: resolutionData.disputeId,
            escrow_transaction_id: escrowTransaction.id
          }
        });
        refundId = refund.id;
      }

      // Update escrow amount
      await supabaseClient
        .from('escrow_transactions')
        .update({
          amount_held: escrowTransaction.amount_held - resolutionData.refundAmount,
          status: resolutionData.resolution === 'approved_full_refund' ? 'refunded' : 'disputed'
        })
        .eq('id', escrowTransaction.id);
    }

    // Update dispute
    const { error: updateError } = await supabaseClient
      .from('escrow_disputes')
      .update({
        status: resolutionData.resolution === 'escalated' ? 'escalated' : 'resolved',
        resolution_notes: resolutionData.resolutionNotes,
        admin_notes: resolutionData.adminNotes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolutionData.disputeId);

    if (updateError) {
      throw new Error('Failed to update dispute');
    }

    // Notify both parties
    const notifications = [
      {
        user_id: escrowTransaction.creator_id,
        type: 'system_announcement',
        title: 'Dispute Resolved',
        message: `Dispute has been ${resolutionData.resolution.replace(/_/g, ' ')}`,
        entity_type: 'escrow_dispute',
        entity_id: resolutionData.disputeId,
        action_url: '/creator-dashboard'
      },
      {
        user_id: escrowTransaction.customer_id,
        type: 'system_announcement',
        title: 'Dispute Resolved',
        message: `Dispute has been ${resolutionData.resolution.replace(/_/g, ' ')}`,
        entity_type: 'escrow_dispute',
        entity_id: resolutionData.disputeId,
        action_url: '/my-bookings'
      }
    ];

    await supabaseClient
      .from('notifications')
      .insert(notifications);

    console.log(`Dispute ${resolutionData.disputeId} resolved: ${resolutionData.resolution}`);

    return new Response(
      JSON.stringify({
        success: true,
        resolution: resolutionData.resolution,
        refundId,
        message: 'Dispute resolved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
