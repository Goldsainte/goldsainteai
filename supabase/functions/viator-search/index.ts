import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY");
    if (!VIATOR_API_KEY) {
      throw new Error("VIATOR_API_KEY not configured");
    }

    const { q, location } = await req.json();
    
    if (!q && !location) {
      return new Response(
        JSON.stringify({ error: "Query or location required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Viator API v2 search endpoint
    const viatorUrl = "https://api.viator.com/partner/products/search";
    
    const body = {
      searchTerm: q,
      destId: location,
      topX: "1-20",
      sortOrder: "REVIEW_AVG_RATING_D",
      currency: "USD"
    };

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
      } catch {}
      
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
    console.error("viator-search error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});