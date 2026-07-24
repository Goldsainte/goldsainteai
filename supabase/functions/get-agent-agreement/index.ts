import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// ═══════════════════════════════════════════════════════════════════════════
// get-agent-agreement — Phase 1 of the agreement gate (Jul 24 2026).
//
// The proposal card asks: "does this agent have a client agreement, and
// where is it?" The base travel_agents table isn't readable by travelers
// and the public view doesn't expose the column, so this function reads it
// with the service role and returns only two public facts: the agreement's
// public URL and the agent's display name. The document itself is the
// agent's own client-facing terms — the kind agencies publish openly — so
// there is nothing sensitive here; this function exists purely to avoid
// widening table-level read policies.
// ═══════════════════════════════════════════════════════════════════════════

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  try {
    const { agentId } = await req.json();
    if (!agentId || typeof agentId !== "string") {
      return new Response(JSON.stringify({ error: "agentId is required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data } = await supabase
      .from("travel_agents")
      .select("client_agreement_url, agency_name")
      .eq("user_id", agentId)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        url: (data as { client_agreement_url?: string | null } | null)
          ?.client_agreement_url ?? null,
        name:
          (data as { agency_name?: string | null } | null)?.agency_name ||
          "your travel professional",
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
