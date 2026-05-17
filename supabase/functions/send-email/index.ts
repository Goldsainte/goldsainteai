import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (!resendApiKey) throw new Error('Missing RESEND_API_KEY');
    if (!hookSecret) throw new Error('Missing SEND_EMAIL_HOOK_SECRET');

    const payloadText = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);

    const evt = wh.verify(payloadText, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string // e.g., recovery, signup, magiclink
      }
    };

    const { user, email_data } = evt;
    const { token_hash, redirect_to, email_action_type } = email_data;

    // Only handle password recovery here
    if (email_action_type !== 'recovery') {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirect_to)}`;

    const heroUrl = `${Deno.env.get('SITE_URL') || ''}/email-hero-password-reset.jpg`; // fallback to app domain asset
    const logoUrl = `${Deno.env.get('SITE_URL') || ''}/logo-horizontal-green.png`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
    body { font-family: 'Gupter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin:0; padding:0; background:#E5DFC6; }
    .container { max-width:640px; margin:0 auto; background:#fff; }
    .header { padding:24px; text-align:center; }
    .logo { max-width:280px; height:auto; }
    .hero { width:100%; height:200px; object-fit:cover; display:block; }
    .content { padding:0 8px; }
    h1 { font-family:'Chiffon', serif; font-size:32px; line-height:40px; color:#0c4d47; font-weight:400; margin:32px 0 16px; padding:0 8px; }
    p { font-size:16px; line-height:24px; color:#333; margin:16px 0; padding:0 8px; }
    .btn { display:inline-block; margin:32px 0; padding:16px 32px; background:#0c4d47; color:#fff !important; text-decoration:none; border-radius:4px; font-size:16px; font-weight:600; }
    .box { border:1px solid #e7e7e7; border-radius:4px; padding:16px; margin:16px 8px; background:#f9f8f5; }
    .warn { border:1px solid #FFE08A; background:#FEFBF0; border-radius:4px; padding:16px; margin:24px 8px; }
    .footer { background:#BFAD72; text-align:center; padding:24px; color:#0A2225; font-size:12px; margin-top:32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Goldsainte" class="logo" />
    </div>
    <img src="${heroUrl}" alt="Password Reset" class="hero" />
    <div class="content">
      <h1>🔐 Password Reset Request</h1>
      <p>We received a request to reset your Goldsainte account password.</p>
      <p>To reset your password, click the button below. This link will expire in 1 hour for security purposes.</p>
      <div style="text-align:center;">
        <a class="btn" href="${resetLink}">Reset Your Password</a>
      </div>
      <div class="box">
        <p style="margin:0; font-size:14px; color:#595959;">Or copy and paste this link into your browser:<br /><a href="${resetLink}" style="color:#0c4d47; word-break:break-all;">${resetLink}</a></p>
      </div>
      <div class="warn">
        <div style="font-size:16px; font-weight:600; color:#333; margin-bottom:8px;">🛡️ Security Notice</div>
        <div style="font-size:14px; line-height:20px; color:#333;">
          <strong>Did not request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.<br /><br />
          <strong>Keep your account secure:</strong> Never share your password with anyone. Goldsainte will never ask you for your password via email or phone.
        </div>
      </div>
      <p style="text-align:center; margin:32px 0;"><strong>Questions or concerns?</strong><br /><span style="font-size:14px; color:#595959;">Contact Goldsainte Concierge Support • Available 24/7</span></p>
    </div>
    <div class="footer">
      <p style="margin:0 0 8px;">Thank you for choosing Goldsainte</p>
      <p style="margin:8px 0; font-size:11px;">This is an automated security email. Please do not reply to this message.</p>
      <p style="margin:12px 0 0; font-size:11px;">© 2025 Goldsainte. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Goldsainte Security <hello@goldsainte.com>',
        to: [user.email],
        subject: 'Reset Your Goldsainte Password',
        html,
      }),
    });

    const data = await sendRes.json();
    console.log('Custom recovery email sent:', data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('send-email error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});