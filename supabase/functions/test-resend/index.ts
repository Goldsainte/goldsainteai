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

    const SITE_URL = "https://goldsainte.ai";
    const LOGO_URL = "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";
    const CONFIRMATION_URL = `${SITE_URL}/auth/confirm?token=SAMPLE_TEST_TOKEN_PREVIEW_ONLY`;

    const confirmationHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirm your email — Goldsainte</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');
body{margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;-webkit-font-smoothing:antialiased;}
a{color:#0c4d47;}
.outer{width:100%;background:#f7f3ea;padding:48px 16px;}
.container{max-width:560px;margin:0 auto;background:#f7f3ea;}
.brand{text-align:center;padding:8px 0 40px;}
.brand img{height:22px;width:auto;display:inline-block;max-width:240px;}
.rule{border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 40px;}
.eyebrow{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7a3f;margin:0 0 18px;text-align:center;}
h1{font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#0a2225;margin:0 0 24px;text-align:center;letter-spacing:-0.01em;}
.lede{font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 36px;text-align:center;}
.tagline{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6E6650;font-style:italic;text-align:center;max-width:480px;margin:-12px auto 28px;}
.cta-wrap{text-align:center;margin:0 0 28px;}
.cta{display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;}
.fallback{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;}
.fallback a{color:#0c4d47;word-break:break-all;text-decoration:underline;opacity:0.8;}
.divider{border:0;border-top:1px solid rgba(10,34,37,0.12);margin:40px 0;}
.section-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:400;color:#0a2225;margin:0 0 20px;text-align:center;}
.steps{margin:0 0 16px;padding:0;list-style:none;}
.steps li{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a2225;opacity:0.8;padding:14px 0;border-bottom:1px solid rgba(10,34,37,0.08);display:flex;gap:18px;}
.steps li:last-child{border-bottom:0;}
.num{font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#8a7a3f;font-size:18px;flex-shrink:0;width:22px;}
.help{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;}
.security{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.7;color:#0a2225;opacity:0.65;text-align:center;margin:20px 0 0;font-style:italic;}
.site-footer{background:#FDF9F0;border-top:1px solid #E5DFC6;margin-top:56px;padding:36px 24px 24px;text-align:center;}
.flogo{padding:0 0 18px;}
.flogo img{height:24px;width:auto;max-width:200px;}
.fdesc{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6650;max-width:440px;margin:0 auto 22px;line-height:1.6;}
.fnav{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#0a2225;line-height:2.2;padding:18px 0;border-top:1px solid #E5DFC6;border-bottom:1px solid #E5DFC6;margin-bottom:18px;}
.fnav a{color:#0a2225;text-decoration:none;margin:0 10px;white-space:nowrap;}
.fsocial{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9A9079;margin-bottom:14px;}
.fsocial a{color:#0a2225;text-decoration:none;margin:0 8px;}
.flegal{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9A9079;line-height:1.8;margin:0 0 8px;}
.flegal a{color:#9A9079;text-decoration:none;margin:0 4px;}
.fauto{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;padding:8px 0 0;text-transform:uppercase;}
@media (max-width:480px){h1{font-size:30px;}.outer{padding:32px 12px;}}
</style></head>
<body><div class="outer"><div class="container">
  <div class="brand"><img src="${LOGO_URL}" alt="Goldsainte" /></div>
  <hr class="rule"/>
  <p class="eyebrow">Confirm your email</p>
  <h1>Welcome to Goldsainte.</h1>
  <p class="tagline">A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands.</p>
  <p class="lede">Confirm your email address to activate your account and begin curating your journey.</p>
  <div class="cta-wrap"><a href="${CONFIRMATION_URL}" class="cta">Confirm my email</a></div>
  <p class="fallback">Or paste this link into your browser:<br/><a href="${CONFIRMATION_URL}">${CONFIRMATION_URL}</a></p>
  <hr class="divider"/>
  <p class="section-title">What happens next</p>
  <ul class="steps">
    <li><span class="num">I.</span><span>Confirm your email to activate your account and secure your profile.</span></li>
    <li><span class="num">II.</span><span>You'll be signed in automatically and guided to your personal concierge dashboard.</span></li>
    <li><span class="num">III.</span><span>Complete your traveler profile so our specialists can tailor recommendations to your taste.</span></li>
    <li><span class="num">IV.</span><span>Browse curated trips across 50+ countries, designed by certified specialists and trusted creators.</span></li>
    <li><span class="num">V.</span><span>Request a trip or book directly — every reservation is protected on-platform from inquiry to return.</span></li>
  </ul>
  <p class="help">If you have any questions, concerns, or require assistance, please do not hesitate to contact <a href="${SITE_URL}/corporate-contact">Goldsainte Support</a>.</p>
  <p class="security">Goldsainte will never email you and ask you to disclose or verify your password, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link. Instead, report the e-mail to Goldsainte for investigation.</p>
</div>
<div class="site-footer">
  <div class="fnav">
    <a href="${SITE_URL}/marketplace">Browse Trips</a>·
    <a href="${SITE_URL}/agents">Specialists</a>·
    <a href="${SITE_URL}/about">About</a>·
    <a href="${SITE_URL}/help">Help</a>·
    <a href="${SITE_URL}/trust-safety">Trust &amp; Safety</a>·
    <a href="${SITE_URL}/corporate-contact">Contact</a>
  </div>
  <div class="fsocial">Follow &nbsp;<a href="https://www.linkedin.com/company/goldsainte/">LinkedIn</a>·<a href="https://www.instagram.com/goldsainteai/">Instagram</a></div>
  <p class="flegal">
    <a href="${SITE_URL}/privacy-cookies">Privacy</a>·
    <a href="${SITE_URL}/terms">Terms</a>·
    <a href="${SITE_URL}/dispute-resolution">Disputes</a>
    <br/>© 2026 Goldsainte AI Inc. All rights reserved.
  </p>
  <p class="fauto">This is an automated message — please do not reply.</p>
</div>
</div></body></html>`;

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
