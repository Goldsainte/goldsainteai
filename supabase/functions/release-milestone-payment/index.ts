import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReleaseRequest {
  milestoneId: string;
  approved: boolean;
  rejectionReason?: string;
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

    const { milestoneId, approved, rejectionReason }: ReleaseRequest = await req.json();

    // Get milestone with escrow details
    const { data: milestone, error: milestoneError } = await supabaseClient
      .from('payment_milestones')
      .select(`
        *,
        escrow_transactions:escrow_transaction_id (
          id,
          creator_id,
          customer_id,
          amount_held,
          amount_released,
          status
        )
      `)
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      throw new Error('Milestone not found');
    }

    const escrowTransaction = milestone.escrow_transactions as any;

    // Verify user is customer or admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    const isCustomer = escrowTransaction.customer_id === user.id;

    if (!isAdmin && !isCustomer) {
      throw new Error('Unauthorized: Only customer or admin can approve milestones');
    }

    if (milestone.status !== 'met') {
      throw new Error(`Cannot release payment for milestone with status: ${milestone.status}`);
    }

    if (!approved) {
      // Rejection - revert to pending
      const { error: rejectError } = await supabaseClient
        .from('payment_milestones')
        .update({
          status: 'pending',
          completion_evidence: {
            ...milestone.completion_evidence,
            rejection_reason: rejectionReason,
            rejected_at: new Date().toISOString()
          }
        })
        .eq('id', milestoneId);

      if (rejectError) throw new Error('Failed to reject milestone');

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: escrowTransaction.creator_id,
          type: 'system_announcement',
          title: 'Milestone Rejected',
          message: `${milestone.milestone_name} was rejected. Reason: ${rejectionReason}`,
          entity_type: 'payment_milestone',
          entity_id: milestoneId,
          action_url: '/creator-dashboard'
        });

      return new Response(
        JSON.stringify({ success: true, message: 'Milestone rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Approval - process payment
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Get creator's Stripe account
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', escrowTransaction.creator_id)
      .single();

    if (!profile?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    // Create transfer to creator
    const transfer = await stripe.transfers.create({
      amount: Math.round(milestone.amount * 100), // Convert to cents
      currency: 'usd',
      destination: profile.stripe_account_id,
      transfer_group: escrowTransaction.id,
      metadata: {
        milestone_id: milestoneId,
        escrow_transaction_id: escrowTransaction.id
      }
    });

    // Update milestone as paid
    const { error: updateError } = await supabaseClient
      .from('payment_milestones')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id
      })
      .eq('id', milestoneId);

    if (updateError) throw new Error('Failed to update milestone status');

    // Update escrow transaction
    const newAmountReleased = escrowTransaction.amount_released + milestone.amount;
    const newAmountHeld = escrowTransaction.amount_held - milestone.amount;

    const { error: escrowUpdateError } = await supabaseClient
      .from('escrow_transactions')
      .update({
        amount_released: newAmountReleased,
        amount_held: newAmountHeld,
        status: newAmountHeld <= 0 ? 'released' : 'releasing',
        released_at: newAmountHeld <= 0 ? new Date().toISOString() : null
      })
      .eq('id', escrowTransaction.id);

    if (escrowUpdateError) throw new Error('Failed to update escrow');

    // Notify creator
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: escrowTransaction.creator_id,
        type: 'milestone_released',
        title: 'Payment Released',
        message: `$${milestone.amount} released for ${milestone.milestone_name}`,
        entity_type: 'payment_milestone',
        entity_id: milestoneId,
        action_url: '/creator-dashboard'
      });

    console.log(`Milestone ${milestoneId} payment released: $${milestone.amount}`);

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transfer.id,
        amountReleased: milestone.amount,
        remainingHeld: newAmountHeld
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error releasing milestone payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
