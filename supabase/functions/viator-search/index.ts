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
    
    // Freetext search body — /partner/search/freetext accepts a searchTerm;
    // /partner/products/search does NOT (it requires a filtering object with
    // destination IDs, which is why it returned 400 "Missing filtering").
    const body: any = {
      currency: "USD",
      searchTypes: [
        { searchType: "PRODUCTS", pagination: { start: 1, count: 20 } },
      ],
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

    // No search term? Serve a curated top destination instead of erroring —
    // the default Tours tab should always show inventory (Booking-style
    // browse), never an empty shelf.
    if (!body.searchTerm) {
      const curated = ["Paris", "Rome", "Tokyo", "New York", "Barcelona", "Amsterdam", "London", "Bali"];
      body.searchTerm = curated[Math.floor(Math.random() * curated.length)];
    }

    // Viator freetext search — matches the searchTerm-based body above.
    const viatorUrl = "https://api.viator.com/partner/search/freetext";

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

    // Normalize — freetext nests products under products.results; keep the
    // old field fallbacks so either response shape maps cleanly.
    const rawProducts =
      data?.products?.results || data?.data || data?.products || [];
    const results = (Array.isArray(rawProducts) ? rawProducts : []).map((p: any) => ({
      productCode: p.productCode,
      title: p.title,
      shortDescription: p.shortDescription || p.summary || null,
      thumbnailURL: (() => {
        const variants = p.images?.[0]?.variants;
        if (Array.isArray(variants) && variants.length) {
          let best = variants[0];
          for (const v of variants) {
            if ((v?.width ?? 0) * (v?.height ?? 0) > (best?.width ?? 0) * (best?.height ?? 0)) best = v;
          }
          if (best?.url) return best.url;
        }
        return p.thumbnailURL || p.defaultImage?.url || null;
      })(),
      destination: p.destinations?.[0]?.name || p.destination || p.primaryDestination?.name || null,
      rating: p.reviews?.combinedAverageRating ?? p.reviewsStats?.avgRating ?? null,
      reviewCount: p.reviews?.totalReviews ?? p.reviewsStats?.numReviews ?? null,
      fromPrice: p.pricing?.summary?.fromPrice ?? p.pricingInfo?.fromPrice ?? p.pricingInfo?.fromPriceFrom ?? null,
      currency: p.pricing?.currency || p.pricingInfo?.currencyCode || "USD",
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
