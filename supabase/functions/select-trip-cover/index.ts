import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const THEMES = ["skyline", "luxury hotel", "beach", "street", "nature", "food", "landmark", "architecture"];

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

// Simple seeded random for deterministic selection
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const UNSPLASH_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_KEY) throw new Error("UNSPLASH_ACCESS_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { destination, trip_id } = await req.json();
    if (!destination?.trim()) {
      return new Response(JSON.stringify({ error: "destination required" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const citySlug = slugify(destination);

    // Pick 2-3 random themes
    const shuffled = [...THEMES].sort(() => Math.random() - 0.5);
    const selectedThemes = shuffled.slice(0, 3);

    // Query Unsplash for each theme
    const allPhotos: any[] = [];
    for (const theme of selectedThemes) {
      const query = `${destination} ${theme}`;
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", "15");
      url.searchParams.set("orientation", "landscape");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_KEY}`,
          "Accept-Version": "v1",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          allPhotos.push(...data.results);
        }
      }
    }

    if (allPhotos.length === 0) {
      return new Response(JSON.stringify({ error: "No photos found", url: null }), {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Deduplicate by photo ID
    const uniquePhotos = new Map<string, any>();
    for (const photo of allPhotos) {
      if (!uniquePhotos.has(photo.id)) {
        uniquePhotos.set(photo.id, photo);
      }
    }
    let candidates = Array.from(uniquePhotos.values());

    // Fetch recently used photos for this city (last 15)
    const { data: recentUsage } = await supabase
      .from("city_image_usage")
      .select("unsplash_photo_id, photographer, last_used_at")
      .eq("city_slug", citySlug)
      .order("last_used_at", { ascending: false })
      .limit(15);

    const recentPhotoIds = new Set((recentUsage || []).map((r: any) => r.unsplash_photo_id));
    const recentPhotographers = new Set(
      (recentUsage || []).slice(0, 5).map((r: any) => r.photographer).filter(Boolean)
    );

    // Filter out recently used photos and photographers
    let filtered = candidates.filter(
      (p) => !recentPhotoIds.has(p.id) && !recentPhotographers.has(p.user?.name)
    );

    // If pool too small, relax photographer constraint
    if (filtered.length < 5) {
      filtered = candidates.filter((p) => !recentPhotoIds.has(p.id));
    }

    // If still too small, use all candidates (fallback to least recently used)
    if (filtered.length < 3) {
      filtered = candidates;
    }

    // Weighted random selection (favor higher relevance = earlier in results)
    let selected: any;
    if (trip_id) {
      // Deterministic selection seeded by trip_id
      const idx = Math.floor(seededRandom(trip_id) * filtered.length);
      selected = filtered[idx];
    } else {
      // Weighted random: earlier photos get higher weight
      const weights = filtered.map((_, i) => Math.max(1, filtered.length - i));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          selectedIdx = i;
          break;
        }
      }
      selected = filtered[selectedIdx];
    }

    const photoUrl = selected.urls?.regular || selected.urls?.full || selected.urls?.small;
    const photographer = selected.user?.name || null;

    // Upsert into city_image_usage
    await supabase.from("city_image_usage").upsert(
      {
        city_slug: citySlug,
        unsplash_photo_id: selected.id,
        unsplash_url: photoUrl,
        photographer,
        last_used_at: new Date().toISOString(),
        used_count: 1,
      },
      { onConflict: "city_slug,unsplash_photo_id" }
    );

    // If it was an existing record, increment used_count
    await supabase
      .from("city_image_usage")
      .update({ used_count: (selected.used_count || 0) + 1, last_used_at: new Date().toISOString() })
      .eq("city_slug", citySlug)
      .eq("unsplash_photo_id", selected.id);

    return new Response(
      JSON.stringify({
        url: photoUrl,
        unsplash_photo_id: selected.id,
        photographer,
      }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[select-trip-cover] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
