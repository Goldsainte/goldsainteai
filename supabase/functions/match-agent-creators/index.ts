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
  
  // Create client with user's auth context
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  // Verify authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Loading agent profile for user:", user.id);

    // Load agent profile for authenticated user
    const { data: agentProfile, error: agentError } = await supabase
      .from("travel_agents")
      .select("id, user_id, agency_name, specializations, destinations, regions, target_audience")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agentError) {
      console.error("Error loading agent profile:", agentError);
      return new Response(
        JSON.stringify({ error: "Failed to load agent profile" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!agentProfile) {
      return new Response(
        JSON.stringify({ error: "Agent profile not found" }),
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Agent profile loaded:", agentProfile.agency_name);

    // Load all creators
    const { data: creators, error: creatorsError } = await supabase
      .from("creator_profiles")
      .select("user_id, display_name, handle, primary_niches, primary_regions, tiktok_handle, bio");

    if (creatorsError) {
      console.error("Error loading creators:", creatorsError);
      return new Response(
        JSON.stringify({ error: "Failed to load creators" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`Evaluating ${creators?.length || 0} creators`);

    // Combine agent destinations and regions for matching
    const agentLocations = [
      ...(agentProfile.destinations || []),
      ...(agentProfile.regions || [])
    ].map((loc: string) => loc.toLowerCase());

    const agentSpecialties = (agentProfile.specializations || []).map((s: string) =>
      s.toLowerCase()
    );

    // Score each creator
    const matches = (creators || [])
      .map((creator: any) => {
        let score = 0;
        const matchReasons: string[] = [];

        const creatorRegions = (creator.primary_regions || []).map((r: string) =>
          r.toLowerCase()
        );
        const creatorNiches = (creator.primary_niches || []).map((n: string) =>
          n.toLowerCase()
        );

        // Geographic overlap (most important - 40 points)
        const regionOverlap = creatorRegions.filter((r: string) =>
          agentLocations.some((loc: string) => 
            loc.includes(r) || r.includes(loc)
          )
        );

        if (regionOverlap.length > 0) {
          score += regionOverlap.length * 20; // 20 points per matching region
          matchReasons.push(`${regionOverlap.length} destination(s) in common`);
        }

        // Niche/specialty overlap (30 points)
        const nicheOverlap = creatorNiches.filter((n: string) =>
          agentSpecialties.some((spec: string) => 
            spec.includes(n) || n.includes(spec)
          )
        );

        if (nicheOverlap.length > 0) {
          score += nicheOverlap.length * 15; // 15 points per matching niche
          matchReasons.push(`${nicheOverlap.length} specialty match(es)`);
        }

        // TikTok presence bonus (20 points)
        if (creator.tiktok_handle) {
          score += 20;
          matchReasons.push("Active TikTok creator");
        }

        // Profile completeness bonus (10 points)
        if (creator.bio && creator.bio.length > 50) {
          score += 10;
          matchReasons.push("Detailed profile");
        }

        return {
          creatorId: creator.user_id,
          displayName: creator.display_name,
          handle: creator.handle,
          tiktokHandle: creator.tiktok_handle,
          regionOverlap,
          nicheOverlap,
          score,
          matchReasons,
        };
      })
      .filter((m: any) => m.score > 0) // Must have some overlap
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20); // Top 20 matches

    console.log(`Found ${matches.length} matching creators`);

    return new Response(
      JSON.stringify({
        agentId: agentProfile.id,
        agencyName: agentProfile.agency_name,
        matches,
        totalCreatorsEvaluated: creators?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
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
