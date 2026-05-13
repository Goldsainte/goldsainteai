import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const { agentEmail, agentName } = await req.json();
    if (!agentEmail) {
      return new Response(JSON.stringify({ error: "agentEmail required" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured; skipping send.");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f3ea; color: #0a2225;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Your application has been received</h1>
        <p style="font-size: 15px; line-height: 1.6;">Hi ${agentName || "there"},</p>
        <p style="font-size: 15px; line-height: 1.6;">Thank you for applying to join the <em>Goldsainte</em> advisor network. We've received your application and our team will review it within <strong>24–48 hours</strong>.</p>
        <p style="font-size: 15px; line-height: 1.6;">You'll receive another email as soon as your account is approved, with credentials to access your dashboard.</p>
        <p style="margin: 28px 0;">
          <a href="https://goldsainte.ai/application-status" style="display: inline-block; background: #0c4d47; color: #E5DFC6; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Check Application Status</a>
        </p>
        <p style="font-size: 13px; color: #6B7280;">Questions? Reply to this email or visit our Help Centre.</p>
        <hr style="border: none; border-top: 1px solid #E5DFC6; margin: 32px 0;" />
        <p style="font-size: 11px; color: #9A9079;">© 2026 Goldsainte. The smarter travel marketplace.</p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte <hello@goldsainte.com>",
        to: agentEmail,
        subject: "Your Goldsainte advisor application has been received",
        html,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: resp.ok ? 200 : 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});