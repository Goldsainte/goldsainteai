import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { itineraryId } = await req.json();

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Get calendar sync token
    const { data: syncToken, error: tokenError } = await supabaseClient
      .from("calendar_sync_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("sync_enabled", true)
      .single();

    if (tokenError || !syncToken) {
      return new Response(
        JSON.stringify({ 
          error: "Google Calendar not connected. Please connect your calendar in settings." 
        }),
        {
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get itinerary details
    const { data: itinerary, error: itineraryError } = await supabaseClient
      .from("itineraries")
      .select("*, itinerary_days(*)")
      .eq("id", itineraryId)
      .single();

    if (itineraryError) throw itineraryError;

    // Refresh token if needed
    let accessToken = syncToken.access_token;
    if (syncToken.token_expires_at && new Date(syncToken.token_expires_at) < new Date()) {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
          refresh_token: syncToken.refresh_token || "",
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update stored token
      await supabaseClient
        .from("calendar_sync_tokens")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("id", syncToken.id);
    }

    // Create calendar events for each day
    const createdEvents = [];
    for (const day of itinerary.itinerary_days) {
      const event = {
        summary: `${itinerary.title} - Day ${day.day_number}`,
        description: day.notes || itinerary.description,
        start: {
          date: day.date,
          timeZone: itinerary.timezone || "UTC",
        },
        end: {
          date: day.date,
          timeZone: itinerary.timezone || "UTC",
        },
        location: itinerary.destination,
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${syncToken.calendar_id || "primary"}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Google Calendar API error:", errorData);
        throw new Error(`Failed to create calendar event: ${errorData}`);
      }

      const createdEvent = await response.json();
      createdEvents.push(createdEvent);
    }

    // Update last sync timestamp
    await supabaseClient
      .from("calendar_sync_tokens")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", syncToken.id);

    return new Response(
      JSON.stringify({
        success: true,
        events_created: createdEvents.length,
        message: `Successfully synced ${createdEvents.length} events to Google Calendar`,
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
