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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let installmentId: string | undefined;
  
  try {
    const body = await req.json();
    installmentId = body.installmentId;

    if (!installmentId) {
      throw new Error('Installment ID is required');
    }

    // Get installment details with payment plan and package info
    const { data: installment, error: instError } = await supabaseClient
      .from('payment_installments')
      .select(`
        *,
        payment_plan:package_payment_plans!inner(
          *,
          package:travel_packages!inner(
            *,
            profiles!travel_packages_creator_id_fkey(stripe_account_id)
          )
        )
      `)
      .eq('id', installmentId)
      .single();

    if (instError) throw instError;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Get customer from payment plan
    const customers = await stripe.customers.list({ 
      email: installment.payment_plan.user_id,
      limit: 1 
    });
    
    if (customers.data.length === 0) {
      throw new Error('Customer not found');
    }

    const customerId = customers.data[0].id;

    // Create payment intent for installment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(installment.amount * 100),
      currency: installment.currency.toLowerCase(),
      customer: customerId,
      application_fee_amount: Math.round(installment.amount * 0.035 * 100),
      transfer_data: installment.payment_plan.package.profiles?.stripe_account_id ? {
        destination: installment.payment_plan.package.profiles.stripe_account_id,
      } : undefined,
      metadata: {
        installment_id: installmentId,
        payment_plan_id: installment.payment_plan_id,
        installment_number: installment.installment_number,
        escrow: 'true'
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    // Update installment status
    await supabaseClient
      .from('payment_installments')
      .update({
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        paid_date: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', installmentId);

    // Check if all installments are paid
    const { data: allInstallments } = await supabaseClient
      .from('payment_installments')
      .select('status')
      .eq('payment_plan_id', installment.payment_plan_id);

    const allPaid = allInstallments?.every(i => i.status === 'paid');

    if (allPaid) {
      await supabaseClient
        .from('package_payment_plans')
        .update({ status: 'completed' })
        .eq('id', installment.payment_plan_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentIntent.status
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing installment:', error);
    
    // Update retry count (handled via RPC for atomic increment)
    if (installmentId) {
      const { data: currentInstallment } = await supabaseClient
        .from('payment_installments')
        .select('retry_count')
        .eq('id', installmentId)
        .single();
      
      if (currentInstallment) {
        await supabaseClient
          .from('payment_installments')
          .update({
            retry_count: currentInstallment.retry_count + 1,
            last_retry_date: new Date().toISOString()
          })
          .eq('id', installmentId);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
