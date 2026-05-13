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

// Destination-specific image mapping for accurate visuals
const DESTINATION_IMAGES: Record<string, string[]> = {
  "italy": [
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop", // Amalfi
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop", // Italy coast
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop", // Venice
  ],
  "amalfi": ["https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop"],
  "positano": ["https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop"],
  "venice": ["https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop"],
  "rome": ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop"],
  "tuscany": ["https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=800&h=600&fit=crop"],
  "france": [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop", // Paris
    "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800&h=600&fit=crop", // Provence
  ],
  "paris": ["https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop"],
  "provence": ["https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800&h=600&fit=crop"],
  "japan": [
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop", // Kyoto
    "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop", // Tokyo
  ],
  "kyoto": ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop"],
  "tokyo": ["https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop"],
  "greece": [
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop", // Santorini
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop", // Greek islands
  ],
  "santorini": ["https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop"],
  "morocco": ["https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop"],
  "marrakech": ["https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop"],
  "bali": ["https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop"],
  "indonesia": ["https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop"],
  "dubai": ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop"],
  "uae": ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop"],
  "maldives": ["https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=800&h=600&fit=crop"],
  "safari": [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop", // Elephants at sunset
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=600&fit=crop", // Safari jeep with giraffe
  ],
  "kenya": [
    "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=600&fit=crop", // Maasai Mara
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop", // Elephants
  ],
  "tanzania": [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop", // Elephants
    "https://images.unsplash.com/photo-1534177616064-ef6e3caa47a0?w=800&h=600&fit=crop", // Serengeti plains
  ],
  "serengeti": ["https://images.unsplash.com/photo-1534177616064-ef6e3caa47a0?w=800&h=600&fit=crop"],
  "africa": [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop", // Elephants
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=600&fit=crop", // Safari scene
  ],
  "patagonia": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
  "chile": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
  "argentina": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
  "mexico": ["https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=800&h=600&fit=crop"],
  "tulum": ["https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=800&h=600&fit=crop"],
  "thailand": ["https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop"],
  "phuket": ["https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop"],
  "vietnam": ["https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop"],
  "portugal": ["https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800&h=600&fit=crop"],
  "lisbon": ["https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800&h=600&fit=crop"],
  "spain": ["https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop"],
  "barcelona": ["https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop"],
  "peru": ["https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop"],
  "machu picchu": ["https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop"],
  "iceland": ["https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&h=600&fit=crop"],
  "norway": ["https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800&h=600&fit=crop"],
  "new zealand": ["https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=600&fit=crop"],
  "australia": ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop"],
  "switzerland": ["https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop"],
  "austria": ["https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop"],
  "croatia": ["https://images.unsplash.com/photo-1555990538-1e6c0c3e2f3d?w=800&h=600&fit=crop"],
  "costa rica": ["https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=800&h=600&fit=crop"],
  "caribbean": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"],
  "beach": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"],
  "mountains": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
  "lake": ["https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop"],
};

// Fallback pool for unknown destinations
const FALLBACK_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { userId, count = 10, forceRefresh = false } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========== Phase 1: Check Cache First ==========
    const { data: preferences } = await supabase
      .from("user_travel_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const prefsHash = hashObject(preferences);
    
    // Fetch behavioral data for hashing
    const behavioralData = await fetchBehavioralData(supabase, userId);
    const behavioralHash = hashObject(behavioralData);

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("curated_itineraries_cache")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached && cached.preferences_hash === prefsHash && cached.behavioral_hash === behavioralHash) {
        console.log("Returning cached itineraries for user:", userId);
        return new Response(
          JSON.stringify({ itineraries: cached.itineraries, cached: true }),
          { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // ========== Phase 2: Build Enhanced Context with Behavioral Learning ==========
    const prefsContext = buildPreferencesContext(preferences);
    const behavioralContext = buildBehavioralContext(behavioralData);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ itineraries: getFallbackItineraries() }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ========== Phase 3: Enhanced Prompt for Complete Itineraries ==========
    const systemPrompt = `You are a luxury travel curator for Goldsainte, an AI-powered travel platform.
Generate ${count} diverse, inspiring trip itineraries based on the traveler's preferences AND their recent behavior on the platform.

Each itinerary should feel curated and aspirational, matching the aesthetic of luxury travel publications like Condé Nast Traveler.

For each itinerary, provide:
- title: A compelling, evocative title (e.g., "Amalfi Coast Slow Living")
- primaryDestination: The main location (city/region, country)
- vibeTags: 3-4 mood/style tags (e.g., "romantic", "coastal", "culinary", "adventure")
- durationNights: Suggested trip length (4-14 nights)
- headline: 1-2 sentence description capturing the essence
- heroImageKeyword: A search term for finding a beautiful image (use the destination name)
- itinerary: COMPLETE day-by-day activities array

**CRITICAL RULE FOR ITINERARY LENGTH:**
The 'itinerary' array MUST contain EXACTLY durationNights + 1 days (arrival day + each night).
- If durationNights is 7, provide 8 days of itinerary (Day 1 through Day 8)
- If durationNights is 10, provide 11 days of itinerary
- If durationNights is 5, provide 6 days of itinerary
- NEVER truncate or shorten the itinerary. Every single day must be detailed.

Each day in the itinerary array must have:
- dayNumber: The day number (1, 2, 3, etc.)
- title: A catchy title for the day
- description: 2-3 sentences describing the day's vibe
- activities: Array of 3-4 specific activities
- meals: Where/what to eat
- accommodation: Where to stay

Make itineraries globally diverse - include destinations from Europe, Asia, Americas, Middle East, Africa, and Oceania.

${prefsContext}

${behavioralContext}

Respond with a JSON array of itinerary objects. Ensure EVERY itinerary has COMPLETE day-by-day coverage.`;

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
            content: `Generate ${count} personalized travel itineraries with COMPLETE day-by-day details. Remember: if durationNights is N, you must provide N+1 days in the itinerary array. Return only valid JSON array.` 
          },
        ],
        temperature: 0.85,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ itineraries: getFallbackItineraries() }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    let itineraries: CuratedItinerary[] = [];
    try {
      let jsonText = content.trim();
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
      else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
      if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
      
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rawItineraries = JSON.parse(jsonMatch[0]);
        
        // ========== Phase 4: Destination-Matched Images ==========
        itineraries = rawItineraries.map((item: any, index: number) => {
          const destination = item.primaryDestination || "";
          const heroImageUrl = getDestinationImage(destination, item.heroImageKeyword, index);
          
          // Validate and fix itinerary length
          let itinerary = item.itinerary || [];
          const expectedDays = (item.durationNights || 7) + 1;
          
          if (itinerary.length < expectedDays) {
            console.warn(`Itinerary for "${item.title}" has ${itinerary.length} days but should have ${expectedDays}. Padding...`);
            // Pad with placeholder days if needed
            while (itinerary.length < expectedDays) {
              const dayNum = itinerary.length + 1;
              const isLastDay = dayNum === expectedDays;
              itinerary.push({
                dayNumber: dayNum,
                title: isLastDay ? "Departure Day" : `Day ${dayNum} Exploration`,
                description: isLastDay 
                  ? "Final morning in this beautiful destination before heading home with wonderful memories."
                  : `Continue exploring ${destination} at your own pace, discovering hidden gems and local favorites.`,
                activities: isLastDay 
                  ? ["Leisurely breakfast", "Last-minute shopping or sightseeing", "Airport transfer and departure"]
                  : ["Morning exploration", "Local market visit", "Afternoon relaxation", "Evening dining experience"],
                meals: isLastDay ? "Breakfast at hotel" : "All meals at local establishments",
                accommodation: isLastDay ? "Departure" : item.itinerary?.[0]?.accommodation || "Luxury hotel"
              });
            }
          }

          return {
            id: `curated-${Date.now()}-${index}`,
            title: item.title || "Untitled Journey",
            heroImageUrl,
            primaryDestination: destination,
            vibeTags: item.vibeTags || [],
            durationNights: item.durationNights || 7,
            headline: item.headline || "",
            budgetRange: item.budgetRange,
            itinerary,
          };
        });
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      itineraries = getFallbackItineraries();
    }

    // ========== Cache the Results ==========
    await supabase
      .from("curated_itineraries_cache")
      .upsert({
        user_id: userId,
        itineraries,
        preferences_hash: prefsHash,
        behavioral_hash: behavioralHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id" });

    console.log(`Generated and cached ${itineraries.length} itineraries for user:`, userId);

    return new Response(
      JSON.stringify({ itineraries, cached: false }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in curated-itineraries:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", itineraries: getFallbackItineraries() }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

// ========== Behavioral Data Fetching ==========
async function fetchBehavioralData(supabase: any, userId: string) {
  const [searchHistory, storyboards, tripRequests, recentMessages] = await Promise.all([
    supabase.from("search_history").select("query, destination, filters").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("storyboards").select("title, description, tags").eq("owner_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("trip_requests").select("destination, description, budget_min, budget_max, start_date, end_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("chat_messages").select("content").eq("user_id", userId).eq("role", "user").order("created_at", { ascending: false }).limit(30),
  ]);

  return {
    searches: searchHistory.data || [],
    storyboards: storyboards.data || [],
    tripRequests: tripRequests.data || [],
    messages: recentMessages.data || [],
  };
}

// ========== Build Behavioral Context for AI ==========
function buildBehavioralContext(data: any): string {
  const parts: string[] = [];

  // Extract destinations from searches
  if (data.searches?.length > 0) {
    const searchDestinations = data.searches
      .filter((s: any) => s.destination || s.query)
      .map((s: any) => s.destination || s.query)
      .slice(0, 5);
    if (searchDestinations.length > 0) {
      parts.push(`Recent searches: ${searchDestinations.join(", ")}`);
    }
  }

  // Extract themes from storyboards
  if (data.storyboards?.length > 0) {
    const storyboardThemes = data.storyboards
      .flatMap((s: any) => [s.title, ...(s.tags || [])])
      .filter(Boolean)
      .slice(0, 8);
    if (storyboardThemes.length > 0) {
      parts.push(`Storyboard themes: ${storyboardThemes.join(", ")}`);
    }
  }

  // Extract trip request patterns
  if (data.tripRequests?.length > 0) {
    const tripDestinations = data.tripRequests
      .map((t: any) => t.destination)
      .filter(Boolean)
      .slice(0, 5);
    if (tripDestinations.length > 0) {
      parts.push(`Trip requests for: ${tripDestinations.join(", ")}`);
    }
    
    // Budget patterns
    const budgets = data.tripRequests.filter((t: any) => t.budget_max);
    if (budgets.length > 0) {
      const avgBudget = Math.round(budgets.reduce((sum: number, t: any) => sum + (t.budget_max || 0), 0) / budgets.length);
      parts.push(`Average trip budget: $${avgBudget}`);
    }
  }

  // Extract topics from messages (to agents/Madison)
  if (data.messages?.length > 0) {
    const messageContent = data.messages.map((m: any) => m.content).join(" ").toLowerCase();
    const destinations = extractDestinationsFromText(messageContent);
    const interests = extractInterestsFromText(messageContent);
    
    if (destinations.length > 0) {
      parts.push(`Mentioned destinations in chats: ${destinations.slice(0, 5).join(", ")}`);
    }
    if (interests.length > 0) {
      parts.push(`Interests mentioned: ${interests.slice(0, 5).join(", ")}`);
    }
  }

  if (parts.length === 0) {
    return "";
  }

  return `\nBehavioral signals from platform activity:\n${parts.join("\n")}\n\nUse these signals to personalize recommendations beyond stated preferences.`;
}

// Helper to extract destination mentions from text
function extractDestinationsFromText(text: string): string[] {
  const destinations = [
    "italy", "france", "spain", "greece", "portugal", "japan", "thailand", "bali",
    "maldives", "morocco", "dubai", "mexico", "peru", "costa rica", "iceland",
    "norway", "switzerland", "croatia", "vietnam", "new zealand", "australia",
    "paris", "rome", "barcelona", "tokyo", "kyoto", "santorini", "amalfi",
    "marrakech", "lisbon", "amsterdam", "london", "machu picchu", "patagonia"
  ];
  
  return destinations.filter(d => text.includes(d));
}

// Helper to extract travel interests from text
function extractInterestsFromText(text: string): string[] {
  const interests = [
    "beach", "mountain", "hiking", "diving", "wine", "food", "culture", "history",
    "adventure", "luxury", "spa", "wellness", "safari", "photography", "art",
    "architecture", "nightlife", "family", "romantic", "honeymoon", "solo"
  ];
  
  return interests.filter(i => text.includes(i));
}

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

// ========== Phase 4: Destination-Matched Image Selection ==========
function getDestinationImage(destination: string, keyword: string, index: number): string {
  const searchTerms = `${destination} ${keyword || ""}`.toLowerCase();
  
  // Try to match against our curated destination images
  for (const [key, images] of Object.entries(DESTINATION_IMAGES)) {
    if (searchTerms.includes(key)) {
      return images[Math.floor(Math.random() * images.length)];
    }
  }
  
  // Fallback to index-based selection
  return FALLBACK_IMAGE_POOL[index % FALLBACK_IMAGE_POOL.length];
}

// Simple hash function for cache invalidation
function hashObject(obj: any): string {
  const str = JSON.stringify(obj || {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
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
        { dayNumber: 1, title: "Arrival & Sunset Aperitivo", description: "Settle into your cliffside hotel and watch the sun dip below the horizon.", activities: ["Airport transfer via scenic coastal route", "Check-in at Le Sirenuse", "Evening passeggiata through town", "Sunset aperitivo at Franco's Bar"], meals: "Dinner at La Sponda", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 2, title: "Ravello Gardens & Culture", description: "Explore the hilltop gardens of Ravello with panoramic sea views.", activities: ["Morning yoga on terrace", "Visit Villa Rufolo gardens", "Lunch in Ravello piazza", "Afternoon at Villa Cimbrone"], meals: "Lunch at Rossellinis, Dinner at hotel", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 3, title: "Cooking with Nonna", description: "Learn the secrets of Amalfi cuisine with a local family.", activities: ["Market visit in Amalfi", "Private cooking class", "Long Italian lunch", "Afternoon beach time"], meals: "Cooking class lunch, Light dinner", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 4, title: "Capri Day Trip", description: "Take the ferry to glamorous Capri for a day of exploration.", activities: ["Morning ferry to Capri", "Blue Grotto visit", "Lunch at Da Paolino", "Shopping in Capri town"], meals: "Lunch at Da Paolino, Dinner in Positano", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 5, title: "Path of the Gods Hike", description: "Walk the legendary coastal trail with breathtaking views.", activities: ["Early morning hike start", "Path of the Gods trek", "Lunch in Nocelle", "Afternoon spa treatment"], meals: "Picnic lunch, Dinner at Il San Pietro", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 6, title: "Beach & Wine", description: "A relaxed day between sea and vineyard.", activities: ["Morning at Spiaggia Grande", "Private boat to hidden beach", "Evening wine tasting", "Farewell dinner"], meals: "Beach lunch, Wine tasting dinner", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 7, title: "Final Exploration", description: "One more day to soak in the Amalfi magic.", activities: ["Morning boat trip along coast", "Visit Amalfi Cathedral", "Limoncello tasting", "Sunset on terrace"], meals: "Lunch in Amalfi, Dinner at hotel", accommodation: "Le Sirenuse, Positano" },
        { dayNumber: 8, title: "Departure", description: "Final morning in paradise before heading home.", activities: ["Leisurely breakfast", "Last stroll through Positano", "Airport transfer"], meals: "Breakfast at hotel", accommodation: "Departure" },
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
        { dayNumber: 5, title: "Geisha District & Gardens", description: "Final day exploring Kyoto's cultural heart.", activities: ["Morning visit to Kiyomizu-dera", "Explore Higashiyama district", "Philosopher's Path walk", "Evening in Pontocho alley"], meals: "Lunch at local cafe, Farewell dinner", accommodation: "Tawaraya Ryokan" },
        { dayNumber: 6, title: "Departure", description: "Final moments of tranquility before heading home.", activities: ["Morning onsen bath", "Last temple visit", "Departure"], meals: "Traditional breakfast", accommodation: "Departure" },
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
        { dayNumber: 4, title: "Grey Glacier Exploration", description: "Witness the majestic Grey Glacier up close.", activities: ["Boat trip to Grey Glacier", "Glacier hiking with crampons", "Ice cave exploration", "Evening wildlife spotting"], meals: "All meals at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 5, title: "French Valley Adventure", description: "Trek through one of Patagonia's most beautiful valleys.", activities: ["French Valley hike", "Hanging glacier views", "Alpine meadows walk", "Hot tub under stars"], meals: "Packed lunch, Dinner at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 6, title: "Horseback Riding Day", description: "Experience Patagonia like the gauchos.", activities: ["Morning horseback ride", "Estancia visit", "Traditional asado lunch", "Afternoon at leisure"], meals: "Asado lunch, Dinner at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 7, title: "Lake Pehoé & Wildlife", description: "Kayaking and wildlife photography day.", activities: ["Morning kayak on Lake Pehoé", "Guanaco and condor watching", "Waterfall hikes", "Sunset photography session"], meals: "All meals at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 8, title: "Paine Grande Circuit", description: "Hiking the northern section of the famous W trek.", activities: ["Paine Grande hike", "Mountain refugio visit", "Alpine lake swimming", "Evening stargazing"], meals: "All meals at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 9, title: "Final Patagonia Day", description: "Last chance to explore this wild wonderland.", activities: ["Sunrise hike", "Cave paintings visit", "Final wildlife drive", "Farewell dinner"], meals: "All meals at lodge", accommodation: "Explora Patagonia" },
        { dayNumber: 10, title: "Return to Punta Arenas", description: "Drive back through the pampa with stops along the way.", activities: ["Morning at leisure", "Scenic drive back", "Lunch en route", "Evening in Punta Arenas"], meals: "Lunch en route, Dinner in town", accommodation: "Hotel Dreams del Estrecho" },
        { dayNumber: 11, title: "Departure", description: "Say goodbye to Patagonia.", activities: ["Breakfast", "Airport transfer", "Departure"], meals: "Breakfast at hotel", accommodation: "Departure" },
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
        { dayNumber: 4, title: "Gardens & Relaxation", description: "A day of beauty and calm.", activities: ["Majorelle Garden visit", "Yves Saint Laurent Museum", "Pool time at hotel", "Farewell dinner"], meals: "Light lunch, Dinner at Al Fassia", accommodation: "La Mamounia" },
        { dayNumber: 5, title: "Departure", description: "Final moments in the rose city.", activities: ["Last souk shopping", "Mint tea farewell", "Airport departure"], meals: "Breakfast at hotel", accommodation: "Departure" },
      ],
    },
  ];
}
