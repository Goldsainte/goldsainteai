import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const OPENAI_SYSTEM_PROMPT = `You are an expert luxury travel designer for Goldsainte. Based on the conversation history, create a detailed multi-day itinerary in pure JSON format.

REQUIRED JSON STRUCTURE:
{
  "destination": "string (e.g., 'Italy – Rome & Tuscany')",
  "tripTitle": "string (e.g., 'Food, wine & culture in Italy')",
  "tripSubtitle": "string (brief 1-sentence summary)",
  "days": [
    {
      "dayNumber": number,
      "label": "string (e.g., 'Arrival in Rome & first aperitivo')",
      "slots": [
        {
          "time": "string (HH:MM format, e.g., '15:00')",
          "title": "string (experience title)",
          "description": "string (2-3 sentences)",
          "category": "string (hotel|food & wine|culture|shopping|nature|nightlife)",
          "neighbourhood_or_area": "string (e.g., 'Trastevere')",
          "unsplash_query": "string (5-8 descriptive words for photo search, e.g., 'rome boutique hotel trastevere rooftop sunset')"
        }
      ]
    }
  ],
  "globalPhotoQueries": ["string array of 10-15 queries for overall trip vibe"]
}

INSTRUCTIONS:
- Create 3-7 days based on conversation context
- Each day should have 4-6 time-stamped experiences
- Times should flow logically: morning (08:00-11:00), midday (12:00-14:00), afternoon (15:00-18:00), evening (19:00-23:00)
- Each unsplash_query should be descriptive and specific to help find perfect visuals
- Include globalPhotoQueries for overall trip atmosphere photos
- Return ONLY valid JSON, no other text`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { conversationId, userId, ownerRole = "traveler", maxPhotos = 20 } = await req.json();

    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: "conversationId and userId required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load conversation history
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (messagesError) {
      console.error("Failed to load messages:", messagesError);
      return new Response(
        JSON.stringify({ error: "Failed to load conversation" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build conversation summary
    const conversationText = messages?.map((m) => `${m.role}: ${m.content}`).join("\n") || "";

    // Call OpenAI GPT-4o for structured itinerary
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Calling OpenAI to generate itinerary...");
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: OPENAI_SYSTEM_PROMPT },
          { role: "user", content: `Based on this conversation, create a detailed itinerary:\n\n${conversationText}` },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate itinerary" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const itineraryText = openaiData.choices[0].message.content;
    
    // Parse JSON response
    let itinerary;
    try {
      itinerary = JSON.parse(itineraryText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON:", itineraryText);
      return new Response(
        JSON.stringify({ error: "Invalid itinerary format" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Collect all Unsplash queries
    const unsplashQueries = new Set<string>();
    itinerary.days?.forEach((day: any) => {
      day.slots?.forEach((slot: any) => {
        if (slot.unsplash_query) unsplashQueries.add(slot.unsplash_query);
      });
    });
    itinerary.globalPhotoQueries?.forEach((q: string) => unsplashQueries.add(q));

    // Limit to maxPhotos queries
    const queries = Array.from(unsplashQueries).slice(0, maxPhotos);

    // Fetch photos from Unsplash
    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashKey) {
      console.warn("UNSPLASH_ACCESS_KEY not configured, skipping photos");
    }

    const photos: any[] = [];
    if (unsplashKey) {
      console.log(`Fetching ${queries.length} photos from Unsplash...`);
      for (const query of queries) {
        try {
          const url = new URL("https://api.unsplash.com/search/photos");
          url.searchParams.set("query", query);
          url.searchParams.set("per_page", "1");
          url.searchParams.set("orientation", "portrait");

          const response = await fetch(url.toString(), {
            headers: {
              Authorization: `Client-ID ${unsplashKey}`,
              "Accept-Version": "v1",
            },
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.results?.[0];
            if (result) {
              photos.push({
                unsplash_id: result.id,
                url: result.urls.regular,
                thumbnail_url: result.urls.thumb,
                alt: result.alt_description || query,
                location: result.location?.name || null,
                photographer: result.user?.name || null,
                query,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch photo for query "${query}":`, err);
        }
      }
      console.log(`Successfully fetched ${photos.length} photos`);
    }

    // Create storyboard
    const { data: storyboard, error: storyboardError } = await supabase
      .from("storyboards")
      .insert({
        owner_id: userId,
        owner_role: ownerRole,
        title: itinerary.tripTitle || `Trip to ${itinerary.destination}`,
        subtitle: itinerary.tripSubtitle || "AI-generated itinerary from Madison",
        visibility: "private",
      })
      .select("id")
      .single();

    if (storyboardError || !storyboard) {
      console.error("Failed to create storyboard:", storyboardError);
      return new Response(
        JSON.stringify({ error: "Failed to create storyboard" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const storyboardId = storyboard.id;

    // Insert storyboard items (experiences + photos interleaved)
    const items: any[] = [];
    let orderIndex = 0;

    // Add experiences
    itinerary.days?.forEach((day: any) => {
      day.slots?.forEach((slot: any) => {
        items.push({
          storyboard_id: storyboardId,
          order_index: orderIndex++,
          caption: slot.title,
          location_label: slot.neighbourhood_or_area,
          day_number: day.dayNumber,
          time_of_day: slot.time,
          category_tag: slot.category,
          media_url: null, // text-only experience
          layout_type: "masonry",
        });
      });
    });

    // Add photos interleaved
    photos.forEach((photo, index) => {
      items.push({
        storyboard_id: storyboardId,
        order_index: orderIndex++,
        caption: photo.alt,
        media_url: photo.url,
        media_attribution: `Photo by ${photo.photographer} on Unsplash`,
        location_label: photo.location,
        layout_type: "masonry",
      });
    });

    // Insert all items
    const { error: itemsError } = await supabase.from("storyboard_items").insert(items);

    if (itemsError) {
      console.error("Failed to insert items:", itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to create storyboard items" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`Created storyboard ${storyboardId} with ${items.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        storyboardId,
        itemsCreated: items.length,
        photosAdded: photos.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ai-storyboard-itinerary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
