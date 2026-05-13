import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // Check for API key first
  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in Edge Function environment");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "RESEND_API_KEY is not configured in Edge Function secrets" 
      }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, template } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("✅ RESEND_API_KEY is set. Attempting to send test email to:", email);

    const SITE_URL = "https://goldsainte.com";
    const CONFIRMATION_URL = `${SITE_URL}/auth/confirm?token=SAMPLE_TEST_TOKEN_PREVIEW_ONLY`;

    const confirmationHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');
body{font-family:'Cormorant Garamond',Georgia,serif;margin:0;padding:0;background-color:#E5DFC6;}
.container{max-width:640px;margin:0 auto;background:#fff;}
.header{padding:24px;text-align:center;}
.logo{max-width:280px;height:auto;}
.hero-image{width:100%;height:200px;object-fit:cover;display:block;}
.content{padding:0 8px;}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:40px;font-weight:normal;color:#0c4d47;margin:32px 0 16px;padding:0 8px;}
p{font-size:16px;line-height:24px;color:#333;margin:16px 0;padding:0 8px;}
.button{display:inline-block;margin:32px 0;padding:16px 32px;background:#0c4d47;color:#fff !important;text-decoration:none;border-radius:4px;font-size:16px;font-weight:600;}
.info-box{border:1px solid #e7e7e7;border-radius:4px;padding:16px;margin:16px 8px;background:#f9f8f5;}
.steps-box{border:1px solid #e7e7e7;border-radius:4px;padding:16px;margin:24px 8px;background:#f9f8f5;}
.steps-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#0c4d47;margin-bottom:16px;}
.step{display:flex;align-items:flex-start;margin-bottom:12px;}
.step-number{flex-shrink:0;width:28px;height:28px;background:#0c4d47;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;margin-right:12px;margin-top:2px;}
.step-text{font-size:14px;line-height:20px;color:#333;}
.footer{background:#BFAD72;text-align:center;padding:24px;color:#0A2225;font-size:12px;margin-top:32px;}
</style></head><body><div class="container">
<div class="header"><img src="${SITE_URL}/logo-horizontal-green.png" alt="Goldsainte" class="logo"/></div>
<img src="${SITE_URL}/email-hero-password-reset.jpg" alt="Welcome" class="hero-image"/>
<div class="content">
<h1>Welcome to Goldsainte.</h1>
<p>Confirm your email address to activate your account and get started.</p>
<div style="text-align:center;"><a href="${CONFIRMATION_URL}" class="button">Confirm My Email</a></div>
<div class="info-box"><p style="margin:0;font-size:14px;color:#595959;">Or copy and paste this link into your browser:<br><a href="${CONFIRMATION_URL}" style="color:#0c4d47;word-break:break-all;">${CONFIRMATION_URL}</a></p></div>
<div class="steps-box"><div class="steps-title">What happens next</div>
<div class="step"><div class="step-number">1</div><div class="step-text">Click the button above to confirm your email address.</div></div>
<div class="step"><div class="step-number">2</div><div class="step-text">Your account will be activated and you'll be signed in automatically.</div></div>
<div class="step"><div class="step-number">3</div><div class="step-text">Browse curated trips across 50+ countries, planned by certified travel specialists.</div></div>
</div>
<h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#0c4d47;padding:0 8px;">Need Help?</h2>
<p>If you're having trouble confirming your email or have any questions, please contact our 24/7 Concierge Support Team.</p>
<p style="text-align:center;margin:32px 0;"><strong>Questions or concerns?</strong><br><span style="font-size:14px;color:#595959;">Contact Goldsainte Concierge Support<br>Available 24/7</span></p>
</div>
<div class="footer">
<p style="margin:0 0 8px;">Thank you for choosing Goldsainte</p>
<p style="margin:8px 0;font-size:11px;">Need assistance? Contact our 24/7 Concierge Support Team</p>
<p style="margin:0;font-size:11px;">This is an automated email. Please do not reply to this message.</p>
<p style="margin:12px 0 0;font-size:11px;">© 2026 Goldsainte. All rights reserved.</p>
</div></div></body></html>`;

    const isConfirmation = template === "confirmation";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: isConfirmation
          ? "Goldsainte <hello@goldsainte.com>"
          : "Goldsainte Security <security@goldsainte.com>",
        to: [email],
        subject: isConfirmation
          ? "[TEST] Confirm your email — Welcome to Goldsainte"
          : "Resend Test from Goldsainte",
        html: isConfirmation ? confirmationHtml : `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #0a2225; font-size: 24px;">✅ Resend is Working!</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              If you see this email, it means:
            </p>
            <ul style="color: #4a4a4a; font-size: 16px; line-height: 1.8;">
              <li>The RESEND_API_KEY is valid</li>
              <li>The sending domain (goldsainte.ai) is verified</li>
              <li>Resend is successfully delivering emails</li>
            </ul>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              — Goldsainte Test Function
            </p>
          </div>
        `,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      console.error("❌ Resend API error:", body);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: body.message || "Resend API error",
          details: body 
        }),
        { status: res.status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Test email sent successfully:", body);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully",
        resend_response: body 
      }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error in test-resend function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
