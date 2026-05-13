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

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    let accountId = profile.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
              delay_days: 'minimum',
            },
          },
        },
      });
      
      accountId = account.id;

      // Update profile with Stripe account ID
      await supabaseClient
        .from('profiles')
        .update({ 
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
          payout_schedule: 'daily'
        })
        .eq('id', user.id);
    }

    // Create account link for onboarding
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/creator-dashboard?refresh=true`,
      return_url: `${origin}/creator-dashboard?onboarding=complete`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in creator-stripe-onboarding:', error);
    
    // Provide helpful error message for Stripe Connect setup
    if (error.message?.includes('signed up for Connect')) {
      return new Response(
        JSON.stringify({ 
          error: 'Stripe Connect is not enabled on this account. Please enable Stripe Connect in your Stripe Dashboard: https://dashboard.stripe.com/settings/connect',
          details: 'To enable creator payouts, you need to activate Stripe Connect. This allows the platform to create connected accounts for sellers.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
