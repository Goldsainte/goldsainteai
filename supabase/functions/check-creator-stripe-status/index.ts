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

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, payout_schedule')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    if (!profile.stripe_account_id) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
          payout_schedule: 'daily'
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    // Update profile with latest status
    await supabaseClient
      .from('profiles')
      .update({
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
        stripe_onboarding_completed: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled
      })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        connected: true,
        onboarding_complete: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        payout_schedule: profile.payout_schedule || 'daily',
        requirements: account.requirements
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking creator Stripe status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
