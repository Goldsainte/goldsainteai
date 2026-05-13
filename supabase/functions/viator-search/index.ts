import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildSafeErrorResponse } from "../_shared/httpError.ts";
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

    // Include search term if provided
    if (q) body.searchTerm = q;
    
    // Include location as searchTerm if no query provided (destination-based search)
    // Or combine both if both provided
    if (location) {
      if (!body.searchTerm) {
        body.searchTerm = location;
      } else {
        body.searchTerm = `${body.searchTerm} ${location}`;
      }
    }

    // Validate we have something to search for
    if (!body.searchTerm) {
      return new Response(
        JSON.stringify({ 
          error: "At least one search parameter required: query (q) or location" 
        }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
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
        { status: response.status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Normalize Viator response with enriched fields
    const results = (data?.data || data?.products || []).map((p: any) => ({
      productCode: p.productCode,
      title: p.title,
      shortDescription: p.shortDescription,
      thumbnailURL: p.thumbnailURL || p.defaultImage?.url,
      destination: p.destination || p.primaryDestination?.name,
      rating: p.reviewsStats?.avgRating,
      reviewCount: p.reviewsStats?.numReviews,
      fromPrice: p.pricingInfo?.fromPrice || p.pricingInfo?.fromPriceFrom,
      currency: p.pricingInfo?.currencyCode || "USD",
      productUrl: p.productUrl || null,
    }));

    return new Response(
      JSON.stringify({ 
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders(req), "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return buildSafeErrorResponse("viator-search", error, corsHeaders(req));
  }
});