// supabase/functions/concierge-suggest-partners/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TripRequest {
  id: string;
  destination?: string | null;
  budget_level?: string | null;
  travel_styles?: string[] | null;
  occasion?: string | null;
  wants_role?: "creator" | "agent" | "both" | null;
}

interface CreatorProfile {
  id: string;
  display_name: string;
  tiktok_handle?: string | null;
  creator_niches?: string[] | null;
  creator_budget_levels?: string[] | null;
}

interface CreatorMatch {
  creator: CreatorProfile;
  score: number;
  reasons: string[];
}

function computeCreatorMatchScore(
  trip: TripRequest,
  creator: CreatorProfile
): CreatorMatch {
  let score = 0;
  const reasons: string[] = [];

  const niches = creator.creator_niches || [];
  const budgets = creator.creator_budget_levels || [];
  const tripStyles = trip.travel_styles || [];

  // Travel style overlap
  const styleOverlap = tripStyles.filter((s) => niches.includes(s));
  if (styleOverlap.length > 0) {
    score += styleOverlap.length * 10;
    reasons.push(`Shares your trip style: ${styleOverlap.join(", ")}`);
  }

  // Budget alignment
  if (trip.budget_level && budgets.includes(trip.budget_level)) {
    score += 15;
    reasons.push(`Comfortable with your budget level (${trip.budget_level})`);
  }

  // Occasion hacks
  if (
    trip.occasion &&
    niches.includes("Romantic") &&
    /honeymoon|anniversary/i.test(trip.occasion)
  ) {
    score += 10;
    reasons.push("Specializes in romantic / celebration trips");
  }

  // Destination fuzzy match
  if (trip.destination && niches.some((n) => n.includes(trip.destination!))) {
    score += 10;
    reasons.push(`Has content around ${trip.destination}`);
  }

  return { creator, score, reasons };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { trip_request_id, free_text, user_id } = await req.json();

    let trip: TripRequest | null = null;

    // If trip_request_id provided, fetch the trip
    if (trip_request_id) {
      const { data } = await supabase
        .from("trip_requests")
        .select("id, destination, budget_level, travel_styles, occasion, wants_role")
        .eq("id", trip_request_id)
        .maybeSingle();

      trip = data;
    } else if (free_text) {
      // Basic keyword extraction from free text (v1 - simple heuristics)
      const lowerText = free_text.toLowerCase();
      
      // Extract budget hints
      let budget_level = null;
      if (lowerText.includes("luxury") || lowerText.includes("high-end")) {
        budget_level = "Ultra-luxury";
      } else if (lowerText.includes("boutique") || lowerText.includes("nice")) {
        budget_level = "Classic luxury";
      } else if (lowerText.includes("affordable") || lowerText.includes("budget")) {
        budget_level = "Affordable-chic";
      }

      // Extract style hints
      const travel_styles: string[] = [];
      if (lowerText.includes("beach")) travel_styles.push("Beach escapes");
      if (lowerText.includes("city")) travel_styles.push("European city breaks");
      if (lowerText.includes("hotel")) travel_styles.push("Design hotels");
      if (lowerText.includes("villa")) travel_styles.push("Villas & homes");
      if (lowerText.includes("food") || lowerText.includes("culinary")) travel_styles.push("Food & wine");

      trip = {
        id: "temp",
        destination: free_text.split(" ").find((w: string) => w.length > 4) || null,
        budget_level,
        travel_styles: travel_styles.length > 0 ? travel_styles : null,
        occasion: null,
        wants_role: "both",
      };
    }

    if (!trip) {
      return new Response(
        JSON.stringify({ creators: [], agents: [], trip: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active creators
    const { data: creators } = await supabase
      .from("profiles")
      .select(
        "id, display_name, tiktok_handle, creator_niches, creator_budget_levels"
      )
      .eq("account_type", "creator")
      .eq("has_completed_creator_onboarding", true)
      .limit(50);

    const creatorMatches: CreatorMatch[] = [];
    if (creators) {
      for (const creator of creators) {
        const match = computeCreatorMatchScore(trip, creator);
        if (match.score > 0) {
          creatorMatches.push(match);
        }
      }
    }

    // Sort by score and take top 5
    const topCreators = creatorMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // TODO: Add agent matching when agent profiles are ready
    const agentMatches: any[] = [];

    return new Response(
      JSON.stringify({
        trip,
        creators: topCreators,
        agents: agentMatches,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in concierge-suggest-partners:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
