import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationType, applicationId } = await req.json();

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
    const { data: application, error: appError } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if account already created
    if (application.user_account_created) {
      return new Response(
        JSON.stringify({ error: "Account already created" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = applicationType === 'agent' ? application.email : application.primary_contact_email;
    const temporaryPassword = generateTemporaryPassword();

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        account_type: applicationType,
        application_id: applicationId,
        full_name: applicationType === 'agent' 
          ? `${application.first_name} ${application.last_name}`
          : application.primary_contact_name,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: "Could not create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe Connect account for agents
    let stripeOnboardingUrl = null;
    if (applicationType === 'agent') {
      try {
        const stripeResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/create-agent-application-stripe-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ applicationId }),
          }
        );
        
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          stripeOnboardingUrl = stripeData.onboardingUrl;
        } else {
          console.error('Failed to create Stripe Connect account');
        }
      } catch (stripeError) {
        console.error('Error calling Stripe Connect function:', stripeError);
      }
    }

    // Update application
    await supabaseAdmin
      .from(tableName)
      .update({
        user_account_created: true,
        created_user_id: authData.user.id,
        account_created_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        account_type: applicationType,
        email,
        onboarding_completed: true,
      })
      .eq("id", authData.user.id);

    // For brands, create brand_profile
    if (applicationType === 'brand') {
      const { data: brandProfile } = await supabaseAdmin
        .from("brand_profiles")
        .insert({
          owner_user_id: authData.user.id,
          brand_name: application.brand_name,
          brand_type: application.brand_type,
        })
        .select()
        .single();

      if (brandProfile) {
        await supabaseAdmin
          .from(tableName)
          .update({
            brand_profile_created: true,
            created_brand_profile_id: brandProfile.id,
          })
          .eq("id", applicationId);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        temporaryPassword,
        stripeOnboardingUrl,
        message: "Account created successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in create-approved-account:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
