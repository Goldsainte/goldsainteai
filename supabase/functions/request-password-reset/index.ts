import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

    // Send branded email using Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
            @font-face {
              font-family: 'Chiffon';
              src: url('https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/Chiffon.otf') format('opentype');
            }
            body {
              font-family: 'Gupter', BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #E5DFC6;
            }
            .container {
              max-width: 640px;
              margin: 0 auto;
              background: #ffffff;
            }
            .header {
              background: transparent;
              padding: 24px;
              text-align: center;
            }
            .logo {
              max-width: 280px;
              height: auto;
            }
            .hero-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              object-position: center center;
              display: block;
            }
            .content {
              padding: 0 8px;
            }
            h1 {
              font-family: 'Chiffon', serif;
              font-size: 32px;
              line-height: 40px;
              font-weight: normal;
              color: #0c4d47;
              margin: 32px 0 16px 0;
              padding: 0 8px;
            }
            h2 {
              font-family: 'Chiffon', serif;
              font-size: 22px;
              line-height: 28px;
              font-weight: normal;
              color: #0c4d47;
              margin: 16px 0;
              padding: 0 8px;
            }
            p {
              font-size: 16px;
              line-height: 24px;
              color: #333333;
              margin: 16px 0;
              padding: 0 8px;
            }
            .button {
              display: inline-block;
              margin: 32px 0;
              padding: 16px 32px;
              background: #0c4d47;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              font-size: 16px;
              font-weight: 600;
              text-align: center;
            }
            .button:hover {
              background: #0a3d38;
            }
            .info-box {
              border: 1px solid #e7e7e7;
              border-radius: 4px;
              padding: 16px;
              margin: 16px 8px;
              background: #f9f8f5;
            }
            .security-notice {
              border: 1px solid #FFE08A;
              background: #FEFBF0;
              border-radius: 4px;
              padding: 16px;
              margin: 24px 8px;
            }
            .security-notice-title {
              font-size: 16px;
              font-weight: 600;
              color: #333333;
              margin-bottom: 8px;
            }
            .security-notice-text {
              font-size: 14px;
              line-height: 20px;
              color: #333333;
            }
            .footer {
              background: #BFAD72;
              text-align: center;
              padding: 24px;
              color: #0A2225;
              font-size: 12px;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
            </div>
            
            <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/email-hero-password-reset.jpg" alt="Password Reset" class="hero-image" />
            
            <div class="content">
              <h1>🔐 Password Reset Request</h1>
              
              <p>We received a request to reset your Goldsainte account password.</p>
              
              <p>To reset your password, click the button below. This link will expire in 1 hour for security purposes.</p>
              
              <div style="text-align: center;">
                <a href="${appResetUrl.toString()}" class="button">Reset Your Password</a>
              </div>
              
              <div class="info-box">
                <p style="margin: 0; font-size: 14px; color: #595959;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${appResetUrl.toString()}" style="color: #0c4d47; word-break: break-all;">${appResetUrl.toString()}</a>
                </p>
              </div>
              
              <div class="security-notice">
                <div class="security-notice-title">🛡️ Security Notice</div>
                <div class="security-notice-text">
                  <strong>Did not request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.<br><br>
                  <strong>Keep your account secure:</strong> Never share your password with anyone. Goldsainte will never ask you for your password via email or phone.<br><br>
                  <strong>Link expires:</strong> This password reset link will expire in 1 hour. After that, you'll need to request a new one.
                </div>
              </div>
              
              <h2>Need Help?</h2>
              
              <p>If you're having trouble resetting your password or have security concerns, please contact our 24/7 Concierge Support Team. We're here to help keep your account secure.</p>
              
              <p style="text-align: center; margin: 32px 0;">
                <strong>Questions or concerns?</strong><br>
                <span style="font-size: 14px; color: #595959;">Contact Goldsainte Concierge Support<br>Available 24/7</span>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 8px 0;">Thank you for choosing Goldsainte</p>
              <p style="margin: 8px 0; font-size: 11px;">Need assistance? Contact our 24/7 Concierge Support Team</p>
              <p style="margin: 0; font-size: 11px;">This is an automated security email. Please do not reply to this message.</p>
              <p style="margin: 12px 0 0 0; font-size: 11px;">© 2025 Goldsainte. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte Security <hello@goldsainte.com>",
        to: [email],
        subject: "Reset Your Goldsainte Password",
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
