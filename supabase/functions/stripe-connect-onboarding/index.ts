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

  // v2 (Jul 12): v1 queried travel_agents with the anon client after token
  // validation — RLS returned zero rows and .single() threw for everyone.
  // Anon client verifies the token; service-role client does the data work.
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await userClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Get agent data
    const { data: agentData, error: agentError } = await supabaseClient
      .from('travel_agents')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (agentError) throw agentError;
    if (!agentData) {
      return new Response(
        JSON.stringify({ error: "This account isn't provisioned as an agent yet — no agent record found." }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Country for the Stripe account (2026-07-19): global marketplace —
    // fixed at creation, so it must arrive from the client. ISO-2; US default.
    let reqBody: any = {};
    try { reqBody = await req.json(); } catch { /* no body is fine */ }
    const accountCountry =
      typeof reqBody?.country === "string" && /^[A-Za-z]{2}$/.test(reqBody.country.trim())
        ? reqBody.country.trim().toUpperCase()
        : "US";

    // v3 (Jul 13): the Connect account id's ONE home is profiles.
    const { data: profileRow } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_connect_account_id')
      .eq('id', user.id)
      .maybeSingle();
    let accountId = profileRow?.stripe_account_id || profileRow?.stripe_connect_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard', // Standard (2026-07-19): agent is a fully independent merchant of record
        country: accountCountry,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        // No settings.payouts — payout schedules are not settable by the
        // platform on Standard accounts; the account holder controls their own.
      });
      
      accountId = account.id;

      // Save to profiles — and CHECK the write. The old version wrote to a
      // column that didn't exist and never checked the error, silently
      // orphaning completed Stripe accounts. Never again: if we can't
      // record the account, we don't send the user to onboard it.
      const { error: saveError } = await supabaseClient
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
      if (saveError) {
        return new Response(
          JSON.stringify({ error: `Created the Stripe account but couldn't save it: ${saveError.message}. Not proceeding — contact support.` }),
          { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      // Best-effort status note on travel_agents (columns added Jul 13).
      await supabaseClient
        .from('travel_agents')
        .update({ stripe_account_status: 'pending', payout_schedule: 'daily' })
        .eq('user_id', user.id);
    }

    // Create account link for onboarding
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/agent-dashboard?refresh=true`,
      return_url: `${origin}/agent-dashboard?onboarding=complete`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { 
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in stripe-connect-onboarding:', error);

    // Provide helpful error message for Stripe Connect setup
    if (error.message?.includes('signed up for Connect')) {
      return new Response(
        JSON.stringify({
          error: 'Stripe Connect is not enabled on this account. Please enable Stripe Connect in your Stripe Dashboard: https://dashboard.stripe.com/settings/connect',
          details: 'To enable agent payouts, you need to activate Stripe Connect so the platform can create connected accounts.'
        }),
        {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Stripe requires confirming loss liability in the Platform Profile
    if (error.message?.includes('managing losses') || error.message?.includes('platform-profile')) {
      return new Response(
        JSON.stringify({
          error: 'Action required: confirm loss responsibility in Stripe Connect platform profile',
          details: 'Open your Stripe Dashboard and complete the Platform Profile > Losses section so account creation can proceed.',
          link: 'https://dashboard.stripe.com/settings/connect/platform-profile'
        }),
        {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
