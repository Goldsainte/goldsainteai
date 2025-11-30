import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TravelPreferences {
  travel_style: string[];
  budget_preference: string;
  preferred_destinations: string[];
  preferred_accommodation_types: string[];
  dietary_restrictions: string[];
  travel_companions: string;
  trip_frequency: string;
  booking_preferences: Record<string, any>;
}

interface CuratedItinerary {
  id: string;
  title: string;
  heroImageUrl: string;
  primaryDestination: string;
  vibeTags: string[];
  durationNights: number;
  headline: string;
  budgetRange?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, count = 10 } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user preferences
    const { data: preferences, error: prefsError } = await supabase
      .from("user_travel_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
    }

    // Build prompt based on preferences
    const prefsContext = buildPreferencesContext(preferences);

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      // Return fallback itineraries
      return new Response(
        JSON.stringify({ itineraries: getFallbackItineraries() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a luxury travel curator for Goldsainte, an AI-powered travel platform. 
Generate ${count} diverse, inspiring trip itineraries based on the traveler's preferences.

Each itinerary should feel curated and aspirational, matching the aesthetic of luxury travel publications like Condé Nast Traveler.

For each itinerary, provide:
- title: A compelling, evocative title (e.g., "Amalfi Coast Slow Living")
- primaryDestination: The main location (city/region, country)
- vibeTags: 3-4 mood/style tags (e.g., "romantic", "coastal", "culinary", "adventure")
- durationNights: Suggested trip length (4-14 nights)
- headline: 1-2 sentence description capturing the essence
- heroImageKeyword: A search term for finding a beautiful image (e.g., "amalfi coast sunset")

Make itineraries globally diverse - include destinations from Europe, Asia, Americas, Middle East, Africa, and Oceania.

${prefsContext}

Respond with a JSON array of itinerary objects.`;

    console.log("Calling OpenAI to generate curated itineraries for user:", userId);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate ${count} personalized travel itineraries. Return only valid JSON array.` 
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      // Return fallback itineraries on error
      return new Response(
        JSON.stringify({ itineraries: getFallbackItineraries() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    let itineraries: CuratedItinerary[] = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rawItineraries = JSON.parse(jsonMatch[0]);
        
        // Transform and add image URLs
        itineraries = rawItineraries.map((item: any, index: number) => ({
          id: `curated-${Date.now()}-${index}`,
          title: item.title || "Untitled Journey",
          heroImageUrl: getUnsplashImage(item.heroImageKeyword || item.primaryDestination),
          primaryDestination: item.primaryDestination || "Unknown",
          vibeTags: item.vibeTags || [],
          durationNights: item.durationNights || 7,
          headline: item.headline || "",
          budgetRange: item.budgetRange,
        }));
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      itineraries = getFallbackItineraries();
    }

    console.log(`Generated ${itineraries.length} curated itineraries for user:`, userId);

    return new Response(
      JSON.stringify({ itineraries }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in curated-itineraries:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", itineraries: getFallbackItineraries() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPreferencesContext(prefs: TravelPreferences | null): string {
  if (!prefs) {
    return "No specific preferences provided - suggest a diverse mix of popular and hidden-gem destinations.";
  }

  const parts: string[] = [];

  if (prefs.travel_style?.length) {
    parts.push(`Travel styles they enjoy: ${prefs.travel_style.join(", ")}`);
  }

  if (prefs.budget_preference) {
    parts.push(`Budget preference: ${prefs.budget_preference}`);
  }

  if (prefs.preferred_destinations?.length) {
    parts.push(`Preferred destinations/regions: ${prefs.preferred_destinations.join(", ")}`);
  }

  if (prefs.preferred_accommodation_types?.length) {
    parts.push(`Accommodation preferences: ${prefs.preferred_accommodation_types.join(", ")}`);
  }

  if (prefs.travel_companions) {
    parts.push(`Usually travels: ${prefs.travel_companions}`);
  }

  if (prefs.dietary_restrictions?.length) {
    parts.push(`Dietary considerations: ${prefs.dietary_restrictions.join(", ")}`);
  }

  const bookingPrefs = prefs.booking_preferences || {};
  if (bookingPrefs.vibe?.travelVibe) {
    parts.push(`Travel vibe: ${bookingPrefs.vibe.travelVibe}`);
  }

  if (parts.length === 0) {
    return "Suggest a diverse mix of destinations suited to discerning travelers.";
  }

  return `Traveler preferences:\n${parts.join("\n")}\n\nTailor suggestions to match these preferences while still offering diverse options.`;
}

function getUnsplashImage(keyword: string): string {
  const encodedKeyword = encodeURIComponent(keyword || "luxury travel");
  return `https://source.unsplash.com/800x600/?${encodedKeyword}`;
}

function getFallbackItineraries(): CuratedItinerary[] {
  return [
    {
      id: "fallback-1",
      title: "Amalfi Coast Slow Living",
      heroImageUrl: "https://source.unsplash.com/800x600/?amalfi-coast-italy",
      primaryDestination: "Positano, Italy",
      vibeTags: ["coastal", "romantic", "culinary"],
      durationNights: 7,
      headline: "Winding coastal roads, lemon groves, and seaside dinners at sunset.",
    },
    {
      id: "fallback-2",
      title: "Kyoto Temple Trail",
      heroImageUrl: "https://source.unsplash.com/800x600/?kyoto-temple",
      primaryDestination: "Kyoto, Japan",
      vibeTags: ["cultural", "zen", "historic"],
      durationNights: 5,
      headline: "Ancient temples, bamboo forests, and the art of slow travel.",
    },
    {
      id: "fallback-3",
      title: "Patagonian Wilderness",
      heroImageUrl: "https://source.unsplash.com/800x600/?patagonia-mountains",
      primaryDestination: "Torres del Paine, Chile",
      vibeTags: ["adventure", "nature", "remote"],
      durationNights: 10,
      headline: "Dramatic peaks, glacial lakes, and untouched wilderness at the edge of the world.",
    },
    {
      id: "fallback-4",
      title: "Marrakech Medina Magic",
      heroImageUrl: "https://source.unsplash.com/800x600/?marrakech-morocco",
      primaryDestination: "Marrakech, Morocco",
      vibeTags: ["exotic", "design", "culinary"],
      durationNights: 4,
      headline: "Spice markets, hidden riads, and rooftop sunsets over the medina.",
    },
    {
      id: "fallback-5",
      title: "Santorini Blue Hour",
      heroImageUrl: "https://source.unsplash.com/800x600/?santorini-greece",
      primaryDestination: "Santorini, Greece",
      vibeTags: ["romantic", "coastal", "luxury"],
      durationNights: 5,
      headline: "White-washed villages, volcanic beaches, and legendary sunsets.",
    },
    {
      id: "fallback-6",
      title: "Bali Wellness Retreat",
      heroImageUrl: "https://source.unsplash.com/800x600/?bali-rice-terrace",
      primaryDestination: "Ubud, Bali",
      vibeTags: ["wellness", "spiritual", "nature"],
      durationNights: 8,
      headline: "Rice terraces, yoga retreats, and sacred water temples.",
    },
    {
      id: "fallback-7",
      title: "Swiss Alps Adventure",
      heroImageUrl: "https://source.unsplash.com/800x600/?swiss-alps",
      primaryDestination: "Zermatt, Switzerland",
      vibeTags: ["adventure", "scenic", "luxury"],
      durationNights: 6,
      headline: "Panoramic train journeys, alpine villages, and Matterhorn views.",
    },
    {
      id: "fallback-8",
      title: "Cape Town Coastal Escape",
      heroImageUrl: "https://source.unsplash.com/800x600/?cape-town-beach",
      primaryDestination: "Cape Town, South Africa",
      vibeTags: ["adventure", "wine", "scenic"],
      durationNights: 7,
      headline: "Table Mountain, penguin colonies, and world-class wine country.",
    },
  ];
}
