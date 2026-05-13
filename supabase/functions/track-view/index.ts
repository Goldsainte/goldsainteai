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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    const ipHash = await sha256Hex(`${ip}|${Deno.env.get("SUPABASE_URL") ?? ""}`);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // DB-backed dedup: one view per (ip_hash, kind, entity_id, day).
    // ON CONFLICT DO NOTHING — if no row inserted, this is a duplicate view today.
    const { data: inserted, error: dedupErr } = await admin
      .from("view_dedup")
      .insert({ ip_hash: ipHash, kind, entity_id: id })
      .select("ip_hash")
      .maybeSingle();

    if (dedupErr && dedupErr.code !== "23505") throw dedupErr;
    if (!inserted || dedupErr?.code === "23505") {
      return new Response(JSON.stringify({ ok: true, deduped: true }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const fn = kind === "trip" ? "increment_trip_view" : "increment_product_view";
    const param = kind === "trip" ? { _trip_id: id } : { _product_id: id };
    const { error } = await admin.rpc(fn, param);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
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