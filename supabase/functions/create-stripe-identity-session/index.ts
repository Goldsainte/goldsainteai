import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_API_BASE = "https://api.stripe.com/v1";
const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Optional auth check - allow anonymous applications
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id || null;
    }

    const { email, firstName, lastName, applicationType, applicationId } = await req.json();

    if (!email || !firstName || !lastName || !applicationType) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: email, firstName, lastName, applicationType" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify application exists if provided
    if (applicationId) {
      const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
      const { data: application, error: appError } = await supabaseAdmin
        .from(tableName)
        .select("id, stripe_verification_session_id")
        .eq("id", applicationId)
        .maybeSingle();

      if (appError) {
        console.error("Error loading application:", appError);
      }
    }

    // Create Stripe Identity verification session with all security features
    const formData = new URLSearchParams();
    formData.append("type", "document");
    
    // Document verification options
    formData.append("options[document][allowed_types][]", "driving_license");
    formData.append("options[document][allowed_types][]", "passport");
    formData.append("options[document][allowed_types][]", "id_card");
    formData.append("options[document][require_matching_selfie]", "true");
    formData.append("options[document][require_live_capture]", "true");
    
    // Metadata - use email as primary identifier
    formData.append("metadata[email]", email);
    formData.append("metadata[name]", `${firstName} ${lastName}`);
    formData.append("metadata[application_type]", applicationType);
    if (applicationId) {
      formData.append("metadata[application_id]", applicationId);
    }
    // Only add user_id if authenticated
    if (userId) {
      formData.append("metadata[user_id]", userId);
    }
    
    // Return URL after verification completes
    formData.append("return_url", `${APP_URL}/application/verification-complete?type=${applicationType}`);

    const stripeRes = await fetch(`${STRIPE_API_BASE}/identity/verification_sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!stripeRes.ok) {
      const text = await stripeRes.text();
      console.error("Stripe Identity error", text);
      return new Response(
        JSON.stringify({ error: "Stripe verification setup failed" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripeRes.json();

    // Save session ID to application if applicationId provided
    if (applicationId) {
      const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({
          stripe_verification_session_id: session.id,
          stripe_verification_status: "pending",
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("Error updating application with verification session", updateError);
      }
    }

    // Don't update profile - it doesn't exist yet for anonymous applicants
    // Profile will be created after admin approval

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        clientSecret: session.client_secret,
        status: session.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in create-stripe-identity-session", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error creating verification session" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
