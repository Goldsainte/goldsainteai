import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Very simple intent detection: "I want to go/travel/visit X"
function detectTravelIntent(message: string): boolean {
  if (!message) return false;
  return /want to\s+(go|travel|visit)/i.test(message);
}

// Very simple destination extractor: "to Morocco", "to New York", etc.
function extractDestination(message: string): string | null {
  if (!message) return null;

  // Look for "to <Capitalized words>"
  const match = message.match(/\bto\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
  if (!match) return null;

  const dest = match[1].trim();
  return dest.length > 0 ? dest : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.message !== "string" || !body.userId) {
      console.error("[madison-chat] Invalid request body", body);
      return new Response(
        JSON.stringify({ error: "message (string) and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const message: string = body.message;
    const userId: string = body.userId;

    const wantsToTravel = detectTravelIntent(message);
    const destination = extractDestination(message);

    console.log("[madison-chat] Parsed intent:", {
      message,
      userId,
      wantsToTravel,
      destination,
    });

    // If we detect a clear "I want to go to X" intent with a destination,
    // create a trip + storyboard and kick off AI storyboard suggestions.
    if (wantsToTravel && destination) {
      // Create trip
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          traveler_id: userId,
          destination,
          title: `${destination} Trip`,
          status: "open",
        } as any)
        .select("*")
        .single();

      if (tripError || !trip) {
        console.error("[madison-chat] Error creating trip:", tripError);
        return new Response(
          JSON.stringify({ error: "Failed to create trip" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Create storyboard linked to this trip
      const { data: storyboard, error: storyboardError } = await supabase
        .from("storyboards")
        .insert({
          trip_id: (trip as any).id,
          owner_id: userId,
          owner_role: "traveler",
          title: `${destination} Storyboard`,
          visibility: "trip",
        } as any)
        .select("*")
        .single();

      if (storyboardError || !storyboard) {
        console.error("[madison-chat] Error creating storyboard:", storyboardError);
        return new Response(
          JSON.stringify({
            error: "Failed to create storyboard",
            trip,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Kick off AI storyboard suggestions (best-effort, don't fail trip)
      try {
        console.log("[madison-chat] Invoking ai-storyboard-suggestions", {
          tripId: (trip as any).id,
          storyboardId: (storyboard as any).id,
        });

        await supabase.functions.invoke("ai-storyboard-suggestions", {
          body: {
            tripId: (trip as any).id,
            storyboardId: (storyboard as any).id,
          },
        });
      } catch (suggestError) {
        console.error("[madison-chat] Error invoking ai-storyboard-suggestions:", suggestError);
      }

      const friendlyMessage = `Amazing choice! I've started planning your trip to ${destination}. Let's build out your itinerary.`;

      return new Response(
        JSON.stringify({
          action: "create_trip",
          trip,
          storyboard,
          message: friendlyMessage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fallback: no clear trip creation intent
    return new Response(
      JSON.stringify({
        action: "chat",
        message:
          "I'd love to help you plan a trip. Try saying something like \"I want to go to Morocco in May for 7 days.\"",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[madison-chat] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process message" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
