import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { enforceRateLimit } from "../_utils/rate-limit.ts";
import { buildSafeErrorResponse } from "../_shared/httpError.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY");
    if (!VIATOR_API_KEY) {
      throw new Error("VIATOR_API_KEY not configured");
    }

    const { q, location } = await req.json();
    
    // Build request body with only defined values
    const body: any = {
      topX: "1-20",
      sortOrder: "REVIEW_AVG_RATING_D",
      currency: "USD"
    };

    // Only include search parameters that have values
    if (q) body.searchTerm = q;
    if (location) body.destId = location;

    // Validate at least one search parameter exists
    if (!body.searchTerm && !body.destId) {
      return new Response(
        JSON.stringify({ 
          error: "At least one search parameter required: query (q) or location (destId)" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Viator API v2 search endpoint
    const viatorUrl = "https://api.viator.com/partner/products/search";

    const response = await fetch(viatorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json;version=2.0",
        "Accept-Language": "en-US",
        "exp-api-key": VIATOR_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Viator API error:", response.status, errorText);
      
      let errorMessage = `Viator API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        console.warn("Failed to parse Viator error payload", parseError);
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        results: data?.data || data?.products || [] 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return buildSafeErrorResponse("viator-search", error, corsHeaders);
  }
});