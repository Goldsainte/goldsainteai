import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const { user_id, tier, previous_tier, commission_rate } = await req.json();
    if (!user_id || !tier || !TIER_LABEL[tier]) {
      return new Response(JSON.stringify({ error: "invalid params" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Look up email + name
    const { data: authUser } = await admin.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", user_id)
      .maybeSingle();
    const name = (profile?.display_name || profile?.full_name || "there").split(" ")[0];

    if (!email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email" }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ ok: true, skipped: "no resend key" }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const tierLabel = TIER_LABEL[tier];
    const subject = `🎉 You've reached ${tierLabel} on Goldsainte`;

    // In-app notification (best-effort; do not block email if it fails)
    try {
      await admin.from("notifications").insert({
        user_id,
        type: "tier_upgrade",
        title: `You've reached ${tierLabel}`,
        message: previous_tier
          ? `Congrats! You've been promoted from ${TIER_LABEL[previous_tier] || previous_tier} to ${tierLabel}. Your new commission rate is ${commission_rate}%.`
          : `Congrats! You've reached the ${tierLabel} tier. Your new commission rate is ${commission_rate}%.`,
        entity_type: "tier",
        action_url: "/creator/dashboard",
        action_label: "View dashboard",
        priority: "high",
        sent_via_email: true,
      });
    } catch (notifErr) {
      console.error("Failed to insert tier upgrade notification", notifErr);
    }

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0a2225; background: #f7f3ea;">
        <h1 style="font-size: 24px; margin: 0 0 12px;">Congratulations, ${name} 🎉</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          You've just been promoted to the <strong>${tierLabel}</strong> creator tier${
            previous_tier ? ` (up from ${TIER_LABEL[previous_tier] || previous_tier})` : ""
          }.
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          Your new platform commission rate is <strong>${commission_rate}%</strong>, effective immediately on all future sales.
        </p>
        <p style="font-size: 14px; color: #6B7280; margin-top: 24px;">
          Keep crafting incredible storyboards — we're cheering you on.
        </p>
        <p style="font-size: 14px; margin-top: 24px;">— The Goldsainte Team</p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte <noreply@goldsainte.ai>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Resend error", resp.status, txt);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-tier-upgrade error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});