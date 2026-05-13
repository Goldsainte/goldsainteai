import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentEmail, agentName, tripTitle, tripId } = await req.json();
    if (!agentEmail) {
      return new Response(JSON.stringify({ error: "agentEmail required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f3ea; color: #0a2225;">
        <h1 style="font-size: 22px; color: #0a2225; margin: 0 0 16px;">Trip submitted for review</h1>
        <p style="font-size: 15px; line-height: 1.6;">Hi ${agentName || "there"},</p>
        <p style="font-size: 15px; line-height: 1.6;">We've received your listing for <strong>${tripTitle || "your trip"}</strong> and it's now under review. Our team typically reviews new listings within 24–48 hours.</p>
        <p style="font-size: 15px; line-height: 1.6;">You'll receive another email as soon as your listing is approved and live on the marketplace.</p>
        <p style="margin: 28px 0;">
          <a href="https://goldsainte.ai/agent-dashboard" style="display: inline-block; background: #0c4d47; color: #E5DFC6; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">View My Listings</a>
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
        from: "Goldsainte <hello@goldsainte.ai>",
        to: agentEmail,
        subject: `Your trip listing is under review — ${tripTitle || "Your trip"}`,
        html,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: resp.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-agent-submission-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});