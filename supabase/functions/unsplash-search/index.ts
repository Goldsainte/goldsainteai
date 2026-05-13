import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { enforceRateLimit } from "../_utils/rate-limit.ts";
import { buildSafeErrorResponse } from "../_shared/httpError.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Rate limiting
  const limited = await enforceRateLimit({
    keyType: "api",
    req,
    corsHeaders,
  });
  if (limited) return limited;

  try {
    const UNSPLASH_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY not configured");
    }

    const { q, page = 1 } = await req.json();
    
    if (!q || !q.trim()) {
      return new Response(
        JSON.stringify({ error: "Search query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", q);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "20");
    url.searchParams.set("orientation", "portrait");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ results: data.results || [] }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return buildSafeErrorResponse("unsplash-search", error, corsHeaders);
  }
});