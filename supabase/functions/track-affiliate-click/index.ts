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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  try {
    const { ref } = await req.json();
    if (!ref || typeof ref !== "string") {
      return new Response(JSON.stringify({ error: "ref required" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Resolve caller's user_id from the JWT if present (anonymous calls allowed).
    let callerUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { data: { user } } = await admin.auth.getUser(
          authHeader.slice("Bearer ".length),
        );
        callerUserId = user?.id ?? null;
      } catch (_) {
        callerUserId = null;
      }
    }
    const { data: link } = await admin
      .from("affiliate_links")
      .select("id, creator_id")
      .eq("affiliate_code", ref)
      .eq("is_active", true)
      .maybeSingle();
    if (!link) {
      return new Response(JSON.stringify({ ok: true, matched: false }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    // Block self-referral: a creator cannot earn off their own click.
    if (callerUserId && callerUserId === link.creator_id) {
      console.log("[track-affiliate-click] self-referral blocked", {
        callerUserId,
        affiliateCode: ref,
      });
      return new Response(
        JSON.stringify({ ok: true, matched: false, reason: "self_referral" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const ua = req.headers.get("user-agent") || null;
    await admin.from("affiliate_clicks").insert({
      affiliate_link_id: link.id,
      user_id: callerUserId,
      ip_address: ip,
      user_agent: ua,
    });
    await admin
      .from("affiliate_links")
      .update({ clicks: ((await admin.from("affiliate_links").select("clicks").eq("id", link.id).single()).data?.clicks ?? 0) + 1 })
      .eq("id", link.id);
    return new Response(JSON.stringify({ ok: true, matched: true }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-affiliate-click error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});