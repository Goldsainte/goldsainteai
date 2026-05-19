import "../_shared/resend-guard.ts";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_NAME = "goldsainteai";
const PASSWORD_RESET_SENDER = "goldsainteai <noreply@notify.goldsainte.com>";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // === Environment sanity checks ===
  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in the Edge Function environment");
    return new Response(
      JSON.stringify({ error: "Email service is not configured (RESEND_API_KEY missing)." }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Edge Function env");
    return new Response(
      JSON.stringify({ error: "Auth service is not configured correctly." }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, redirectTo } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log("✅ Environment OK. Generating password reset link for:", email);

    // Generate recovery link using Supabase Admin API
    const generateLinkResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/generate_link`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "recovery",
          email: email,
          options: {
            redirect_to: redirectTo || 'https://goldsainte.ai/reset-password',
          },
        }),
      }
    );

    if (!generateLinkResponse.ok) {
      const errorData = await generateLinkResponse.json().catch(() => null);
      console.error("❌ Failed to generate recovery link:", errorData || generateLinkResponse.statusText);
      throw new Error(
        errorData?.message || `Failed to generate recovery link (status ${generateLinkResponse.status})`
      );
    }

    const { action_link } = await generateLinkResponse.json();
    const actionUrl = new URL(action_link);
    const tokenHash = actionUrl.searchParams.get('token');
    const recoveryType = actionUrl.searchParams.get('type') || 'recovery';

    if (!tokenHash) {
      throw new Error('Failed to generate a valid recovery token');
    }

    const appResetUrl = new URL(redirectTo || 'https://goldsainte.ai/reset-password');
    appResetUrl.searchParams.set('token_hash', tokenHash);
    appResetUrl.searchParams.set('type', recoveryType);

    console.log("Recovery link generated successfully");

    const emailHtml = await renderAsync(
      React.createElement(RecoveryEmail, {
        siteName: SITE_NAME,
        confirmationUrl: appResetUrl.toString(),
      })
    );
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: PASSWORD_RESET_SENDER,
        to: [email],
        subject: "Reset your Goldsainte password",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => null);
      console.error("❌ Failed to send email via Resend:", errorData || emailResponse.statusText);
      throw new Error(
        errorData?.message || `Failed to send email (Resend status ${emailResponse.status})`
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Password reset email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
