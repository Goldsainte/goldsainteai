import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders(req) 
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }), 
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const tripRequestId = body?.tripRequestId as string | undefined;
  if (!tripRequestId) {
    return new Response(
      JSON.stringify({ error: "Missing tripRequestId" }), 
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Loading trip request:", tripRequestId);
    
    // 1) Load trip request
    const { data: trip, error: tripError } = await supabase
      .from("cocurated_trip_requests")
      .select("*")
      .eq("id", tripRequestId)
      .maybeSingle();

    if (tripError) {
      console.error("Error loading trip request:", tripError);
      return new Response(
        JSON.stringify({ error: "Failed to load trip request" }), 
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!trip) {
      return new Response(
        JSON.stringify({ error: "Trip request not found" }), 
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Trip request loaded:", trip.destination, trip.total_travelers);

    // 2) Load candidate agents (active and verified only)
    const { data: agents, error: agentsError } = await supabase
      .from("travel_agents")
      .select("id, user_id, agency_name, specializations, destinations, regions, max_group_size, min_budget, max_budget, rating, total_reviews, experience_years")
      .eq("is_active", true)
      .eq("is_verified", true);

    if (agentsError) {
      console.error("Error loading agents:", agentsError);
    }

    // 3) Load candidate creators
    const { data: creators, error: creatorsError } = await supabase
      .from("creator_profiles")
      .select("user_id, display_name, handle, primary_niches, primary_regions, tiktok_handle");

    if (creatorsError) {
      console.error("Error loading creators:", creatorsError);
    }

    console.log(`Found ${agents?.length || 0} agents and ${creators?.length || 0} creators`);

    // 4) Simple placeholder scoring logic (to be enhanced with AI later)
    const requestedBudgetMax = trip.budget_range_max ?? trip.budget_range_min ?? null;
    const requestedBudgetMin = trip.budget_range_min ?? null;
    const requestedDestination = (trip.destination || "").toLowerCase();
    const requestedTravelers = trip.total_travelers || 1;

    // Match agents
    const matchedAgents = (agents ?? [])
      .map((agent: any) => {
        let score = 0;
        const matchReasons: string[] = [];

        // Check destination match (using destinations or regions arrays)
        const agentLocations = [
          ...(agent.destinations || []),
          ...(agent.regions || [])
        ];
        
        const servesRegion = agentLocations.some((loc: string) =>
          requestedDestination.includes(loc.toLowerCase()) ||
          loc.toLowerCase().includes(requestedDestination)
        );

        if (servesRegion) {
          score += 30;
          matchReasons.push("Serves destination");
        }

        // Check budget compatibility
        if (requestedBudgetMax && agent.max_budget) {
          if (agent.min_budget && requestedBudgetMin && 
              requestedBudgetMin >= agent.min_budget && 
              requestedBudgetMax <= agent.max_budget) {
            score += 25;
            matchReasons.push("Budget match");
          } else if (agent.max_budget >= requestedBudgetMax) {
            score += 15;
            matchReasons.push("Can handle budget");
          }
        }

        // Check group size capacity
        if (agent.max_group_size && requestedTravelers <= agent.max_group_size) {
          score += 10;
          matchReasons.push("Can handle group size");
        }

        // Rating bonus (up to 20 points)
        if (agent.rating) {
          score += (agent.rating / 5) * 20;
          matchReasons.push(`${agent.rating.toFixed(1)} star rating`);
        }

        // Experience bonus (up to 15 points)
        if (agent.experience_years) {
          const expScore = Math.min((agent.experience_years / 10) * 15, 15);
          score += expScore;
          if (agent.experience_years >= 5) {
            matchReasons.push(`${agent.experience_years}+ years experience`);
          }
        }

        return {
          agentId: agent.id,
          userId: agent.user_id,
          agencyName: agent.agency_name,
          score: Math.round(score),
          matchReasons,
          rating: agent.rating,
          totalReviews: agent.total_reviews,
        };
      })
      .filter((m: any) => m.score > 20) // Minimum threshold
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    console.log(`Matched ${matchedAgents.length} agents`);

    // Match creators (simpler scoring for now)
    const matchedCreators = (creators ?? [])
      .map((creator: any) => {
        let score = 0;
        const matchReasons: string[] = [];

        const creatorRegions = (creator.primary_regions || []).map((r: string) =>
          r.toLowerCase()
        );

        // Region match
        const servesRegion = creatorRegions.some((r: string) =>
          requestedDestination.includes(r) || r.includes(requestedDestination)
        );

        if (servesRegion) {
          score += 40;
          matchReasons.push("Creates content in destination");
        }

        // Has TikTok presence
        if (creator.tiktok_handle) {
          score += 20;
          matchReasons.push("Active TikTok creator");
        }

        return {
          creatorId: creator.user_id,
          displayName: creator.display_name,
          handle: creator.handle,
          tiktokHandle: creator.tiktok_handle,
          score,
          matchReasons,
        };
      })
      .filter((m: any) => m.score > 30)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    console.log(`Matched ${matchedCreators.length} creators`);

    const responseBody = {
      tripRequestId,
      destination: trip.destination,
      travelers: trip.total_travelers,
      budgetRange: {
        min: trip.budget_range_min,
        max: trip.budget_range_max,
      },
      matchedAgents,
      matchedCreators,
      totalAgentsEvaluated: agents?.length || 0,
      totalCreatorsEvaluated: creators?.length || 0,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Matching error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
