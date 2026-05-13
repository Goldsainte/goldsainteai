import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { storyboardId } = await req.json();
    if (!storyboardId) {
      return new Response(
        JSON.stringify({ error: "storyboardId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Load storyboard
    const { data: storyboard, error: sbError } = await supabase
      .from("storyboards")
      .select("*")
      .eq("id", storyboardId)
      .eq("owner_id", user.id)
      .single();

    if (sbError || !storyboard) {
      return new Response(
        JSON.stringify({ error: "Storyboard not found or not owned by you" }),
        {
          status: 404,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Load items
    const { data: items } = await supabase
      .from("storyboard_items")
      .select("*")
      .eq("storyboard_id", storyboardId)
      .order("position", { ascending: true });

    const itemDescriptions = (items || [])
      .map(
        (item: any, i: number) =>
          `Pin ${i + 1}: ${item.title || "Untitled"}${item.subtitle ? ` — ${item.subtitle}` : ""}${item.description ? `. ${item.description}` : ""}`
      )
      .join("\n");

    const coverImage =
      (items || []).find((i: any) => i.image_url)?.image_url || null;

    // Call OpenAI with tool calling for structured output
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content: `You are a luxury travel product designer for Goldsainte, an ultra-premium travel marketplace. Convert visual storyboard inspiration into a bookable trip listing with luxury-tier language. Be specific, evocative, and aspirational. Output must feel like a Five-Star travel brochure.`,
            },
            {
              role: "user",
              content: `Convert this storyboard into a marketplace trip listing.\n\nStoryboard title: ${storyboard.title}\nDestination: ${storyboard.destination || "Not specified"}\nDescription: ${storyboard.description || "None"}\nTags: ${(storyboard.tags || []).join(", ") || "None"}\n\nPins:\n${itemDescriptions || "No pins yet"}\n\nGenerate a complete trip listing.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_trip_listing",
                description:
                  "Generate a structured luxury trip listing from storyboard data",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description:
                        "Compelling trip title, max 80 chars, luxury tone",
                    },
                    description: {
                      type: "string",
                      description:
                        "Rich 2-3 paragraph description of the experience",
                    },
                    destination: {
                      type: "string",
                      description: "Primary destination city/region",
                    },
                    duration_days: {
                      type: "number",
                      description: "Suggested duration in days",
                    },
                    duration_nights: {
                      type: "number",
                      description: "Number of nights",
                    },
                    highlights: {
                      type: "array",
                      items: { type: "string" },
                      description: "5-8 trip highlights",
                    },
                    included: {
                      type: "array",
                      items: { type: "string" },
                      description: "What is included in the trip",
                    },
                    not_included: {
                      type: "array",
                      items: { type: "string" },
                      description: "What is not included",
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-6 category tags",
                    },
                    price_per_person: {
                      type: "number",
                      description:
                        "Suggested price per person in USD (luxury tier)",
                    },
                    activity_level: {
                      type: "string",
                      enum: ["relaxed", "moderate", "active", "challenging"],
                    },
                  },
                  required: [
                    "title",
                    "description",
                    "destination",
                    "duration_days",
                    "duration_nights",
                    "highlights",
                    "included",
                    "not_included",
                    "tags",
                    "price_per_person",
                    "activity_level",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_trip_listing" },
          },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", openaiResponse.status, errText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No structured output from AI");
    }

    const tripData = JSON.parse(toolCall.function.arguments);

    // Generate slug
    const slug = tripData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Insert into packaged_trips
    const { data: newTrip, error: insertError } = await supabase
      .from("packaged_trips")
      .insert({
        title: tripData.title,
        slug,
        description: tripData.description,
        destination: tripData.destination,
        duration_days: tripData.duration_days,
        duration_nights: tripData.duration_nights,
        highlights: tripData.highlights,
        included: tripData.included,
        not_included: tripData.not_included,
        tags: tripData.tags,
        price_per_person: tripData.price_per_person,
        activity_level: tripData.activity_level,
        cover_image_url: coverImage,
        status: "draft",
        creator_id: user.id,
        creator_type: "creator",
        storyboard_id: storyboardId,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save trip draft: " + insertError.message);
    }

    return new Response(
      JSON.stringify({ tripId: newTrip.id, slug: newTrip.slug }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("storyboard-to-trip error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
