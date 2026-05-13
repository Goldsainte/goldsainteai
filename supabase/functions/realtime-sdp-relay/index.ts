import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { sdp, token, model } = await req.json();
    
    if (!sdp || !token) {
      throw new Error("Missing sdp or token");
    }
    
    const useModel = model || "gpt-4o-realtime-preview-2024-12-17";
    
    console.log(`Relaying SDP to OpenAI Realtime API (model: ${useModel})`);

    const resp = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(useModel)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/sdp",
          "Accept": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
        body: sdp,
      }
    );

    const text = await resp.text();
    
    if (!resp.ok) {
      console.error(`OpenAI API error: ${resp.status}`, text);
      return new Response(
        JSON.stringify({ upstreamStatus: resp.status, upstreamBody: text }),
        {
          status: 502,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Successfully relayed SDP exchange");
    
    return new Response(text, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Relay error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
