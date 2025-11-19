import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrandDiscoveryRequest {
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = (await req.json()) as BrandDiscoveryRequest;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Pull basic preference signals from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("travel_preferences, primary_niches, primary_regions, content_style_tags")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const preferenceTags = new Set<string>();

    const addTags = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "string") preferenceTags.add(v.toLowerCase());
        });
      }
    };

    addTags(profile?.primary_niches);
    addTags(profile?.primary_regions);
    addTags(profile?.content_style_tags);

    if (
      profile?.travel_preferences &&
      typeof profile.travel_preferences === "object"
    ) {
      Object.values(profile.travel_preferences).forEach((v) => {
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (typeof item === "string") {
              preferenceTags.add(item.toLowerCase());
            }
          });
        }
      });
    }

    // 2) Load candidate brands
    const { data: brands, error: brandsError } = await supabase
      .from("brand_profiles_discovery")
      .select(
        "profile_id, name, avatar_url, bio, categories, regions, tags, supplier_type, supplier_rating, supplier_reviews"
      )
      .limit(200);

    if (brandsError) throw brandsError;

    // 3) Simple tag-based scoring
    const scored = (brands || []).map((b) => {
      const brandTags = new Set<string>();
      const add = (val: unknown) => {
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if (typeof v === "string") brandTags.add(v.toLowerCase());
          });
        }
      };
      add(b.categories);
      add(b.regions);
      add(b.tags);

      let overlap = 0;
      preferenceTags.forEach((tag) => {
        if (brandTags.has(tag)) overlap += 1;
      });

      const baseScore =
        overlap +
        (b.supplier_rating ? Number(b.supplier_rating) * 0.2 : 0) +
        (b.supplier_reviews ? Math.min(Number(b.supplier_reviews), 50) * 0.02 : 0);

      return { ...b, match_score: baseScore };
    });

    // 4) Sort by score desc
    scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    return new Response(
      JSON.stringify({
        matches: scored.slice(0, 50),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ai-brand-discovery error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
