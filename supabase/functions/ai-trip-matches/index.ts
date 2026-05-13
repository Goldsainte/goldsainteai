import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { enforceRateLimit } from "../_utils/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ProviderType = "creator" | "agent";

interface MatchedProvider {
  provider_id: string;
  provider_type: ProviderType;
  full_name: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  bio: string | null;
  score: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { tripId, limit } = await req.json();
    const k = typeof limit === "number" && limit > 0 ? limit : 8;

    if (!tripId) {
      return new Response(
        JSON.stringify({ error: "Missing tripId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Loading trip:", tripId);

    // Load the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, user_id, destination, description, budget_range")
      .eq("id", tripId)
      .maybeSingle();

    if (tripError || !trip) {
      console.error("Trip error:", tripError);
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateLimitResponse = await enforceRateLimit({
      keyType: "ai",
      userId: trip.user_id,
      req,
      corsHeaders,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const destination = (trip.destination || "").toLowerCase();
    const desc = (trip.description || "").toLowerCase();

    console.log("Trip loaded:", { destination, desc: desc.substring(0, 50) });

    // Load creators & agents
    const { data: providers, error: providersError } = await supabase
      .from("profiles")
      .select(`
        id,
        account_type,
        full_name,
        tiktok_handle,
        tiktok_followers,
        tiktok_niche_tags,
        destinations_focus_tags,
        content_style_tags,
        bio
      `)
      .in("account_type", ["creator", "agent"]);

    if (providersError) {
      console.error("Providers error:", providersError);
      return new Response(
        JSON.stringify({ error: "Could not load providers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${providers?.length || 0} potential providers`);

    const scored = (providers || []).map((p): MatchedProvider => {
      const providerType: ProviderType = p.account_type === "creator"
        ? "creator"
        : "agent";

      const nicheTags = (p.tiktok_niche_tags || []) as string[];
      const destTags = (p.destinations_focus_tags || []) as string[];
      const styleTags = (p.content_style_tags || []) as string[];

      let score = 0;

      // Destination overlap
      if (destination) {
        const match = destTags.some((t) =>
          destination.includes(t.toLowerCase())
        );
        if (match) score += 30;
      }

      // Niche overlap with description
      if (desc) {
        nicheTags.forEach((tag) => {
          if (desc.includes(tag.toLowerCase())) score += 10;
        });
        styleTags.forEach((tag) => {
          if (desc.includes(tag.toLowerCase())) score += 5;
        });
      }

      // Follower count bump for creators
      if (providerType === "creator" && p.tiktok_followers) {
        if (p.tiktok_followers > 1000000) score += 20;
        else if (p.tiktok_followers > 100000) score += 10;
        else if (p.tiktok_followers > 10000) score += 5;
      }

      return {
        provider_id: p.id,
        provider_type: providerType,
        full_name: p.full_name,
        tiktok_handle: p.tiktok_handle,
        tiktok_followers: p.tiktok_followers,
        bio: p.bio,
        score,
      };
    });

    // Filter out low-score & sort
    const filtered = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    console.log(`Matched ${filtered.length} providers with scores`);

    // Write to trip_matches table
    if (filtered.length > 0) {
      const rows = filtered.map((f) => ({
        trip_id: tripId,
        provider_id: f.provider_id,
        provider_type: f.provider_type,
        score: f.score,
      }));

      const { error: matchError } = await supabase
        .from("trip_matches")
        .insert(rows);

      if (matchError) {
        console.warn("trip_matches insert error:", matchError);
      } else {
        console.log(`Inserted ${rows.length} match records`);
      }
    }

    return new Response(
      JSON.stringify({ matches: filtered }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-trip-matches error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error",
        message: err instanceof Error ? err.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
