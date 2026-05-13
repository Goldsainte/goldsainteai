import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface SubscriptionEmailRequest {
  email: string;
  type: 'upgrade' | 'downgrade' | 'expiring' | 'renewed';
  newTier?: string;
  oldTier?: string;
  expirationDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, type, newTier, oldTier, expirationDate }: SubscriptionEmailRequest = await req.json();

    let subject = "";
    let html = "";

    const logoUrl = `${Deno.env.get('SITE_URL') || ''}/logo-horizontal-green.png`;

    switch (type) {
      case 'upgrade':
        subject = `🎉 Subscription Upgraded to ${newTier?.toUpperCase()}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .badge { display:inline-block; padding:8px 16px; background:#0c4d47; color:#fff; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>🎉 You've Upgraded!</h1>
                <p>Great news! Your subscription has been upgraded.</p>
                <p><strong>Previous Plan:</strong> ${oldTier?.toUpperCase() || 'Free'}</p>
                <div class="badge">${newTier?.toUpperCase()} PLAN</div>
                <p>You now have access to all ${newTier} features. Thank you for choosing Goldsainte!</p>
                <p>If you have any questions, our support team is here to help.</p>
              </div>
              <div class="footer">
                <p>© 2025 Goldsainte. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'downgrade':
        subject = `Subscription Changed to ${newTier?.toUpperCase()}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .badge { display:inline-block; padding:8px 16px; background:#BFAD72; color:#0A2225; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>Subscription Updated</h1>
                <p>Your subscription has been changed.</p>
                <p><strong>Previous Plan:</strong> ${oldTier?.toUpperCase()}</p>
                <div class="badge">${newTier?.toUpperCase()} PLAN</div>
                <p>Your new plan is now active. You can upgrade again anytime from your account settings.</p>
                <p>Thank you for being part of Goldsainte.</p>
              </div>
              <div class="footer">
                <p>© 2025 Goldsainte. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'expiring':
        subject = `⏰ Your Subscription Expires Soon`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .warning { background:#FFF4E5; border-left:4px solid:#FFE08A; padding:16px; margin:24px 0; border-radius:4px; }
              .btn { display:inline-block; padding:14px 28px; background:#0c4d47; color:#fff !important; text-decoration:none; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>⏰ Subscription Expiring Soon</h1>
                <div class="warning">
                  <p style="margin:0;"><strong>Your ${newTier?.toUpperCase() || 'subscription'} plan expires on ${new Date(expirationDate || '').toLocaleDateString()}</strong></p>
                </div>
                <p>Don't lose access to your premium features!</p>
                <p>Renew your subscription to continue enjoying:</p>
                <ul style="font-size:16px; line-height:28px; color:#333;">
                  <li>Premium travel planning tools</li>
                  <li>Exclusive content and features</li>
                  <li>Priority support</li>
                </ul>
                <div style="text-align:center; margin:32px 0;">
                  <a class="btn" href="${Deno.env.get('SITE_URL')}/subscription">Renew Subscription</a>
                </div>
              </div>
              <div class="footer">
                <p>© 2025 Goldsainte. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'renewed':
        subject = `✅ Subscription Renewed Successfully`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .success { background:#E8F5E9; border-left:4px solid:#4CAF50; padding:16px; margin:24px 0; border-radius:4px; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>✅ Subscription Renewed</h1>
                <div class="success">
                  <p style="margin:0;"><strong>Your ${newTier?.toUpperCase() || 'subscription'} has been renewed successfully!</strong></p>
                </div>
                <p>Thank you for continuing your journey with Goldsainte.</p>
                <p>Your premium features remain active and ready to use.</p>
              </div>
              <div class="footer">
                <p>© 2025 Goldsainte. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Goldsainte <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Subscription email sent:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      }
    );
  }
};

serve(handler);
