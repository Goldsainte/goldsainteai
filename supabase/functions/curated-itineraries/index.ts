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

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  meals: string;
  accommodation: string;
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
  itinerary?: ItineraryDay[];
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
- itinerary: An array of day-by-day activities with this structure for EACH day:
  - dayNumber: The day number (1, 2, 3, etc.)
  - title: A catchy title for the day (e.g., "Arrival & Sunset Aperitivo")
  - description: 2-3 sentences describing the day's vibe and highlights
  - activities: Array of 3-4 specific activities (e.g., "Morning yoga at cliffside terrace", "Private cooking class with local chef")
  - meals: Where/what to eat (e.g., "Breakfast at hotel, Lunch at seaside trattoria, Dinner at Michelin-starred Da Adolfo")
  - accommodation: Where to stay that night (e.g., "Le Sirenuse, Positano")

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
            content: `Generate ${count} personalized travel itineraries with complete day-by-day details. Return only valid JSON array.` 
          },
        ],
        temperature: 0.8,
        max_tokens: 8000,
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
          heroImageUrl: getUnsplashImage(item.heroImageKeyword || item.primaryDestination, index),
          primaryDestination: item.primaryDestination || "Unknown",
          vibeTags: item.vibeTags || [],
          durationNights: item.durationNights || 7,
          headline: item.headline || "",
          budgetRange: item.budgetRange,
          itinerary: item.itinerary || [],
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

// Curated Unsplash photo IDs for reliable, high-quality travel images
const TRAVEL_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // Mountains
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop", // Beach
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop", // Lake mountains
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop", // Santorini
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop", // Paris
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop", // Venice
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop", // Dubai
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop", // Kyoto
  "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop", // Morocco
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop", // Bali
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop", // Coast
  "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop", // Tokyo
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", // Safari
  "https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=800&h=600&fit=crop", // Maldives
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop", // Amalfi
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop", // Italy coast
];

function getUnsplashImage(keyword: string, index: number = 0): string {
  // Use index to ensure variety, cycling through the pool
  return TRAVEL_IMAGE_POOL[index % TRAVEL_IMAGE_POOL.length];
}

function getFallbackItineraries(): CuratedItinerary[] {
  return [
    {
      id: "fallback-1",
      title: "Amalfi Coast Slow Living",
      heroImageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop",
      primaryDestination: "Positano, Italy",
      vibeTags: ["coastal", "romantic", "culinary"],
      durationNights: 7,
      headline: "Winding coastal roads, lemon groves, and seaside dinners at sunset.",
      itinerary: [
        { dayNumber: 1, title: "Arrival & Sunset Aperitivo", description: "Settle into your cliffside hotel and watch the sun dip below the horizon with a spritz in hand.", activities: ["Airport transfer via scenic coastal route", "Check-in at Le Sirenuse", "Evening passeggiata through town", "Sunset aperitivo at Franco's Bar"], meals: "Dinner at La Sponda", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 2, title: "Ravello Gardens & Culture", description: "Explore the hilltop gardens of Ravello with panoramic sea views.", activities: ["Morning yoga on terrace", "Visit Villa Rufolo gardens", "Lunch in Ravello piazza", "Afternoon at Villa Cimbrone"], meals: "Lunch at Rossellinis, Dinner at hotel", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 3, title: "Cooking with Nonna", description: "Learn the secrets of Amalfi cuisine with a local family.", activities: ["Market visit in Amalfi", "Private cooking class", "Long Italian lunch", "Afternoon beach time"], meals: "Cooking class lunch, Light dinner", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 4, title: "Capri Day Trip", description: "Take the ferry to glamorous Capri for a day of exploration.", activities: ["Morning ferry to Capri", "Blue Grotto visit", "Lunch at Da Paolino", "Shopping in Capri town"], meals: "Lunch at Da Paolino, Dinner in Positano", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 5, title: "Path of the Gods Hike", description: "Walk the legendary coastal trail with breathtaking views.", activities: ["Early morning hike start", "Path of the Gods trek", "Lunch in Nocelle", "Afternoon spa treatment"], meals: "Picnic lunch, Dinner at Il San Pietro", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 6, title: "Beach & Wine", description: "A relaxed day between sea and vineyard.", activities: ["Morning at Spiaggia Grande", "Private boat to hidden beach", "Evening wine tasting", "Farewell dinner"], meals: "Beach lunch, Wine tasting dinner", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 7, title: "Departure", description: "Final morning in paradise before heading home.", activities: ["Leisurely breakfast", "Last stroll through Positano", "Airport transfer"], meals: "Breakfast at hotel", accommodation: "Departure" },
      ],
    },
    {
      id: "fallback-2",
      title: "Kyoto Temple Trail",
      heroImageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop",
      primaryDestination: "Kyoto, Japan",
      vibeTags: ["cultural", "zen", "historic"],
      durationNights: 5,
      headline: "Ancient temples, bamboo forests, and the art of slow travel.",
      itinerary: [
        { dayNumber: 1, title: "Arrival in Ancient Kyoto", description: "Arrive and settle into a traditional ryokan experience.", activities: ["Shinkansen from Tokyo", "Check-in at Tawaraya Ryokan", "Evening stroll in Gion", "Kaiseki dinner"], meals: "Kaiseki dinner at ryokan", accommodation: "Tawaraya Ryokan" },
        { dayNumber: 2, title: "Golden Pavilion & Zen Gardens", description: "Explore Kyoto's most iconic temples and gardens.", activities: ["Kinkaku-ji (Golden Pavilion)", "Ryoan-ji Zen garden", "Lunch in Arashiyama", "Bamboo Grove walk"], meals: "Lunch at Shoraian, Dinner at Kikunoi", accommodation: "Tawaraya Ryokan" },
        { dayNumber: 3, title: "Tea Ceremony & Crafts", description: "Immerse yourself in traditional Japanese arts.", activities: ["Morning meditation at temple", "Private tea ceremony", "Visit to sake brewery", "Afternoon at kimono workshop"], meals: "Bento lunch, Dinner at Gion Nanba", accommodation: "Tawaraya Ryokan" },
        { dayNumber: 4, title: "Fushimi Inari & Nara", description: "Walk through thousands of vermillion torii gates.", activities: ["Early morning at Fushimi Inari", "Day trip to Nara", "Feed the sacred deer", "Visit Todai-ji temple"], meals: "Local lunch in Nara, Dinner at ryokan", accommodation: "Tawaraya Ryokan" },
        { dayNumber: 5, title: "Departure", description: "Final moments of tranquility before heading home.", activities: ["Morning onsen bath", "Last temple visit", "Departure"], meals: "Traditional breakfast", accommodation: "Departure" },
      ],
    },
    {
      id: "fallback-3",
      title: "Patagonian Wilderness",
      heroImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      primaryDestination: "Torres del Paine, Chile",
      vibeTags: ["adventure", "nature", "remote"],
      durationNights: 10,
      headline: "Dramatic peaks, glacial lakes, and untouched wilderness at the edge of the world.",
      itinerary: [
        { dayNumber: 1, title: "Arrival in Punta Arenas", description: "Gateway to the end of the world.", activities: ["Arrive Punta Arenas", "City walking tour", "Visit penguin colony", "Welcome dinner"], meals: "Dinner at La Marmita", accommodation: "Hotel Dreams del Estrecho" },
        { dayNumber: 2, title: "Journey to Torres del Paine", description: "Drive through vast Patagonian steppes to the park.", activities: ["Scenic drive to park", "Check-in at Explora Patagonia", "Afternoon orientation hike", "Sunset views"], meals: "All meals at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 3, title: "Base Torres Trek", description: "The iconic hike to the towers.", activities: ["Early start for Base Torres", "10-hour round trip hike", "Glacier views", "Recovery at spa"], meals: "Packed lunch, Dinner at lodge", accommodation: "Explora Patagonia" },
      ],
    },
    {
      id: "fallback-4",
      title: "Marrakech Medina Magic",
      heroImageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop",
      primaryDestination: "Marrakech, Morocco",
      vibeTags: ["exotic", "design", "culinary"],
      durationNights: 4,
      headline: "Spice markets, hidden riads, and rooftop sunsets over the medina.",
      itinerary: [
        { dayNumber: 1, title: "Enter the Medina", description: "Step into a world of color, scent, and sound.", activities: ["Private airport transfer", "Check-in at La Mamounia", "Guided medina walk", "Rooftop dinner"], meals: "Dinner at Nomad", accommodation: "La Mamounia" },
        { dayNumber: 2, title: "Souks & Secrets", description: "Navigate the labyrinthine markets with a local guide.", activities: ["Spice market tour", "Artisan workshops visit", "Traditional hammam", "Cooking class"], meals: "Lunch at Café des Épices, Dinner at Le Jardin", accommodation: "La Mamounia" },
        { dayNumber: 3, title: "Atlas Mountains", description: "Escape to the mountains for a day.", activities: ["Drive to Atlas Mountains", "Berber village visit", "Mountain lunch", "Return for sunset"], meals: "Berber lunch, Dinner at hotel", accommodation: "La Mamounia" },
        { dayNumber: 4, title: "Departure", description: "Final moments in the rose city.", activities: ["Majorelle Garden visit", "Last souk shopping", "Departure"], meals: "Breakfast at hotel", accommodation: "Departure" },
      ],
    },
    {
      id: "fallback-5",
      title: "Santorini Blue Hour",
      heroImageUrl: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop",
      primaryDestination: "Santorini, Greece",
      vibeTags: ["romantic", "coastal", "luxury"],
      durationNights: 5,
      headline: "White-washed villages, volcanic beaches, and legendary sunsets.",
      itinerary: [
        { dayNumber: 1, title: "Arrival in Paradise", description: "Land on the volcanic island and settle into your cave suite.", activities: ["Ferry or flight arrival", "Check-in at Canaves Oia", "Pool time with caldera views", "Sunset dinner in Oia"], meals: "Dinner at Floga", accommodation: "Canaves Oia" },
        { dayNumber: 2, title: "Wine & Volcano", description: "Explore the island's volcanic heritage and wine culture.", activities: ["Morning at Red Beach", "Volcano boat tour", "Hot springs swim", "Sunset wine tasting"], meals: "Lunch at Metaxy Mas, Dinner at Selene", accommodation: "Canaves Oia" },
      ],
    },
  ];
}
