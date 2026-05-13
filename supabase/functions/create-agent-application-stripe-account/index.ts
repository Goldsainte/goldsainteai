import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('agent_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error("Application not found");
    }

    // Only proceed if admin_status is approved
    if (application.admin_status !== 'approved') {
      throw new Error("Application must be approved first");
    }

    // Check if Stripe account already exists
    if (application.stripe_connect_account_id) {
      // Return existing onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: application.stripe_connect_account_id,
        refresh_url: `${Deno.env.get("SITE_URL")}/stripe-connect/refresh`,
        return_url: `${Deno.env.get("SITE_URL")}/stripe-connect/complete`,
        type: 'account_onboarding',
      });

      return new Response(
        JSON.stringify({
          success: true,
          accountId: application.stripe_connect_account_id,
          onboardingUrl: accountLink.url,
          existing: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: application.business_country || 'US',
      email: application.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: application.business_type === 'sole_proprietor' ? 'individual' : 'company',
      business_profile: {
        name: application.agency_name || `${application.first_name} ${application.last_name}`,
        product_description: 'Travel advisory and booking services',
        support_email: application.email,
        url: application.website || undefined,
      },
      metadata: {
        goldsainte_application_id: applicationId,
        goldsainte_type: 'agent',
        application_email: application.email,
      },
    });

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get("SITE_URL")}/stripe-connect/refresh`,
      return_url: `${Deno.env.get("SITE_URL")}/stripe-connect/complete`,
      type: 'account_onboarding',
    });

    // Update application with Stripe Connect info
    await supabaseAdmin
      .from('agent_applications')
      .update({
        stripe_connect_account_id: account.id,
        stripe_connect_onboarding_url: accountLink.url,
        stripe_connect_created_at: new Date().toISOString(),
        stripe_connect_last_updated: new Date().toISOString(),
      })
      .eq('id', applicationId);

    // If auth account already created, also update profiles table
    if (application.created_user_id) {
      await supabaseAdmin
        .from('profiles')
        .update({
          stripe_connect_account_id: account.id,
        })
        .eq('id', application.created_user_id);
    }

    console.log(`Created Stripe Connect account ${account.id} for application ${applicationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        hint: error.code === 'connect_not_enabled' 
          ? 'Enable Stripe Connect in dashboard: https://dashboard.stripe.com/settings/connect'
          : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
