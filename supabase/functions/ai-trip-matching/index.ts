import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TripMatchingRequestBody {
  tripRequestId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tripRequestId } = (await req.json()) as TripMatchingRequestBody;

    if (!tripRequestId) {
      return new Response(JSON.stringify({ error: "Missing tripRequestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    console.log(`[ai-trip-matching] Processing trip request: ${tripRequestId}`);

    // 1) Load trip request with brand/collection context
    const { data: trip, error: tripError } = await supabase
      .from("trip_requests")
      .select("id, user_id, source_brand_profile_id, source_collection_id, source_type, source_metadata, destination, budget_min, budget_max")
      .eq("id", tripRequestId)
      .maybeSingle();

    if (tripError || !trip) {
      console.error("[ai-trip-matching] Trip request not found:", tripError);
      throw tripError ?? new Error("Trip request not found");
    }

    // Extract tags from source_metadata
    const tags = new Set<string>();
    const metadata = trip.source_metadata as Record<string, any> || {};
    
    (metadata.collection_tags ?? []).forEach((t: string) => tags.add(t.toLowerCase()));
    (metadata.storyboard_tags ?? []).forEach((t: string) => tags.add(t.toLowerCase()));

    console.log(`[ai-trip-matching] Trip tags:`, Array.from(tags));

    // 2) Load candidate creators and agents with AI persona data
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id, account_type, creator_niches, agent_specialties, 
        destinations_focus_tags, content_style_tags, creator_budget_levels,
        ai_persona_tone, ai_persona_audience, travel_philosophy,
        preferred_brand_tiers, preferred_hotel_brands, aesthetic_alignment,
        tiktok_verified, tiktok_follower_count
      `)
      .in("account_type", ["creator", "agent"]);

    if (profilesError) {
      console.error("[ai-trip-matching] Profiles error:", profilesError);
      throw profilesError;
    }

    console.log(`[ai-trip-matching] Found ${profiles?.length || 0} potential candidates`);

    // 3) Score each candidate with enhanced AI persona matching
    type Candidate = {
      id: string;
      account_type: "creator" | "agent";
      creator_niches: string[] | null;
      agent_specialties: string[] | null;
      destinations_focus_tags: string[] | null;
      content_style_tags: string[] | null;
      creator_budget_levels: string[] | null;
      ai_persona_tone: string | null;
      ai_persona_audience: string[] | null;
      travel_philosophy: string | null;
      preferred_brand_tiers: string[] | null;
      preferred_hotel_brands: string[] | null;
      aesthetic_alignment: string[] | null;
      tiktok_verified: boolean | null;
      tiktok_follower_count: number | null;
    };

    const candidates = (profiles ?? []) as Candidate[];

    const scored = candidates.map((c) => {
      let score = 0;
      const reasons: string[] = [];

      const candidateTags = new Set<string>();
      
      // Gather all candidate tags
      if (c.account_type === "creator") {
        (c.creator_niches ?? []).forEach((t) => candidateTags.add(t.toLowerCase()));
      } else {
        (c.agent_specialties ?? []).forEach((t) => candidateTags.add(t.toLowerCase()));
      }
      (c.content_style_tags ?? []).forEach((t) => candidateTags.add(t.toLowerCase()));
      (c.aesthetic_alignment ?? []).forEach((t) => candidateTags.add(t.toLowerCase()));

      // Tag overlap scoring (original logic)
      const matchedTags: string[] = [];
      tags.forEach((t) => {
        if (candidateTags.has(t)) {
          score += 10;
          matchedTags.push(t);
        }
      });

      if (matchedTags.length > 0) {
        reasons.push(`Shares your vibe: ${matchedTags.slice(0, 3).join(", ")}`);
      }

      // Region/destination overlap
      const destLower = (trip.destination ?? "").toLowerCase();
      const matchedRegions: string[] = [];
      
      (c.destinations_focus_tags ?? []).forEach((r) => {
        if (destLower.includes(r.toLowerCase())) {
          score += 15;
          matchedRegions.push(r);
        }
      });

      if (matchedRegions.length > 0) {
        reasons.push(`Specializes in ${matchedRegions[0]}`);
      }

      // Budget alignment for creators
      if (c.account_type === "creator" && trip.budget_min && c.creator_budget_levels) {
        const budgetLevels = c.creator_budget_levels.map((b) => b.toLowerCase());
        
        if (trip.budget_min < 5000 && budgetLevels.includes("budget")) {
          score += 5;
          reasons.push("Comfortable with your budget level");
        } else if (trip.budget_min >= 5000 && trip.budget_min < 15000 && budgetLevels.includes("mid-range")) {
          score += 5;
          reasons.push("Comfortable with your budget level");
        } else if (trip.budget_min >= 15000 && budgetLevels.includes("luxury")) {
          score += 5;
          reasons.push("Comfortable with your budget level");
        }
      }

      // NEW: AI Persona Tone Matching
      if (c.ai_persona_tone) {
        // Match tone with trip metadata aesthetic hints
        const aestheticHints = metadata.aesthetic_hints as string[] || [];
        const toneMatches = aestheticHints.some((hint: string) => 
          hint.toLowerCase().includes(c.ai_persona_tone!.toLowerCase())
        );
        if (toneMatches) {
          score += 8;
          reasons.push(`${c.ai_persona_tone} tone matches your aesthetic`);
        }
      }

      // NEW: AI Persona Audience Matching
      if (c.ai_persona_audience && c.ai_persona_audience.length > 0) {
        const tripCompanions = metadata.companions as string || "";
        const audienceMatch = c.ai_persona_audience.some((audience: string) => {
          const audienceLower = audience.toLowerCase();
          if (audienceLower === "couples" && tripCompanions.includes("couple")) return true;
          if (audienceLower === "solo" && tripCompanions.includes("solo")) return true;
          if (audienceLower === "families" && tripCompanions.includes("family")) return true;
          if (audienceLower === "groups" && tripCompanions.includes("friends")) return true;
          return false;
        });
        if (audienceMatch) {
          score += 10;
          reasons.push("Specializes in your travel style");
        }
      }

      // NEW: Travel Philosophy bonus (presence indicates engaged creator)
      if (c.travel_philosophy && c.travel_philosophy.length > 50) {
        score += 3;
      }

      // NEW: Brand Tier Alignment
      if (c.preferred_brand_tiers && c.preferred_brand_tiers.length > 0) {
        const tripBudget = trip.budget_max || trip.budget_min || 0;
        const tiers = c.preferred_brand_tiers.map((t) => t.toLowerCase());
        
        if (tripBudget >= 20000 && tiers.includes("ultra_luxury")) {
          score += 8;
          reasons.push("Specializes in ultra-luxury");
        } else if (tripBudget >= 10000 && tiers.includes("luxury")) {
          score += 6;
          reasons.push("Luxury specialist");
        } else if (tripBudget >= 5000 && tiers.includes("premium")) {
          score += 4;
        }
      }

      // NEW: TikTok Verification Bonus
      if (c.tiktok_verified) {
        score += 5;
        reasons.push("Verified creator");
        
        // Extra bonus for high follower count
        if (c.tiktok_follower_count && c.tiktok_follower_count >= 100000) {
          score += 5;
        } else if (c.tiktok_follower_count && c.tiktok_follower_count >= 50000) {
          score += 3;
        }
      }

      // Role preference scoring (agents slightly preferred as primary)
      if (c.account_type === "agent") {
        score += 2;
      }

      return { candidate: c, match_score: score, reasons: reasons.join(" • ") };
    });

    // 4) Filter and sort by score
    const top = scored
      .filter((s) => s.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    console.log(`[ai-trip-matching] Top ${top.length} matches found`);

    // Clear previous matches
    await supabase
      .from("trip_request_matches")
      .delete()
      .eq("trip_request_id", tripRequestId);

    if (top.length === 0) {
      console.log("[ai-trip-matching] No matches found, marking as 'open'");
      
      await supabase
        .from("trip_requests")
        .update({ status: "open" })
        .eq("id", tripRequestId);

      return new Response(
        JSON.stringify({ matches: [], message: "No strong matches found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5) Insert matches
    const matchRows = top.map((s) => ({
      trip_request_id: tripRequestId,
      candidate_profile_id: s.candidate.id,
      role: s.candidate.account_type,
      match_score: s.match_score,
      reasons: s.reasons || "Matched based on profile and preferences",
    }));

    const { error: insertError } = await supabase
      .from("trip_request_matches")
      .insert(matchRows);

    if (insertError) {
      console.error("[ai-trip-matching] Insert error:", insertError);
      throw insertError;
    }

    // 6) Auto-assign best candidate
    const best = top[0];
    const { error: assignError } = await supabase
      .from("trip_request_assignments")
      .upsert(
        {
          trip_request_id: tripRequestId,
          assignee_profile_id: best.candidate.id,
          assignee_role: best.candidate.account_type,
        },
        { onConflict: "trip_request_id" }
      );

    if (assignError) {
      console.error("[ai-trip-matching] Assignment error:", assignError);
      // Don't fail the whole operation if assignment fails
    }

    // 7) Update trip status
    await supabase
      .from("trip_requests")
      .update({ status: "matched" })
      .eq("id", tripRequestId);

    console.log(`[ai-trip-matching] Successfully matched and assigned trip ${tripRequestId}`);

    return new Response(
      JSON.stringify({
        matches: matchRows,
        primary_assignee: best.candidate.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ai-trip-matching] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
