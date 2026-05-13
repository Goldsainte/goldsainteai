// supabase/functions/ai-storyboard-suggestions/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders(req) 
    });
  }

  try {
    const { tripId, storyboardId } = await req.json();
    
    console.log(`[ai-storyboard-suggestions] Received request for tripId: ${tripId}, storyboardId: ${storyboardId}`);
    
    if (!tripId || !storyboardId) {
      console.error("[ai-storyboard-suggestions] Missing required parameters");
      return new Response(
        JSON.stringify({ error: "tripId and storyboardId required" }),
        { 
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        },
      );
    }

    // Load trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (tripError) {
      console.error("[ai-storyboard-suggestions] Error loading trip:", tripError);
      return new Response(
        JSON.stringify({ error: "Failed to load trip" }),
        { 
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        },
      );
    }

    if (!trip) {
      console.error("[ai-storyboard-suggestions] Trip not found");
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        },
      );
    }

    const destination = trip.destination || "your destination";
    console.log(`[ai-storyboard-suggestions] Creating storyboard for destination: ${destination}`);

    // Check for existing items
    const { data: existingItems, error: itemsError } = await supabase
      .from("storyboard_items")
      .select("id")
      .eq("storyboard_id", storyboardId)
      .limit(1);

    if (itemsError) {
      console.warn("[ai-storyboard-suggestions] Error checking existing items:", itemsError);
    }

    if (existingItems && existingItems.length > 0) {
      console.log("[ai-storyboard-suggestions] Storyboard already has items, skipping");
      return new Response(
        JSON.stringify({ ok: true, skipped: true, message: "Storyboard already has items" }), 
        {
          status: 200,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate base scenes
    const baseScenes = [
      {
        category_tag: "arrival",
        caption: `Arrival in ${destination} · airport, transfer, first glimpse of the city`,
        day_number: 1,
      },
      {
        category_tag: "hotel",
        caption: `Check-in & room reveal at your hotel in ${destination}`,
        day_number: 1,
      },
      {
        category_tag: "golden_hour",
        caption: `Golden hour views over ${destination} · rooftops, terraces, or waterfront`,
        day_number: 2,
      },
      {
        category_tag: "experience",
        caption: `Signature experience · the moment that will define this trip`,
        day_number: 2,
      },
      {
        category_tag: "dining",
        caption: `Dinner at a place that feels like a hidden find, not a tourist trap`,
        day_number: 2,
      },
      {
        category_tag: "farewell",
        caption: `Farewell scene · last morning coffee, final walk, or airport goodbye`,
        day_number: 3,
      },
    ];

    const rows = baseScenes.map((scene, index) => ({
      storyboard_id: storyboardId,
      order_index: index,
      layout_type: "masonry" as const,
      media_url: null,
      caption: scene.caption,
      category_tag: scene.category_tag,
      day_number: scene.day_number,
    }));

    console.log(`[ai-storyboard-suggestions] Inserting ${rows.length} storyboard items`);

    const { error: insertError } = await supabase
      .from("storyboard_items")
      .insert(rows);

    if (insertError) {
      console.error("[ai-storyboard-suggestions] Error inserting items:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create storyboard items", details: insertError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        },
      );
    }

    console.log("[ai-storyboard-suggestions] Successfully created storyboard items");
    return new Response(
      JSON.stringify({ ok: true, itemsCreated: rows.length }), 
      { 
        status: 200,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error("[ai-storyboard-suggestions] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err instanceof Error ? err.message : String(err) }),
      { 
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      },
    );
  }
});
