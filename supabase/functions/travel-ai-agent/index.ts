import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Shared helper: Map common city abbreviations and airport codes to full names
function getCityVariations(location: string): string[] {
  const normalizeLocation = (loc: string) => 
    (loc || '').toLowerCase().replace(/\s+city\s*/gi, '').trim();
  
  const cityAbbreviations: { [key: string]: string[] } = {
    'nyc': ['new york', 'ny'],
    'jfk': ['new york', 'ny', 'nyc'],
    'lga': ['new york', 'ny', 'nyc'],
    'ewr': ['new york', 'ny', 'nyc', 'newark'],
    'la': ['los angeles'],
    'lax': ['los angeles', 'la'],
    'sf': ['san francisco'],
    'sfo': ['san francisco', 'sf'],
    'dc': ['washington'],
    'dca': ['washington', 'dc'],
    'iad': ['washington', 'dc'],
    'philly': ['philadelphia'],
    'phl': ['philadelphia', 'philly'],
    'vegas': ['las vegas'],
    'las': ['las vegas', 'vegas'],
    'chi': ['chicago'],
    'ord': ['chicago', 'chi'],
    'mdw': ['chicago', 'chi'],
    'mia': ['miami'],
    'bos': ['boston'],
    'sea': ['seattle'],
    'atl': ['atlanta'],
    'dfw': ['dallas'],
    'dal': ['dallas'],
    'iah': ['houston'],
    'hou': ['houston'],
    'phx': ['phoenix'],
    'den': ['denver'],
    'mco': ['orlando'],
    'dtw': ['detroit'],
    'msp': ['minneapolis'],
    'pdx': ['portland'],
    'san': ['san diego'],
    'aus': ['austin'],
    'bna': ['nashville'],
    'slc': ['salt lake city'],
    'clt': ['charlotte']
  };
  
  const searchLocation = normalizeLocation(location);
  const searchVariations = [searchLocation];
  
  if (cityAbbreviations[searchLocation]) {
    searchVariations.push(...cityAbbreviations[searchLocation]);
  }
  
  // Also check if the search is a full name that matches an abbreviation
  for (const [abbrev, fullNames] of Object.entries(cityAbbreviations)) {
    if (fullNames.some((name) => {
      const n = (name || '').toLowerCase().trim();
      // Avoid false positives like "la" matching "atlanta"
      if (n.length < 3) return searchLocation === n; // exact match only for very short tokens
      return searchLocation.includes(n);
    })) {
      searchVariations.push(abbrev, ...fullNames);
    }
  }
  
  return [...new Set(searchVariations)]; // Remove duplicates
}

// Get the best/full city name from abbreviation or airport code
function normalizeCityName(location: string): string {
  const variations = getCityVariations(location);
  // Return the longest variation (usually the full name)
  return variations.sort((a, b) => b.length - a.length)[0] || location;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userLocation, isQuickLink = false, quickLinkType, usePreferences = true } = await req.json();
    
    console.log('=== AI AGENT REQUEST ===');
    console.log('User message:', message);
    console.log('History length:', conversationHistory.length);
    if (conversationHistory.length > 0) {
      console.log('Last message:', conversationHistory[conversationHistory.length - 1]);
    }
    console.log('Has location:', !!userLocation);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const BOOKING_API_KEY = Deno.env.get('BOOKING_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    if (!BOOKING_API_KEY) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Get user preferences if authenticated
    const authHeader = req.headers.get('authorization');
    let userPreferences = null;
    let userContext = '';
    
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
          const { data } = await supabaseClient
            .from('user_booking_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (data) {
            userPreferences = data;
            
            // Only include strict preferences if the user has them enabled
            if (usePreferences && data.use_preferences_in_search !== false) {
              userContext = `\n\n=== STRICT USER PREFERENCES - ENFORCE THESE AS HARD FILTERS ===

🏨 HOTEL PREFERENCES (Apply to ALL hotel searches):
- Min Star Rating: ${data.preferred_hotel_rating || 'Any'} stars
- Price Range: $${data.price_range_min || 20} - $${data.price_range_max || 1000} per night
- Distance from Center: Max ${data.distance_from_center || 'Any'} miles
- Distance from Airport: Max ${data.distance_from_airport || 'Any'} miles
- Room Type: ${data.room_type || 'Any'}
- Bed Type: ${data.bed_type || 'Any'}
- Property Types: ${data.property_types?.join(', ') || 'Any'}
- Required Amenities: ${data.preferred_amenities?.join(', ') || 'None'}
- Min Review Score: ${data.min_review_score || 'Any'}/10
- Must Have: ${[
  data.free_wifi && 'WiFi',
  data.breakfast_included && 'Breakfast',
  data.pool && 'Pool',
  data.gym && 'Gym',
  data.parking && 'Parking',
  data.pet_friendly && 'Pet-Friendly',
  data.airport_shuttle && 'Airport Shuttle',
  data.accessible_rooms && 'Accessible Rooms'
].filter(Boolean).join(', ') || 'No specific requirements'}

✈️ FLIGHT PREFERENCES (Apply to ALL flight searches):
- Cabin Class: ${data.cabin_class || 'Economy'}
- Max Price per Passenger: $${data.max_price_per_passenger || 1000}
- Max Duration: ${data.max_duration_hours || 'Any'} hours
- Max Layover: ${data.max_layover_hours || 'Any'} hours
- Max Stops: ${data.max_stops ?? 'Any'}
- Direct Flights Only: ${data.direct_flights_only ? 'YES' : 'No'}
- Preferred Airlines: ${data.preferred_airlines?.join(', ') || 'Any'}
- Excluded Airlines: ${data.excluded_airlines?.join(', ') || 'None'}
- Seat Preference: ${data.seat_preference || 'Any'}
- Meal Preference: ${data.meal_preference || 'Regular'}
- Baggage: ${data.baggage_carry_on ? 'Carry-on' : ''} ${data.baggage_checked ? `+ ${data.baggage_checked} checked` : ''}

🍽️ RESTAURANT PREFERENCES (Apply to ALL restaurant searches):
- Cuisine Types: ${data.cuisine_types?.join(', ') || 'Any'}
- Dietary Restrictions: ${data.dietary_restrictions?.join(', ') || 'None'}
- Price Range: ${data.restaurant_price_range || 'Any'}
- Seating: ${data.seating_preference || 'Any'}
- Experience Type: ${data.restaurant_experience_type?.join(', ') || 'Any'}
- Preferred Dining Time: ${data.preferred_dining_time || 'Any'}

🚗 CAR RENTAL PREFERENCES (Apply to ALL car searches):
- Car Type: ${data.car_type || 'Any'}
- Transmission: ${data.transmission_type || 'Automatic'}
- Budget: $${data.car_budget_min || 20} - $${data.car_budget_max || 500} per day
- Features: ${data.car_features?.join(', ') || 'None specified'}
- Fuel Policy: ${data.fuel_policy || 'Full-to-full'}
- Unlimited Mileage: ${data.unlimited_mileage ? 'YES' : 'No'}

🎟️ EVENT PREFERENCES (Apply to ALL event searches):
- Event Types: ${data.event_types?.join(', ') || 'Any'}
- Budget: $${data.event_budget_min || 20} - $${data.event_budget_max || 500} per ticket
- Ticket Type: ${data.ticket_type || 'Any'}
- Time Preference: ${data.event_time_preference || 'Any'}

🛂 TRAVEL DOCUMENTS:
- Passport: ${data.passport_number ? 'On file' : 'Not provided'}
- Nationality: ${data.nationality || 'Not specified'}
- Visa Assistance Needed: ${data.visa_assistance_needed ? 'YES' : 'No'}

${data.special_requests ? `⚠️ SPECIAL REQUESTS: ${data.special_requests}` : ''}

CRITICAL: These are MANDATORY filters. Do NOT show results that violate these preferences unless the user explicitly asks to ignore them.`;
            } else {
              userContext = `\n\n=== USER PREFERENCES AVAILABLE BUT NOT APPLIED ===
The user has saved preferences but has chosen to search without strict filtering. Show all available results regardless of their saved preferences.
===`;
            }
            
            console.log('User preferences loaded:', userPreferences);
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }

    // Sequential question flow with state tracking
    let quickLinkState = conversationHistory.find((msg: any) => msg.quickLinkState)?.quickLinkState;
    
    // Initialize state for quick links
    if (isQuickLink && !quickLinkState) {
      quickLinkState = {
        type: quickLinkType,
        step: 0,
        data: {}
      };
    }
    
    // State machine for sequential questions
    if (isQuickLink && quickLinkState) {
      const { type, step, data } = quickLinkState;
      let nextStep = step;
      let nextData = { ...data };
      let shouldSearch = false;
      
      if (type === 'hotels') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, ask for check-in
          nextData.location = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got check-in, ask for check-out
          nextData.checkIn = message;
          nextStep = 3;
        } else if (step === 3) {
          // Got all data, search
          nextData.checkOut = message;
          shouldSearch = true;
        }
      } else if (type === 'flights') {
        if (step === 0) {
          // Ask for origin
          nextStep = 1;
        } else if (step === 1) {
          // Got origin, ask for destination
          nextData.origin = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got destination, ask for departure date
          nextData.destination = message;
          nextStep = 3;
        } else if (step === 3) {
          // Got departure, optionally ask for return
          nextData.departureDate = message;
          nextStep = 4;
        } else if (step === 4) {
          // Got return date or skip, search
          if (message && !message.toLowerCase().includes('one way') && !message.toLowerCase().includes('skip')) {
            nextData.returnDate = message;
          }
          shouldSearch = true;
        }
      } else if (type === 'restaurants') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, optionally ask cuisine
          nextData.location = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got cuisine or skip, search
          if (message && !message.toLowerCase().includes('any') && !message.toLowerCase().includes('skip')) {
            nextData.cuisineType = message;
          }
          shouldSearch = true;
        }
      } else if (type === 'events') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, search
          nextData.location = message;
          shouldSearch = true;
        }
      } else if (type === 'cars') {
        if (step === 0) {
          // Ask for pickup location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, ask for pickup date
          nextData.pickupLocation = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got pickup date, ask for return date
          nextData.pickupDate = message;
          nextStep = 3;
        } else if (step === 3) {
          // Got return date, search
          nextData.returnDate = message;
          shouldSearch = true;
        }
      }
      
      // Execute search if ready
      if (shouldSearch) {
        let toolResult;
        if (type === 'hotels') {
          toolResult = await searchHotels({
            location: nextData.location,
            checkIn: nextData.checkIn,
            checkOut: nextData.checkOut,
            guests: 2
          }, userContext);
        } else if (type === 'flights') {
          toolResult = await searchFlights({
            origin: nextData.origin,
            destination: nextData.destination,
            departureDate: nextData.departureDate,
            returnDate: nextData.returnDate,
            adults: 1
          });
        } else if (type === 'restaurants') {
          toolResult = await searchRestaurants({
            location: nextData.location,
            cuisineType: nextData.cuisineType
          });
        } else if (type === 'events') {
          toolResult = await searchEvents({
            location: nextData.location
          });
        } else if (type === 'cars') {
          toolResult = await searchCars({
            pickupLocation: nextData.pickupLocation,
            pickupDate: nextData.pickupDate,
            returnDate: nextData.returnDate
          });
        }
        
        const finalMessage = `Great! I found some options for you. Check them out below!`;
        return new Response(JSON.stringify({
          message: finalMessage,
          toolResults: [toolResult],
          conversationHistory: [...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: finalMessage }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      // Generate next question
      let nextQuestion = '';
      if (type === 'hotels') {
        if (nextStep === 1) nextQuestion = "Where would you like to stay?";
        else if (nextStep === 2) nextQuestion = `Perfect! When would you like to check in to ${nextData.location}?`;
        else if (nextStep === 3) nextQuestion = "And when would you like to check out?";
      } else if (type === 'flights') {
        if (nextStep === 1) nextQuestion = "Where will you be flying from?";
        else if (nextStep === 2) nextQuestion = `Great! Where would you like to fly to from ${nextData.origin}?`;
        else if (nextStep === 3) nextQuestion = "When would you like to depart?";
        else if (nextStep === 4) nextQuestion = "When would you like to return? (or say 'one way' for a one-way flight)";
      } else if (type === 'restaurants') {
        if (nextStep === 1) nextQuestion = "Which city are you looking for restaurants in?";
        else if (nextStep === 2) nextQuestion = "What type of cuisine are you interested in? (or say 'any' for all types)";
      } else if (type === 'events') {
        if (nextStep === 1) nextQuestion = "Which city would you like to find events in?";
      } else if (type === 'cars') {
        if (nextStep === 1) nextQuestion = "Where would you like to pick up the car?";
        else if (nextStep === 2) nextQuestion = `Great! When would you like to pick up the car in ${nextData.pickupLocation}?`;
        else if (nextStep === 3) nextQuestion = "And when would you like to return the car?";
      }
      
      return new Response(JSON.stringify({
        message: nextQuestion,
        quickLinkState: { type, step: nextStep, data: nextData },
        toolResults: [],
        conversationHistory: [...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: nextQuestion, quickLinkState: { type, step: nextStep, data: nextData } }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Conversational approach for non-quick link interactions





    // Define tools for the AI agent
    const tools = [
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for hotels in a specific location with various filters. Use this when users ask about hotels, accommodations, or places to stay. You can filter by price, rating, amenities, and sort by different criteria.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city, region, or destination to search for hotels"
              },
              checkIn: {
                type: "string",
                description: "Check-in date in YYYY-MM-DD format"
              },
              checkOut: {
                type: "string",
                description: "Check-out date in YYYY-MM-DD format"
              },
              guests: {
                type: "number",
                description: "Number of guests"
              },
              sortBy: {
                type: "string",
                enum: ["popularity", "price", "distance", "review_score"],
                description: "How to sort results: popularity (most booked), price (lowest first), distance (closest to center), review_score (highest rated)"
              },
              minRating: {
                type: "number",
                description: "Minimum guest review score (0-10, e.g., 8 for excellent hotels)"
              },
              maxPrice: {
                type: "number",
                description: "Maximum price per night in USD"
              },
              amenities: {
                type: "array",
                items: { type: "string" },
                description: "Required amenities like 'wifi', 'pool', 'parking', 'gym', 'restaurant', 'spa'"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_destinations",
          description: "Search for travel destinations, cities, regions, or points of interest. Use this when users ask about places to visit, destinations, or where to go.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The destination, city, or region to search for"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_restaurants",
          description: "Search for restaurants in a specific city or location. Use this when users ask about restaurants, dining, food, or places to eat. Always provide the location (city name).",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city or area to search for restaurants (e.g., 'New York', 'Paris', 'London')"
              },
              cuisine: {
                type: "string",
                description: "Type of cuisine if specified (e.g., 'Italian', 'Japanese', 'Mexican')"
              },
              priceRange: {
                type: "string",
                description: "Price range filter: '$' (budget), '$$ - $$$' (moderate), or '$$$$' (expensive)"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for flights between two cities. Use this when users ask about flights, airfare, or flying from one place to another. You can specify one-way or round-trip, cabin class, and whether direct flights only.",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin city or airport (e.g., 'New York', 'JFK', 'London')"
              },
              destination: {
                type: "string",
                description: "Destination city or airport (e.g., 'Paris', 'CDG', 'Tokyo')"
              },
              departureDate: {
                type: "string",
                description: "Departure date in YYYY-MM-DD format"
              },
              returnDate: {
                type: "string",
                description: "Return date in YYYY-MM-DD format (optional, only for round-trip flights)"
              },
              adults: {
                type: "number",
                description: "Number of adult passengers (default 1)"
              },
              travelClass: {
                type: "string",
                enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
                description: "Cabin class (default ECONOMY)"
              },
              nonStop: {
                type: "boolean",
                description: "Whether to show only direct flights (default false)"
              },
              sortBy: {
                type: "string",
                enum: ["best", "price", "duration", "departure_early", "departure_late"],
                description: "How to sort flight results: best (Amadeus recommendation), price (cheapest first), duration (shortest first), departure_early (earliest departure), departure_late (latest departure). Default is 'best'."
              }
            },
            required: ["origin", "destination", "departureDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_events",
          description: "Search for upcoming events, concerts, sports, theater shows, and entertainment using Ticketmaster. Use this when users ask about events, concerts, shows, tickets, or things to do.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "The city name to search events in"
              },
              keyword: {
                type: "string",
                description: "Search keyword for event name, artist, or venue"
              },
              startDate: {
                type: "string",
                description: "Start date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              endDate: {
                type: "string",
                description: "End date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              classificationName: {
                type: "string",
                enum: ["Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"],
                description: "Event category/classification"
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_visa_requirements",
          description: "Check visa requirements for travel between two countries. Use this when users ask about visa requirements, travel documents needed, or whether they need a visa to visit a country. Provide country names or ISO codes.",
          parameters: {
            type: "object",
            properties: {
              fromCountry: {
                type: "string",
                description: "Origin country name or ISO code (e.g., 'United States', 'USA', 'US')"
              },
              toCountry: {
                type: "string",
                description: "Destination country name or ISO code (e.g., 'France', 'FRA', 'FR')"
              }
            },
            required: ["fromCountry", "toCountry"]
          }
        }
      }
    ];

    const locationInfo = userLocation 
      ? `\n\nIMPORTANT: The user's current location is available. When they ask for restaurants, hotels, or things "near me" or "near my current location", ask them to specify their city or use context clues to determine their city. NEVER ask for or mention latitude, longitude, or GPS coordinates - only use city names.`
      : '';

    // Make conversational approach the DEFAULT for all interactions
    const conversationalBehavior = `

CRITICAL CONVERSATIONAL BEHAVIOR - YOUR PRIMARY MODE:
You are a thoughtful travel advisor who guides users through planning their trips by asking smart, leading questions. Think of yourself as a luxury travel concierge having a natural conversation.

🎯 CONVERSATION STRATEGY:
1. **Understand the Intent First**: When a user mentions travel, ask clarifying questions to understand:
   - What type of trip? (vacation, business, special occasion, weekend getaway)
   - Who's traveling? (solo, couple, family, group)
   - What's the vibe they're going for? (relaxation, adventure, cultural, luxury, budget)

2. **Ask Leading Questions**: Guide them naturally through the planning process:
   - "What kind of experience are you looking for?"
   - "Is this for a special occasion?"
   - "What's most important to you on this trip?"
   - "Are you flexible with dates, or do you have specific dates in mind?"
   - "What's your ideal budget range?"

3. **Build Context Before Searching**: Gather key information through conversation:
   - For Hotels: destination → dates → budget → preferences (amenities, neighborhood, style)
   - For Flights: purpose of trip → origin → destination → dates → flexibility → budget
   - For Restaurants: city → occasion/meal type → cuisine preferences → budget
   - For Events: city → interests → date range

4. **Be Adaptive**: 
   - If they give you everything upfront, acknowledge and search immediately
   - If they're vague, ask gentle probing questions
   - If they seem decisive, move faster
   - If they're exploring, slow down and help them discover

5. **Natural Follow-ups**: After showing results, ask intelligent next questions:
   - "Did any of these catch your eye?"
   - "Would you like me to adjust the budget range?"
   - "Are you looking for a specific neighborhood or area?"
   - "Should I show you options with different dates?"

QUESTION PATTERNS (Use these naturally, not as a rigid script):

**When they mention a trip generally:**
- "That sounds exciting! Where are you thinking of going?"
- "What's drawing you to [destination]?"
- "Is this trip for leisure, business, or something special?"

**When gathering dates:**
- "Do you have specific dates in mind, or are you flexible?"
- "How long are you planning to stay?"
- "When were you hoping to travel?"

**When understanding budget:**
- "What kind of budget are you working with?"
- "Are you looking for luxury, mid-range, or budget-friendly options?"
- "What's your comfort zone for [hotels/flights/dining]?"

**When exploring preferences:**
- "What matters most to you? Location, price, amenities, or something else?"
- "Any must-haves for this trip?"
- "Is there anything you'd like to avoid?"

CRITICAL RULES:
- Ask ONE thoughtful question at a time (never a list of bullet points)
- Listen to their answers and build on them naturally
- Use their language and tone (formal vs casual)
- Show enthusiasm and genuine interest
- Don't rush to search - get the full picture first
- BUT if they give you clear criteria upfront, search immediately
- After showing results, continue the conversation naturally

ONLY search when you have enough information to provide relevant results. It's better to ask one more question than to show irrelevant results.`;

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a sophisticated travel assistant. You help users plan trips, find hotels, discover destinations, search for restaurants, book flights, answer travel-related questions, and provide visa information.${locationInfo}${userContext}
${conversationalBehavior}

⚠️ CRITICAL PREFERENCE ENFORCEMENT:
If the user has set booking preferences (shown above), you MUST strictly apply them to ALL search tool calls:
- ONLY call search_hotels with their price range, star rating, amenities, property types, and distance requirements
- ONLY call search_flights with their cabin class, max price, airline preferences, and baggage requirements
- ONLY call search_restaurants matching their cuisine types, dietary restrictions, and price range
- ONLY call search_events matching their preferred event types and budget
- DO NOT show results that violate their preferences unless they explicitly ask to "ignore preferences" or "see all options"
- When showing results, mention that they match their saved preferences

🍽️ RESTAURANT RESERVATION PROTOCOL:
When showing restaurant results or when users ask about making reservations:
1. Explain that reservations can be made through Google Reservations
2. Let them know they can click "Make Reservation" on any restaurant card to be taken to Google where they can:
   - View real-time availability
   - Make instant reservations
   - See reviews and menus
   - Get directions
3. DO NOT collect reservation details (date, time, party size) in the chat
4. DO NOT try to create internal bookings for restaurants
5. Simply guide them to use the "Make Reservation" button on the restaurant cards

CONTEXT AWARENESS: When you've just asked "What city are you in?" and the user responds with ONLY a city name (like "New York", "Paris", "London"), IMMEDIATELY call the appropriate search tool (search_hotels or search_restaurants) with that city. Don't ask for confirmation - just search!

LOCATION RULES:
- NEVER ask users for latitude, longitude, GPS coordinates, or precise location data
- ALWAYS ask for city names instead (e.g., "What city are you in?" not "What's your latitude and longitude?")
- When users say "near me" or "current location", ask them for their city name
- Use city names in all search queries

EXCEPTION - FLIGHTS REQUIRE ORIGIN: For flight searches, if the user does NOT specify where they're flying FROM, you MUST ask them for the origin city before searching. Do not assume or guess the origin location. For example, if they say "flights to Paris" or "fly to London", ask "Where will you be flying from?" before calling search_flights.

BOOKING PREFERENCES PROTOCOL:
After showing hotel search results, ALWAYS ask the user about their booking preference:
1. "Would you like to book this hotel yourself, or would you prefer to have your personalized Goldsainte AI agent handle the reservation for you?"
2. Then follow up with: "Also, would you like a Goldsainte AI Travel Agent to help configure a more complex trip with flights, transfers, activities, and dining reservations?"

These questions should be asked AFTER showing hotel results but BEFORE the user clicks to book.

VISA REQUIREMENTS PROTOCOL:
When you provide visa information using check_visa_requirements tool:
1. First, provide the visa requirement details clearly, including:
   - Visa status (required, visa-free, visa on arrival, eVisa)
   - Duration of stay allowed
   - Passport validity requirements
   - IMPORTANT: Explain visa fee considerations:
     * Fees vary by destination country
     * Different visa types (tourism, business, study, work) have different fees
     * Petition-based visas (like work visas) may have different fee structures
     * Expedited processing typically costs more
     * Additional charges may apply (SEVIS fees, service center fees)
     * User should verify exact fees on official embassy/consulate website
2. If the destination country REQUIRES a visa (not visa-free, not visa on arrival), ALWAYS ask: "Would you like Goldsainte to assist you with your visa application? Our team can handle the entire process for you, including helping you understand the exact fees and requirements."
3. If they say yes or express interest, inform them: "Great! To get started with your visa application, I'll need to collect some information. Please provide your contact details and travel information."
4. DO NOT collect information in the chat - the interface will show a form for them to fill out.

Smart Defaults (Use only when user provides complete information upfront):
- Hotels: If no dates given but everything else is clear → ask about dates
- Flights: If origin is missing → ASK where they're flying from (DO NOT ASSUME)
- Flights: If they say "round trip" → ask about return date or suggest typical duration
- Guest/passenger count: Only assume if they've given all other details (1 adult for flights, 2 guests for hotels)
- If they say "best" or "top" → confirm budget range, then use sortBy "review_score" with minRating 8
- If they say "cheap" or "budget" → confirm their budget range, then sortBy "price"
- For cabin class: default to ECONOMY unless specified
- For restaurants: if city not mentioned, ask conversationally

CALCULATING DATES: When using "tomorrow", calculate the actual date. For example, if today is 2025-09-30, tomorrow is 2025-10-01. For "next week" add 7 days.

EXAMPLE CONVERSATIONAL FLOWS (Follow this natural pattern):

Example 1 - User gives complete information:
User: "Show me flights from New York to Paris on March 15th"
YOU: *They gave complete info, search immediately* → call search_flights with origin="New York", destination="Paris", departureDate="2025-03-15", adults=1
Response: "Great! Let me find flights from New York to Paris for March 15th." [shows results] "Would you like to see round-trip options, or are you looking for one-way?"

Example 2 - User gives partial information:
User: "I need a hotel in Tokyo"  
YOU: "Perfect! When are you planning to visit Tokyo?"
User: "Next week for 3 nights"
YOU: "And what's your budget per night? Any specific amenities you're looking for?"
User: "$200-300, needs to have a pool"
YOU: *Now search* → call search_hotels with appropriate params

Example 3 - User is exploring:
User: "I want to plan a trip to Europe"
YOU: "How exciting! Which countries or cities in Europe are you most interested in?"
User: "Maybe Paris or Rome"
YOU: "Both amazing choices! Is this for a special occasion, or just a vacation? That might help me recommend which one."
User: "Anniversary trip"
YOU: "How romantic! For an anniversary, I'd personally recommend Paris for the ambiance. When are you thinking of going?"
[Continue conversation naturally before searching]

Example 4 - Quick decision maker:
User: "Best hotels in Miami this weekend under $300"
YOU: *They're decisive and gave criteria* → search immediately with sortBy="review_score", maxPrice=300
Response: "I'll find the best-rated hotels in Miami for this weekend under $300!" [shows results]

PRESENTING RESULTS - Keep it conversational:
When you use search tools and get results, DO NOT list out all the details in text. The interface shows beautiful visual cards automatically. Instead, give a brief, enthusiastic response that continues the conversation:

✅ GOOD responses after showing results:
- "I found some amazing options for you! Check out these hotels - they all have great reviews."
- "Here are some excellent flights. The 10am departure looks perfect for your schedule. What do you think?"
- "These restaurants are all highly rated! The Italian place on 5th Avenue looks incredible. Any catch your eye?"

Then naturally ask follow-up questions:
- "Would you like me to adjust the price range?"
- "Should I look for different dates?"
- "Are there any specific amenities you need?"
- "Want to see options in a different neighborhood?"

Always show results first with minimal text, then continue the conversation naturally. Be a helpful guide, not just a search engine.

Always show results first with minimal text, ask questions later. Be conversational but let the visual interface do the heavy lifting.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling OpenAI with tools...');

    const aiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages,
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const assistantMessage = aiData.choices[0].message;
    
    // Check if AI wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('AI requested tool calls:', assistantMessage.tool_calls.length);
      
      const toolResults: Array<{
        tool_call_id: string;
        function_name: string;
        result: any;
      }> = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        let toolResult;
        
        if (functionName === 'search_hotels') {
          toolResult = await searchHotels(functionArgs, BOOKING_API_KEY);
        } else if (functionName === 'search_destinations') {
          toolResult = await searchDestinations(functionArgs, BOOKING_API_KEY);
        } else if (functionName === 'search_restaurants') {
          toolResult = await searchRestaurants(functionArgs);
        } else if (functionName === 'search_flights') {
          toolResult = await searchFlights(functionArgs);
        } else if (functionName === 'search_events') {
          toolResult = await searchEvents(functionArgs);
        } else if (functionName === 'check_visa_requirements') {
          toolResult = await checkVisaRequirements(functionArgs);
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          function_name: functionName,
          result: toolResult
        });
      }

      // Send results back to AI for final response
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map(tr => ({
          role: "tool",
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(tr.result)
        }))
      ];

      const finalResponse = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: finalMessages,
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices[0].message.content;

      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: toolResults.map(tr => tr.result),
        conversationHistory: [...conversationHistory, 
          { role: 'user', content: message },
          { role: 'assistant', content: finalMessage }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // No tool calls - return conversational response
    return new Response(JSON.stringify({
      message: assistantMessage.content,
      toolResults: [],
      conversationHistory: [...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage.content }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in travel-ai-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function searchHotels(args: any, apiKey: string) {
  // Using Amadeus Hotel Search API for real hotel bookings
  try {
    const { location, checkIn, checkOut, guests = 2, sortBy, minRating, maxPrice, amenities } = args;
    console.log('searchHotels called with Amadeus:', { location, checkIn, checkOut, guests, sortBy, minRating, maxPrice, amenities });

    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus API credentials not configured', results: [] };
    }

    // Get Amadeus token for Location API lookup
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get Amadeus token');
      return { error: 'Authentication failed', results: [] };
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Convert city name to IATA code using Amadeus Location API
    let cityCode = location.toUpperCase();
    
    // If not already a 3-letter code, use Amadeus Location API
    if (!/^[A-Z]{3}$/.test(cityCode)) {
      console.log(`Looking up city code for: ${location}`);
      
      const searchParams = new URLSearchParams({
        keyword: location,
        subType: 'CITY',
        'page[limit]': '1'
      });

      const locationResponse = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations?${searchParams}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        if (locationData.data && locationData.data.length > 0) {
          cityCode = locationData.data[0].iataCode;
          console.log(`Amadeus Location API: "${location}" → ${cityCode}`);
        } else {
          console.warn(`No IATA code found for "${location}", trying fallback...`);
          // Fallback to manual mapping
          const variations = getCityVariations(location);
          const possibleCode = variations.find(v => v.length === 3);
          if (possibleCode) {
            cityCode = possibleCode.toUpperCase();
          } else {
            cityCode = location.replace(/\s+/g, '').substring(0, 3).toUpperCase();
          }
          console.log(`Using fallback city code: ${cityCode}`);
        }
      } else {
        console.warn(`Location API failed, using fallback for "${location}"`);
        const variations = getCityVariations(location);
        const possibleCode = variations.find(v => v.length === 3);
        if (possibleCode) {
          cityCode = possibleCode.toUpperCase();
        } else {
          cityCode = location.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        }
      }
    }
    
    console.log(`Final city code for hotel search: ${cityCode}`);

    // Call our Amadeus search edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/amadeus-search-hotels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cityCode: cityCode,
        checkInDate: checkIn || new Date().toISOString().split('T')[0],
        checkOutDate: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        adults: guests || 2,
        currency: 'USD'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus search error:', response.status, errorText);
      return { error: `Could not find hotels in "${location}" (tried city code: ${cityCode}). Please try a different location or use a 3-letter city code (e.g., NYC, LAX, DET).`, results: [] };
    }

    const data = await response.json();
    let hotels = data.results || [];
    
    // Calculate number of nights for per-night price calculation
    const checkInDate = new Date(checkIn || new Date().toISOString().split('T')[0]);
    const checkOutDate = new Date(checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    console.log(`Amadeus returned ${hotels.length} hotels for ${nights} nights`);
    console.log('Sample hotel structure:', hotels[0] ? JSON.stringify(hotels[0]).substring(0, 500) : 'No hotels');


    // Apply filters on Amadeus data
    if (typeof minRating === 'number') {
      const minRatingNormalized = minRating > 5 ? minRating / 2 : minRating;
      const beforeFilter = hotels.length;
      hotels = hotels.filter((h: any) => {
        const rating = h.hotel?.rating || 0;
        return rating >= minRatingNormalized;
      });
      console.log(`Rating filter: ${beforeFilter} → ${hotels.length} hotels`);
    }
    if (typeof maxPrice === 'number') {
      const beforeFilter = hotels.length;
      hotels = hotels.filter((h: any) => {
        const totalPrice = h.offers?.[0]?.price?.total ? parseFloat(h.offers[0].price.total) : 0;
        const pricePerNight = totalPrice / nights;
        console.log(`Hotel total: $${totalPrice}, per night: $${pricePerNight.toFixed(2)}, max: $${maxPrice}, passes: ${pricePerNight <= maxPrice}`);
        return pricePerNight <= maxPrice;
      });
      console.log(`Price filter (max $${maxPrice}/night): ${beforeFilter} → ${hotels.length} hotels`);
    }
    if (sortBy === 'price') {
      hotels.sort((a: any, b: any) => {
        const priceA = a.offers?.[0]?.price?.total ? parseFloat(a.offers[0].price.total) : 0;
        const priceB = b.offers?.[0]?.price?.total ? parseFloat(b.offers[0].price.total) : 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'review_score') {
      hotels.sort((a: any, b: any) => {
        const ratingA = a.hotel?.rating || 0;
        const ratingB = b.hotel?.rating || 0;
        return ratingB - ratingA;
      });
    }

    console.log(`After all filters: ${hotels.length} hotels`);

    // Enrich hotels with TripAdvisor photos and reviews
    const tripAdvisorKey = Deno.env.get('TRIPADVISOR_API_KEY');
    if (tripAdvisorKey && hotels.length > 0) {
      console.log('Enriching hotels with TripAdvisor data...');
      
      // Process hotels in parallel but limit to top 10 to avoid rate limits
      const hotelsToEnrich = hotels.slice(0, 10);
      
      await Promise.all(
        hotelsToEnrich.map(async (hotel: any) => {
          try {
            const hotelName = hotel.hotel?.name || '';
            const hotelCity = hotel.hotel?.address?.cityName || location;
            
            // Search TripAdvisor for this hotel
            const searchParams = new URLSearchParams({
              key: tripAdvisorKey,
              searchQuery: `${hotelName} ${hotelCity}`,
              category: 'hotels',
              language: 'en'
            });
            
            const searchResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (!searchResponse.ok) return;
            
            const searchData = await searchResponse.json();
            const tripAdvisorLocation = searchData.data?.[0];
            
            if (!tripAdvisorLocation) return;
            
            // Get photos
            const photosParams = new URLSearchParams({
              key: tripAdvisorKey,
              language: 'en'
            });
            
            const photosResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${tripAdvisorLocation.location_id}/photos?${photosParams}`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (photosResponse.ok) {
              const photosData = await photosResponse.json();
              hotel.tripAdvisorPhotos = photosData.data || [];
            }
            
            // Get reviews
            const reviewsParams = new URLSearchParams({
              key: tripAdvisorKey,
              language: 'en'
            });
            
            const reviewsResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${tripAdvisorLocation.location_id}/reviews?${reviewsParams}`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              hotel.tripAdvisorReviews = reviewsData.data || [];
            }
            
            console.log(`Enriched ${hotelName} with TripAdvisor data`);
          } catch (error) {
            console.error(`Failed to enrich hotel with TripAdvisor:`, error);
          }
        })
      );
    }

    // Transform Amadeus data to match expected format
    const transformedHotels = hotels.map((hotel: any) => {
      const hotelInfo = hotel.hotel || {};
      const offer = hotel.offers?.[0] || {};
      const totalPrice = offer.price?.total ? parseFloat(offer.price.total) : 0;
      const pricePerNight = totalPrice / nights;
      const currency = offer.price?.currency || 'USD';
      
      // Get TripAdvisor photos and reviews if available
      const tripAdvisorPhotos = hotel.tripAdvisorPhotos || [];
      const tripAdvisorReviews = hotel.tripAdvisorReviews || [];
      
      const photoUrls = tripAdvisorPhotos.map((photo: any) => ({
        url: photo.images?.large?.url || photo.images?.medium?.url || photo.images?.small?.url,
        caption: photo.caption || hotelInfo.name
      })).filter((p: any) => p.url);
      
      const reviews = tripAdvisorReviews.map((review: any) => ({
        author: review.user?.username || 'Anonymous',
        rating: review.rating || 0,
        text: review.text || '',
        date: review.published_date || '',
        title: review.title || ''
      }));

      return {
        hotel_id: hotel.id || hotelInfo.hotelId,
        name: hotelInfo.name || 'Hotel',
        address: hotelInfo.address?.lines?.[0] || '',
        city: hotelInfo.address?.cityName || location,
        country: hotelInfo.address?.countryCode || '',
        rating: hotelInfo.rating || 0,
        num_reviews: reviews.length || 0,
        property: {
          name: hotelInfo.name || 'Hotel',
          photoUrls: photoUrls,
          reviews: reviews,
          reviewScore: hotelInfo.rating || 0,
          reviewCount: reviews.length || 0,
          externalUrls: {
            amadeus: hotel.self || '',
            default: hotel.self || ''
          }
        },
        location: hotelInfo.address?.cityName || location,
        region: '',
        price: pricePerNight,
        priceBreakdown: {
          grossPrice: { value: pricePerNight, currency: currency },
          totalPrice: { value: totalPrice, currency: currency }
        },
        accessibilityLabel: `${hotelInfo.name}. ${hotelInfo.address?.cityName || location}. Price ${pricePerNight.toFixed(2)} ${currency} per night`,
        description: offer.room?.description?.text || '',
        amenities: hotelInfo.amenities || [],
        photos: photoUrls,
        reviews: reviews,
        amadeusData: {
          offerId: offer.id,
          hotelId: hotel.id || hotelInfo.hotelId,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          totalPrice: totalPrice
        }
      };
    });

    return {
      type: 'hotels',
      location: { name: location, dest_id: location },
      results: transformedHotels,
      checkIn: checkIn || new Date().toISOString().split('T')[0],
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guests,
      filters: { sortBy, minRating, maxPrice, amenities }
    };
  } catch (error) {
    console.error('Error in searchHotels:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function searchDestinations(args: any, apiKey: string) {
  try {
    const { query } = args;

    const response = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      return { error: 'Failed to search destinations', results: [] };
    }

    const data = await response.json();
    
    return {
      type: 'destinations',
      results: data.data || []
    };
  } catch (error) {
    console.error('Error searching destinations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
  }
}

async function searchRestaurants(args: any) {
  try {
    const { location, cuisine, priceRange } = args;
    
    // Normalize location using abbreviation mapping
    const normalizedLocation = normalizeCityName(location);
    console.log('searchRestaurants called with:', { location, normalizedLocation, cuisine, priceRange });

    const tripAdvisorKey = Deno.env.get('TRIPADVISOR_API_KEY');
    if (!tripAdvisorKey) {
      return { error: 'TripAdvisor API key not configured', results: [] };
    }

    // Build search query with normalized location
    let searchQuery = normalizedLocation;
    if (cuisine) {
      searchQuery += ` ${cuisine}`;
    }

    // Search for restaurants in the location
    const searchParams = new URLSearchParams({
      key: tripAdvisorKey,
      searchQuery: searchQuery,
      category: 'restaurants',
      language: 'en'
    });

    const searchResponse = await fetch(
      `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('TripAdvisor search error:', searchResponse.status, errorText);
      return { error: `Could not find restaurants in "${location}". Please try a different location. (Status: ${searchResponse.status})`, results: [] };
    }

    const searchData = await searchResponse.json();
    console.log('TripAdvisor restaurants found:', searchData.data?.length || 0);

    // Get detailed information for each restaurant
    const restaurantDetails = await Promise.all(
      (searchData.data || []).slice(0, 30).map(async (restaurant: any) => {
        try {
          const detailsParams = new URLSearchParams({
            key: tripAdvisorKey,
            language: 'en'
          });

          const detailsResponse = await fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/details?${detailsParams}`,
            { headers: { 'Accept': 'application/json' } }
          );

          if (!detailsResponse.ok) {
            return null;
          }

          const details = await detailsResponse.json();

          // Get photos
          const photosParams = new URLSearchParams({
            key: tripAdvisorKey,
            language: 'en'
          });

          const photosResponse = await fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/photos?${photosParams}`,
            { headers: { 'Accept': 'application/json' } }
          );

          let photos = [];
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            photos = photosData.data || [];
          }

          // Filter by price range if specified
          if (priceRange && details.price_level && details.price_level !== priceRange) {
            return null;
          }

          return {
            id: restaurant.location_id,
            name: details.name || restaurant.name,
            address: details.address_obj?.address_string || '',
            city: details.address_obj?.city || '',
            country: details.address_obj?.country || '',
            rating: details.rating || 0,
            num_reviews: details.num_reviews || 0,
            userRatingsTotal: details.num_reviews || 0,
            price_level: details.price_level || '',
            priceLevel: details.price_level ? details.price_level.split('$').length - 1 : 0,
            cuisine: details.cuisine?.map((c: any) => c.name).join(', ') || '',
            description: details.description || '',
            photos: photos.map((photo: any) => ({
              url: photo.images?.large?.url || photo.images?.original?.url,
              caption: photo.caption || ''
            })),
            photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
            web_url: details.web_url || '',
            phone: details.phone || '',
            website: details.website || '',
            hours: details.hours || {},
            openNow: details.is_closed === false,
            latitude: details.latitude,
            longitude: details.longitude
          };
        } catch (error) {
          console.error(`Error fetching details for restaurant ${restaurant.location_id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and verify location match
    const validRestaurants = restaurantDetails.filter(restaurant => {
      if (restaurant === null) return false;
      
      // Check if restaurant city matches the requested location
      const restaurantCity = (restaurant.city || '').toLowerCase().trim();
      const requestedCity = normalizedLocation.toLowerCase().trim();
      
      // Also check against original location and all variations
      const locationVariations = getCityVariations(location).map(v => v.toLowerCase().trim());
      
      // Restaurant must be in one of the location variations
      return locationVariations.some(variation => 
        restaurantCity.includes(variation) || variation.includes(restaurantCity)
      );
    });
    
    console.log(`Filtered restaurants: ${validRestaurants.length} out of ${restaurantDetails.length} are in ${location}`);
    
    return {
      type: 'restaurants',
      results: validRestaurants,
      location: location
    };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
  }
}

// Search flights using Amadeus API
async function searchFlights(args: any) {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY', nonStop = false, sortBy = 'best' } = args;
    console.log('searchFlights called with:', { origin, destination, departureDate, returnDate, adults, travelClass, nonStop, sortBy });

    // Get Amadeus credentials
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus credentials not configured', results: [] };
    }

    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with Amadeus', results: [] };
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Convert city names to airport codes if needed
    const getAirportCode = async (location: string) => {
      // If already looks like an airport code (3 letters), use it
      if (/^[A-Z]{3}$/i.test(location.trim())) {
        return location.toUpperCase();
      }

      // Try to get variations from our abbreviation map first
      const variations = getCityVariations(location);
      const normalizedLocation = variations[variations.length - 1] || location; // Use full name

      // Helper: attempt Amadeus location lookup
      const tryLookup = async (keyword: string, subType: string = 'AIRPORT,CITY') => {
        const params = new URLSearchParams({
          keyword,
          subType,
          'page[limit]': '1'
        });
        const r = await fetch(
          `https://test.api.amadeus.com/v1/reference-data/locations?${params}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!r.ok) return null;
        const j = await r.json();
        const code = j?.data?.[0]?.iataCode;
        return (typeof code === 'string' && code.length === 3) ? code : null;
      };

      // First attempts
      let code = await tryLookup(normalizedLocation);
      if (!code) code = await tryLookup(normalizedLocation, 'CITY');
      if (!code && variations.length > 0) code = await tryLookup(variations[0], 'AIRPORT,CITY');
      if (code) return code;

      // Fallback mappings for popular cities
      const cityToCode: Record<string, string> = {
        'new york': 'NYC',
        'los angeles': 'LAX',
        'san francisco': 'SFO',
        'washington': 'WAS',
        'chicago': 'CHI',
        'miami': 'MIA',
        'seattle': 'SEA',
        'atlanta': 'ATL',
        'dallas': 'DFW',
        'houston': 'HOU',
        'phoenix': 'PHX',
        'denver': 'DEN',
        'orlando': 'ORL',
        'detroit': 'DTT',
        'minneapolis': 'MSP',
        'portland': 'PDX',
        'san diego': 'SAN',
        'austin': 'AUS',
        'nashville': 'BNA',
        'salt lake city': 'SLC',
        'charlotte': 'CLT',
        'paris': 'PAR',
        'london': 'LON',
        'tokyo': 'TYO',
        'dubai': 'DXB',
        'doha': 'DOH',
        'singapore': 'SIN',
        'hong kong': 'HKG',
        'sydney': 'SYD',
        'toronto': 'YTO'
      };
      const lowerNorm = normalizedLocation.toLowerCase();
      if (cityToCode[lowerNorm]) return cityToCode[lowerNorm];

      // Fallback: if it's a known airport code abbreviation, return it
      const upperLocation = location.toUpperCase();
      const airportCodes = ['JFK', 'LGA', 'EWR', 'LAX', 'SFO', 'ORD', 'MDW', 'DCA', 'IAD', 'PHL', 'LAS', 'MIA', 'BOS', 'SEA', 'ATL', 'DFW', 'DAL', 'IAH', 'HOU', 'PHX', 'DEN', 'MCO', 'DTW', 'MSP', 'PDX', 'SAN', 'AUS', 'BNA', 'SLC', 'CLT'];
      if (airportCodes.includes(upperLocation)) {
        return upperLocation;
      }

      // Last resort: return normalized 3-letter slice if applicable
      if (/^[A-Z]{3,}$/.test(upperLocation)) return upperLocation.slice(0,3);
      return upperLocation;
    };

    const originCode = await getAirportCode(origin);
    const destinationCode = await getAirportCode(destination);

    console.log('Airport codes:', { originCode, destinationCode });

    // Build flight search params
    const flightParams = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: adults.toString(),
      travelClass,
      nonStop: nonStop ? 'true' : 'false',
      currencyCode: 'USD',
      max: '20'
    });

    if (returnDate) {
      flightParams.append('returnDate', returnDate);
    }

    const flightResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${flightParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!flightResponse.ok) {
      console.error('Flight search failed:', flightResponse.status);
      return { 
        error: `Could not find flights from ${origin} to ${destination}. Try different dates or cities.`,
        results: [] 
      };
    }

    const flightData = await flightResponse.json();
    console.log('Flights found:', flightData.data?.length || 0);

    // Sort flights based on sortBy parameter
    let sortedFlights = flightData.data || [];
    
    if (sortBy && sortedFlights.length > 0) {
      switch (sortBy) {
        case 'price':
          // Sort by total price (lowest first)
          sortedFlights.sort((a: any, b: any) => {
            const priceA = parseFloat(a.price.total);
            const priceB = parseFloat(b.price.total);
            return priceA - priceB;
          });
          break;
          
        case 'duration':
          // Sort by duration (shortest first)
          sortedFlights.sort((a: any, b: any) => {
            const getDurationMinutes = (duration: string) => {
              const hours = duration.match(/(\d+)H/)?.[1] || '0';
              const minutes = duration.match(/(\d+)M/)?.[1] || '0';
              return parseInt(hours) * 60 + parseInt(minutes);
            };
            const durationA = getDurationMinutes(a.itineraries[0].duration);
            const durationB = getDurationMinutes(b.itineraries[0].duration);
            return durationA - durationB;
          });
          break;
          
        case 'departure_early':
          // Sort by earliest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeA - timeB;
          });
          break;
          
        case 'departure_late':
          // Sort by latest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeB - timeA;
          });
          break;
          
        case 'best':
        default:
          // Keep Amadeus default sorting (combination of price, duration, and quality)
          break;
      }
    }

    return {
      type: 'flights',
      origin: { code: originCode, name: origin },
      destination: { code: destinationCode, name: destination },
      departureDate,
      returnDate,
      results: sortedFlights,
      dictionaries: flightData.dictionaries,
      meta: flightData.meta,
      filters: { sortBy }
    };

  } catch (error) {
    console.error('Error in searchFlights:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function searchCars(args: any) {
  try {
    const { pickupLocation, pickupDate, returnDate } = args;
    console.log('searchCars called with:', { pickupLocation, pickupDate, returnDate });

    // Get Amadeus credentials
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus credentials not configured', results: [] };
    }

    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with Amadeus', results: [] };
    }

    const { access_token } = await tokenResponse.json();

    // Build query parameters
    const params = new URLSearchParams({
      pickupLocation,
      pickupDate,
      dropoffDate: returnDate,
      currencyCode: 'USD'
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/car-rental-offers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Amadeus car search error:', error);
      return { error: 'Car search failed', results: [] };
    }

    const data = await response.json();
    console.log('Cars found:', data.data?.length || 0);

    return {
      type: 'cars',
      pickupLocation,
      pickupDate,
      returnDate,
      results: data.data || [],
      meta: data.meta
    };

  } catch (error) {
    console.error('Error in searchCars:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function checkVisaRequirements(args: any) {
  try {
    const { fromCountry, toCountry } = args;
    console.log('checkVisaRequirements called with:', { fromCountry, toCountry });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return { 
        error: 'Visa check service not configured',
        requirement: 'unknown'
      };
    }

    // Use Lovable AI to get accurate visa information
    const prompt = `Provide accurate and up-to-date visa requirements for a traveler from ${fromCountry} visiting ${toCountry}. Include:
    
1. Visa requirement status (visa required, visa-free, visa on arrival, eVisa available, etc.)
2. Maximum stay duration if visa-free or visa on arrival
3. Passport validity requirements (e.g., must be valid for 6 months beyond stay)

IMPORTANT - VISA FEE CONSIDERATIONS:
Explain that visa fees vary based on:
- Destination Country: Each country has different fee structures
- Visa Type: Purpose of visit (tourism, business, study, work) affects the category and fee
- Petition vs. Non-Petition Based: Some visas (like work visas) are petition-based with different fees
- Application Processing Time: Expedited processing may cost more
- Additional Charges: May include SEVIS fees (for exchange visitors) or visa service center fees

4. Estimated fee range (if available) and note that exact fees should be verified on:
   - Official embassy or consulate website of ${toCountry}
   - Official government visa fee schedules (.gov websites)

5. Any special conditions or requirements
6. Official embassy/government website link if available

If visa is required, mention that Goldsainte can assist with the application process and handle all the complexity.

Be specific and factual. Always recommend verifying exact fees and requirements with official government sources.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return { 
        error: `Visa information lookup failed: ${response.statusText}`,
        requirement: 'unknown'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('Visa requirement AI response:', aiResponse);

    return {
      type: 'visa',
      fromCountry,
      toCountry,
      information: aiResponse,
      source: 'AI-powered visa information'
    };

  } catch (error) {
    console.error('Error in checkVisaRequirements:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      requirement: 'unknown'
    };
  }
}

async function searchEvents(args: any) {
  try {
    const { city, keyword, startDate, endDate, classificationName } = args;
    
    // Normalize city using abbreviation mapping
    const normalizedCity = normalizeCityName(city);
    console.log('searchEvents called with:', { city, normalizedCity, keyword, startDate, endDate, classificationName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: 'Supabase configuration missing', results: [] };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/search-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: normalizedCity, keyword, startDate, endDate, classificationName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('search-events error:', response.status, errorText);
      return { error: `Failed to fetch events: ${response.statusText}`, results: [] };
    }

    const data = await response.json();
    console.log('Events found:', data.events?.length || 0);

    return {
      type: 'events',
      results: data.events || [],
      page: data.page,
      city
    };

  } catch (error) {
    console.error('Error in searchEvents:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}