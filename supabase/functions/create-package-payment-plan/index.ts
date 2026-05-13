import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

    const { packageId, bookingId, paymentPlanType, installmentCount } = await req.json();

    // Get package details
    const { data: package_data, error: pkgError } = await supabaseClient
      .from('travel_packages')
      .select('*, profiles!travel_packages_creator_id_fkey(stripe_account_id)')
      .eq('id', packageId)
      .single();

    if (pkgError) throw pkgError;

    const totalAmount = package_data.price;
    const depositPercentage = package_data.deposit_percentage || 30;
    const depositAmount = (totalAmount * depositPercentage) / 100;
    const remainingAmount = totalAmount - depositAmount;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId = customers.data[0]?.id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
    }

    // Calculate platform host fee (3.5%)
    const platformFeeAmount = Math.round(totalAmount * 0.035 * 100);
    const creatorAmount = Math.round((totalAmount * 0.965) * 100);

    // Create deposit payment intent
    const depositPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: package_data.currency.toLowerCase(),
      customer: customerId,
      application_fee_amount: Math.round(depositAmount * 0.035 * 100),
      transfer_data: package_data.profiles?.stripe_account_id ? {
        destination: package_data.profiles.stripe_account_id,
      } : undefined,
      metadata: {
        package_id: packageId,
        booking_id: bookingId,
        payment_type: 'deposit',
        escrow: 'true'
      }
    });

    // Create payment plan record
    const { data: paymentPlan, error: planError } = await supabaseClient
      .from('package_payment_plans')
      .insert({
        package_id: packageId,
        booking_id: bookingId,
        user_id: user.id,
        total_amount: totalAmount,
        currency: package_data.currency,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        installment_count: installmentCount || 2,
        installment_frequency: paymentPlanType === 'monthly' ? 'monthly' : 'one_time',
        status: 'pending_deposit'
      })
      .select()
      .single();

    if (planError) throw planError;

    // Create installment schedule
    const installments = [];
    const installmentAmount = remainingAmount / (installmentCount - 1 || 1);
    const startDate = new Date(package_data.dates_info?.start_date || new Date());
    
    for (let i = 1; i < installmentCount; i++) {
      const dueDate = new Date(startDate);
      if (paymentPlanType === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() - (installmentCount - i));
      } else {
        // Final payment 30 days before trip
        dueDate.setDate(dueDate.getDate() - 30);
      }

      installments.push({
        payment_plan_id: paymentPlan.id,
        installment_number: i,
        amount: installmentAmount,
        currency: package_data.currency,
        due_date: dueDate.toISOString(),
        status: 'scheduled'
      });
    }

    if (installments.length > 0) {
      await supabaseClient
        .from('payment_installments')
        .insert(installments);
    }

    // Create initial escrow payout record
    const upfrontPercentage = package_data.creator_verified_for_upfront ? 
      (package_data.upfront_payout_percentage || 20) : 0;
    
    if (upfrontPercentage > 0) {
      const upfrontAmount = (totalAmount * 0.965 * upfrontPercentage) / 100; // After 3.5% platform fee
      await supabaseClient
        .from('creator_escrow_payouts')
        .insert({
          package_id: packageId,
          booking_id: bookingId,
          creator_id: package_data.creator_id,
          payout_type: 'upfront',
          amount: upfrontAmount,
          currency: package_data.currency,
          platform_fee: (upfrontAmount / 0.965) * 0.035,
          net_amount: upfrontAmount,
          status: 'pending',
          milestone_description: 'Upfront payout for verified creator'
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: depositPaymentIntent.client_secret,
        paymentPlanId: paymentPlan.id
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating payment plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
