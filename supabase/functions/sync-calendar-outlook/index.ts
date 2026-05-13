import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface OutlookEvent {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: authData } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { itineraryId, accessToken } = await req.json();

    if (!itineraryId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: itineraryId, accessToken" }),
        {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    console.log("📅 [OUTLOOK SYNC] Starting sync for itinerary:", itineraryId);

    // Fetch itinerary data from database
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("*, itinerary_items(*)")
      .eq("id", itineraryId)
      .single();

    if (itineraryError || !itinerary) {
      console.error("❌ [OUTLOOK SYNC] Itinerary not found:", itineraryError);
      return new Response(
        JSON.stringify({ error: "Itinerary not found" }),
        {
          status: 404,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Convert itinerary to Outlook events
    const events: OutlookEvent[] = [];

    // Main trip event
    events.push({
      subject: itinerary.title,
      body: {
        contentType: "HTML",
        content: `<p>Trip to ${itinerary.destination}</p>`,
      },
      start: {
        dateTime: new Date(itinerary.start_date).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(itinerary.end_date).toISOString(),
        timeZone: "UTC",
      },
      location: {
        displayName: itinerary.destination,
      },
      isAllDay: true,
    });

    // Individual activities
    if (itinerary.itinerary_items) {
      for (const item of itinerary.itinerary_items) {
        const startDate = new Date(item.date);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour

        events.push({
          subject: item.title,
          body: {
            contentType: "Text",
            content: item.description || "",
          },
          start: {
            dateTime: startDate.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: "UTC",
          },
          location: item.location ? {
            displayName: item.location,
          } : undefined,
          isAllDay: !item.time,
        });
      }
    }

    // Send events to Microsoft Graph API
    const results = [];
    for (const event of events) {
      try {
        const response = await fetch(
          "https://graph.microsoft.com/v1.0/me/events",
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
          const error = await response.text();
          console.error("❌ [OUTLOOK SYNC] Failed to create event:", error);
          results.push({ success: false, event: event.subject, error });
        } else {
          const created = await response.json();
          console.log("✅ [OUTLOOK SYNC] Event created:", event.subject);
          results.push({ success: true, event: event.subject, id: created.id });
        }
      } catch (error: unknown) {
        console.error("❌ [OUTLOOK SYNC] Exception creating event:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({
          success: false,
          event: event.subject,
          error: errorMessage,
        });
      }
    }

    // Store sync record
    const { error: syncError } = await supabase.from("calendar_sync_tokens").upsert({
      user_id: authData.user.id,
      provider: "outlook",
      last_synced_at: new Date().toISOString(),
    });

    if (syncError) {
      console.error("⚠️ [OUTLOOK SYNC] Failed to update sync record:", syncError);
    }

    console.log("✅ [OUTLOOK SYNC] Completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Outlook Calendar sync completed",
        results,
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("❌ [OUTLOOK SYNC ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
