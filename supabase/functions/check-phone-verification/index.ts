import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ verified: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ verified: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { phone, code } = await req.json();

    // Validate inputs
    if (!phone || !code) {
      return new Response(
        JSON.stringify({ verified: false, error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ verified: false, error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ verified: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Check verification code via Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        Code: code,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok || twilioData.status !== "approved") {
      console.log(`Verification failed for ${phone}: ${twilioData.status}`);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: twilioData.status === "pending" ? "Invalid code" : "Verification failed or expired"
        }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Update user profile with verified phone
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ 
        phone: phone,
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ verified: false, error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`Phone ${phone} verified successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: "Phone verified successfully"
      }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-phone-verification:", error);
    return new Response(
      JSON.stringify({ verified: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
