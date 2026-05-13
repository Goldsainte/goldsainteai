import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const BOT_UA_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|skypeuripreview|applebot|pinterestbot|redditbot|embedly|quora link preview|outbrain|vkshare|w3c_validator|chrome-lighthouse|headlesschrome|duckduckbot|baiduspider|yandex|bingbot|googlebot|ahrefsbot|semrushbot|mj12bot|petalbot|gptbot|ccbot|claudebot|perplexitybot/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  try {
    const { kind, id } = await req.json();
    if (!id || !["trip", "product"].includes(kind)) {
      return new Response(JSON.stringify({ error: "invalid params" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA_RE.test(ua)) {
      return new Response(JSON.stringify({ ok: true, bot: true }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    const ipHash = await sha256Hex(`${ip}|${Deno.env.get("SUPABASE_URL") ?? ""}`);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Atomic: dedup insert + view-count increment in one DB transaction.
    // Returns true only when a NEW view was recorded today.
    const { data: wasNew, error } = await admin.rpc("track_view_atomic", {
      _kind: kind,
      _entity_id: id,
      _ip_hash: ipHash,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, deduped: !wasNew }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-view error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});