import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { bookingId, reason } = await req.json();

    // Get booking and payment plan details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        travel_packages!inner(
          *,
          cancellation_policy:cancellation_policies!inner(
            package_cancellation_tiers(*)
          )
        ),
        package_payment_plans!inner(*)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError) throw bookingError;

    const packageData = booking.travel_packages;
    const paymentPlan = booking.package_payment_plans[0];
    
    // Calculate days until trip
    const tripStartDate = new Date(packageData.dates_info?.start_date);
    const today = new Date();
    const daysUntilTrip = Math.ceil((tripStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Find applicable refund tier
    const refundTier = packageData.cancellation_policy.package_cancellation_tiers
      .find((tier: any) => 
        daysUntilTrip >= tier.days_before_trip_min && 
        (!tier.days_before_trip_max || daysUntilTrip <= tier.days_before_trip_max)
      );

    if (!refundTier) {
      throw new Error('No applicable refund policy found');
    }

    const refundPercentage = refundTier.refund_percentage;
    
    // Calculate refund amount (excluding deposit which is non-refundable)
    const paidAmount = paymentPlan.deposit_amount + 
      (await supabaseClient
        .from('payment_installments')
        .select('amount')
        .eq('payment_plan_id', paymentPlan.id)
        .eq('status', 'paid')
        .then(res => res.data?.reduce((sum, inst) => sum + inst.amount, 0) || 0));

    const refundableAmount = paidAmount - paymentPlan.deposit_amount;
    const refundAmount = (refundableAmount * refundPercentage) / 100;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Get paid installments to refund
    const { data: paidInstallments } = await supabaseClient
      .from('payment_installments')
      .select('stripe_payment_intent_id, amount')
      .eq('payment_plan_id', paymentPlan.id)
      .eq('status', 'paid');

    let totalRefunded = 0;

    // Process refunds for each installment proportionally
    for (const installment of paidInstallments || []) {
      if (installment.stripe_payment_intent_id) {
        const installmentRefund = (installment.amount * refundPercentage) / 100;
        await stripe.refunds.create({
          payment_intent: installment.stripe_payment_intent_id,
          amount: Math.round(installmentRefund * 100),
          reason: 'requested_by_customer',
          metadata: {
            booking_id: bookingId,
            cancellation_reason: reason
          }
        });
        totalRefunded += installmentRefund;
      }
    }

    // Update booking status
    await supabaseClient
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: 'refunded'
      })
      .eq('id', bookingId);

    // Update payment plan status
    await supabaseClient
      .from('package_payment_plans')
      .update({ status: 'cancelled' })
      .eq('id', paymentPlan.id);

    // Cancel any pending escrow payouts
    await supabaseClient
      .from('creator_escrow_payouts')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    return new Response(
      JSON.stringify({
        success: true,
        refundAmount: totalRefunded,
        refundPercentage,
        message: refundTier.description
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error cancelling package booking:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
