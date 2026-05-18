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

  try {
    // 🔒 AUTH: require an authenticated admin caller
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = roles?.some((r: { role: string }) => r.role === 'admin') ?? false;
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { payoutId } = await req.json();

    // Get payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from('creator_escrow_payouts')
      .select(`
        *,
        package:travel_packages!inner(
          profiles!travel_packages_creator_id_fkey(stripe_account_id)
        )
      `)
      .eq('id', payoutId)
      .single();

    if (payoutError) throw payoutError;

    if (payout.status !== 'pending') {
      throw new Error('Payout already processed');
    }

    if (!payout.package.profiles?.stripe_account_id) {
      throw new Error('Creator does not have Stripe Connect account');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Create transfer to creator
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.net_amount * 100),
      currency: payout.currency.toLowerCase(),
      destination: payout.package.profiles.stripe_account_id,
      description: `${payout.payout_type} payout for package booking`,
      metadata: {
        payout_id: payoutId,
        package_id: payout.package_id,
        booking_id: payout.booking_id,
        payout_type: payout.payout_type
      }
    });

    // Update payout status
    await supabaseClient
      .from('creator_escrow_payouts')
      .update({
        status: 'completed',
        released_date: new Date().toISOString(),
        stripe_transfer_id: transfer.id
      })
      .eq('id', payoutId);

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transfer.id
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing escrow payout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
