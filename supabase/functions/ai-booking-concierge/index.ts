import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, getUserTier, getTieredRateLimit, type SubscriptionTier } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

// ⚠️ SECURITY: Input validation for AI concierge
const validateConciergeInput = (data: any): { success: boolean; error?: string } => {
  if (!data.messages || !Array.isArray(data.messages)) {
    return { success: false, error: 'Messages array is required' };
  }
  
  if (data.messages.length === 0 || data.messages.length > 50) {
    return { success: false, error: 'Messages must contain 1-50 entries' };
  }
  
  for (const msg of data.messages) {
    if (!msg.role || !msg.content) {
      return { success: false, error: 'Each message must have role and content' };
    }
    if (typeof msg.content !== 'string' || msg.content.length > 10000) {
      return { success: false, error: 'Message content must be a string under 10000 characters' };
    }
  }
  
  return { success: true };
};

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// Persistent trip context across tool calls
const tripContext: {
  rankingPreferences: {
    flights?: string;
    hotels?: string;
    cars?: string;
    restaurants?: string;
  };
  carRental?: {
    pickupLocation?: string;
    dropoffLocation?: string;
    pickupDate?: string;
    returnDate?: string;
  };
} = {
  rankingPreferences: {},
  carRental: {}
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    // ⚠️ SECURITY: Rate limiting for AI concierge
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    let tier: SubscriptionTier = 'unauthenticated';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const tempClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: { user } } = await tempClient.auth.getUser(token);
        if (user) {
          userId = user.id;
          tier = await getUserTier(userId);
        }
      } catch (error) {
        console.log('Failed to authenticate user, treating as unauthenticated');
      }
    }
    
    const clientId = getClientIdentifier(req, userId);
    const limits = getTieredRateLimit(tier, 'ai-booking-concierge');
    
    const rateLimit = await checkRateLimit({
      ...limits,
      identifier: clientId,
      endpoint: 'ai-booking-concierge',
      tier
    });
    
    if (!rateLimit.allowed) {
      console.log('❌ [RATE LIMIT] AI concierge request blocked for:', clientId);
      return createRateLimitResponse(rateLimit, corsHeaders(req));
    }
    
    console.log(`✅ [RATE LIMIT] ${rateLimit.remaining} AI concierge requests remaining`);

    // ⚠️ SECURITY: Validate input
    const body = await req.json();
    console.log('🔒 [VALIDATION] Validating AI concierge input');
    const validation = validateConciergeInput(body);
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [VALIDATION] Input validated');

    const { messages, stream = false, agentProfile, preferences, language = 'en' } = body;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    
    // Extract preferences or use defaults
    const hotelFilter = preferences?.hotels?.filter || 'all';
    const hotelSortBy = preferences?.hotels?.sortBy || 'best_value';
    const flightSortBy = preferences?.flights?.sortBy || 'best_value';
    const carSortBy = preferences?.cars?.sortBy || 'best_value';

    const tools = [
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "⚠️ CRITICAL: Ask user for trip type (round trip/one-way) BEFORE calling this. Search for flights between two cities. Returns flight options with prices, airlines, and schedules.",
          parameters: {
            type: "object",
            properties: {
              origin: { type: "string", description: "Departure city or airport code (e.g., 'New York' or 'JFK')" },
              destination: { type: "string", description: "Arrival city or airport code (e.g., 'Paris' or 'CDG')" },
              tripType: {
                type: "string",
                enum: ["round-trip", "one-way"],
                description: "⚠️ REQUIRED - Type of trip. MUST ask user explicitly: 'Is this a round trip or one-way flight?'"
              },
              departureDate: { 
                type: "string", 
                description: "⚠️ REQUIRED - Departure date in YYYY-MM-DD format. YOU MUST ASK USER FOR THIS." 
              },
              returnDate: { 
                type: "string", 
                description: "⚠️ REQUIRED for round-trip flights - Return date in YYYY-MM-DD format. If tripType is 'round-trip', this field is MANDATORY." 
              },
              adults: { type: "number", description: "Number of adult passengers", default: 1 }
            },
            required: ["origin", "destination", "tripType", "departureDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for hotels in a specific location. Returns hotel options with prices, ratings, and amenities.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City or destination name" },
              checkIn: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
              checkOut: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
              guests: { type: "number", description: "Number of guests", default: 2 }
            },
            required: ["location", "checkIn", "checkOut"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_agent_contact",
          description: "When user requests to be contacted by a Goldsainte travel agent. CRITICAL: You MUST collect ALL required information before calling this tool.",
          parameters: {
            type: "object",
            properties: {
              travelerInfo: {
                type: "object",
                description: "Traveler contact information - ALL FIELDS REQUIRED",
                properties: {
                  name: { 
                    type: "string",
                    description: "Full name of traveler"
                  },
                  email: { 
                    type: "string",
                    description: "Email address for agent to contact"
                  },
                  phone: { 
                    type: "string",
                    description: "Phone number with country code if international"
                  },
                  additionalEmails: {
                    type: "array",
                    description: "Additional email addresses to notify (optional)",
                    items: {
                      type: "object",
                      properties: {
                        email: { type: "string" },
                        name: { type: "string" }
                      }
                    }
                  }
                },
                required: ["name", "email", "phone"]
              },
              travelDetails: {
                type: "object",
                description: "COMPREHENSIVE travel requirements from conversation",
                properties: {
                  serviceType: {
                    type: "string",
                    description: "Type of service needed",
                    enum: ["flight", "hotel", "car_rental", "uber", "package", "visa_assistance", "general_inquiry"]
                  },
                  origin: {
                    type: "string",
                    description: "Departure location/pickup point"
                  },
                  destination: {
                    type: "string",
                    description: "Arrival location/dropoff point"
                  },
                  departureDate: {
                    type: "string",
                    description: "Start date or pickup date (YYYY-MM-DD format)"
                  },
                  returnDate: {
                    type: "string",
                    description: "Return date if applicable (YYYY-MM-DD format)"
                  },
                  travelers: {
                    type: "object",
                    description: "Number of travelers",
                    properties: {
                      adults: { type: "number" },
                      children: { type: "number" },
                      infants: { type: "number" }
                    }
                  },
                  budget: {
                    type: "object",
                    description: "Budget information if discussed",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string" },
                      flexibility: { type: "string", enum: ["strict", "flexible", "very_flexible"] }
                    }
                  },
                  specialRequests: {
                    type: "string",
                    description: "Any special requirements, accessibility needs, preferences mentioned"
                  },
                  urgency: {
                    type: "string",
                    description: "How soon they need this",
                    enum: ["immediate", "within_24h", "within_week", "flexible"]
                  },
                  conversationSummary: {
                    type: "string",
                    description: "Brief 2-3 sentence summary of what user needs"
                  }
                },
                required: ["serviceType", "conversationSummary"]
              }
            },
            required: ["travelerInfo", "travelDetails"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_itinerary",
          description: "Generate a detailed day-by-day itinerary for the entire trip when user wants complete trip planning.",
          parameters: {
            type: "object",
            properties: {
              destination: { type: "string", description: "Destination city/country" },
              startDate: { type: "string", description: "Trip start date YYYY-MM-DD" },
              endDate: { type: "string", description: "Trip end date YYYY-MM-DD" },
              travelers: { type: "number", description: "Number of travelers", default: 2 },
              interests: {
                type: "array",
                items: { type: "string" },
                description: "User interests: culture, food, adventure, relaxation, etc."
              },
              pace: {
                type: "string",
                enum: ["relaxed", "moderate", "packed"],
                description: "Trip pace preference"
              },
              budget: {
                type: "object",
                properties: {
                  perDay: { type: "number" },
                  currency: { type: "string" }
                }
              }
            },
            required: ["destination", "startDate", "endDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_trip_context",
          description: "Update trip details when user changes their mind about destination, dates, travelers, or preferences mid-conversation.",
          parameters: {
            type: "object",
            properties: {
              updates: {
                type: "object",
                description: "Fields to update in trip context (destination, dates, travelers, budget, etc.)"
              },
              reason: {
                type: "string",
                description: "Why the change was made"
              }
            },
            required: ["updates"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for real flight options using Amadeus. Returns actual flights with prices, carriers, and times inline in chat.",
          parameters: {
            type: "object",
            properties: {
              origin: { type: "string", description: "Origin airport code (3-letter IATA)" },
              destination: { type: "string", description: "Destination airport code (3-letter IATA)" },
              depart_date: { type: "string", description: "Departure date YYYY-MM-DD" },
              return_date: { type: "string", description: "Return date YYYY-MM-DD (optional for one-way)" },
              adults: { type: "number", description: "Number of adult passengers", default: 1 },
              cabin: { type: "string", enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"], description: "Cabin class", default: "ECONOMY" }
            },
            required: ["origin", "destination", "depart_date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for real hotel options using Amadeus. Returns actual hotels with prices and details inline in chat.",
          parameters: {
            type: "object",
            properties: {
              city: { type: "string", description: "City code (3-letter IATA like MIA, NYC, LAX)" },
              check_in: { type: "string", description: "Check-in date YYYY-MM-DD" },
              check_out: { type: "string", description: "Check-out date YYYY-MM-DD" },
              guests: { type: "number", description: "Number of guests", default: 1 }
            },
            required: ["city", "check_in", "check_out"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_restaurants",
          description: "Search for restaurants in a location. Returns restaurant recommendations with cuisine types, ratings, and availability.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City or area name" },
              cuisine: { type: "string", description: "Cuisine type (optional, e.g., 'French', 'Italian', 'Japanese')" }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_events",
          description: "Search for events and activities in a location. Returns events, tours, and experiences.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City or destination name" },
              startDate: { type: "string", description: "Start date in YYYY-MM-DD format (optional)" },
              endDate: { type: "string", description: "End date in YYYY-MM-DD format (optional)" }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_cars",
          description: "Search for rental cars at a specific location. Returns car rental options with prices, vehicle types, and rental company details.",
          parameters: {
            type: "object",
            properties: {
              pickupLocation: { type: "string", description: "Pickup location (city or airport code)" },
              pickupDate: { type: "string", description: "Pickup date in YYYY-MM-DD format" },
              dropoffDate: { type: "string", description: "Dropoff date in YYYY-MM-DD format" },
              dropoffLocation: { type: "string", description: "Dropoff location if different from pickup (optional)" }
            },
            required: ["pickupLocation", "pickupDate", "dropoffDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_activities",
          description: "Search for tours, activities, and experiences at a destination. Returns activity options with prices, descriptions, duration, and booking information. Use this for sightseeing, tours, excursions, and local experiences.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City or destination name" },
              latitude: { type: "number", description: "Latitude of destination (improves accuracy)" },
              longitude: { type: "number", description: "Longitude of destination (improves accuracy)" },
              radius: { type: "number", description: "Search radius in kilometers", default: 20 },
              categories: { 
                type: "array",
                items: { type: "string" },
                description: "Activity categories: SIGHTSEEING, SHOWS_EVENTS, SPORTS, ADVENTURE, CULTURAL, FOOD_WINE, WELLNESS, WATER_ACTIVITIES, NATURE, SHOPPING"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_package",
          description: "Create a bundled travel package combining flight, hotel, and/or car rental with a 7% discount. Use after user has selected their preferred options.",
          parameters: {
            type: "object",
            properties: {
              destination: { type: "string", description: "Destination city" },
              departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
              returnDate: { type: "string", description: "Return date in YYYY-MM-DD format" },
              travelers: { type: "number", description: "Number of travelers" },
              selectedFlight: { 
                type: "object",
                description: "Selected flight details with price",
                properties: {
                  id: { type: "string" },
                  price: { type: "number" },
                  airline: { type: "string" },
                  departure: { type: "string" },
                  arrival: { type: "string" }
                }
              },
              selectedHotel: { 
                type: "object",
                description: "Selected hotel details with price",
                properties: {
                  id: { type: "string" },
                  price: { type: "number" },
                  name: { type: "string" },
                  nights: { type: "number" }
                }
              },
              selectedCar: { 
                type: "object",
                description: "Selected car rental details with price",
                properties: {
                  id: { type: "string" },
                  price: { type: "number" },
                  type: { type: "string" },
                  days: { type: "number" }
                }
              }
            },
            required: ["destination", "departureDate", "returnDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "set_ranking_preference",
          description: "Update how search results should be ranked based on user preference. Use when user expresses a preference like 'show me the cheapest' or 'what's closest to the city center'.",
          parameters: {
            type: "object",
            properties: {
              resultType: { 
                type: "string",
                enum: ["flights", "hotels", "cars", "restaurants"],
                description: "What type of results to rank"
              },
              sortBy: { 
                type: "string",
                enum: ["best_value", "cheapest", "closest", "highest_rated", "fastest"],
                description: "How to rank the results"
              }
            },
            required: ["resultType", "sortBy"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_uber_estimate",
          description: "Get real-time Uber pricing and availability for instant transportation. FULLY FUNCTIONAL - use whenever user asks about rides, airport transfers, or point-to-point transportation. You CAN book Uber rides for users.",
          parameters: {
            type: "object",
            properties: {
              pickupAddress: { type: "string", description: "Pickup location address" },
              dropoffAddress: { type: "string", description: "Dropoff location address" },
              pickupLatitude: { type: "number", description: "Pickup latitude coordinate" },
              pickupLongitude: { type: "number", description: "Pickup longitude coordinate" },
              dropoffLatitude: { type: "number", description: "Dropoff latitude coordinate" },
              dropoffLongitude: { type: "number", description: "Dropoff longitude coordinate" }
            },
            required: ["pickupLatitude", "pickupLongitude", "dropoffLatitude", "dropoffLongitude"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_uber_ride",
          description: "Book an Uber ride after user confirms. FULLY FUNCTIONAL - you CAN complete Uber bookings. Call after showing estimates and getting user confirmation with their chosen ride type.",
          parameters: {
            type: "object",
            properties: {
              productId: { type: "string", description: "Uber product ID from estimate results (e.g., 'uberx', 'uberxl')" },
              pickupAddress: { type: "string", description: "Pickup location address" },
              dropoffAddress: { type: "string", description: "Dropoff location address" },
              pickupLatitude: { type: "number", description: "Pickup latitude coordinate" },
              pickupLongitude: { type: "number", description: "Pickup longitude coordinate" },
              dropoffLatitude: { type: "number", description: "Dropoff latitude coordinate" },
              dropoffLongitude: { type: "number", description: "Dropoff longitude coordinate" }
            },
            required: ["productId", "pickupLatitude", "pickupLongitude", "dropoffLatitude", "dropoffLongitude"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_fine_dining_restaurants",
          description: "Search curated luxury fine dining restaurants by city and/or cuisine type. Returns 2,520+ premium restaurants across 30 global destinations with details, ratings, pricing, and website links. Use this for high-end dining recommendations.",
          parameters: {
            type: "object",
            properties: {
              city: { 
                type: "string", 
                description: "City name (e.g., 'Paris', 'Tokyo', 'London', 'Dubai'). Must match one of 30 curated destinations: Paris, Tokyo, New York City, London, Dubai, Rome, Barcelona, Singapore, Hong Kong, Bangkok, Sydney, Buenos Aires, Amsterdam, Lisbon, Kyoto, Cape Town, Marrakesh, Vancouver, Rio de Janeiro, Cairo, Seville, Reykjavik, Santorini, Abu Dhabi, Doha, Maldives, Bhutan, Queenstown, Havana, Luxor." 
              },
              cuisine: { 
                type: "string", 
                description: "Cuisine type (e.g., 'French Fine Dining', 'Japanese Kaiseki', 'Italian Trattoria', 'Steakhouse', 'Seafood', 'Modern American', 'Mediterranean', 'Middle Eastern', 'Chinese Imperial', 'Indian Fine Dining', 'Thai Royal', 'Fusion')"
              },
              priceLevel: {
                type: "number",
                description: "Price level filter (1-4, where 4 is most expensive)"
              },
              minRating: {
                type: "number",
                description: "Minimum rating filter (0-5)"
              }
            },
            required: [] // All params optional for flexible search
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_visa_requirements",
          description: "Check visa requirements when traveling from one country to another.",
          parameters: {
            type: "object",
            properties: {
              fromCountry: { type: "string", description: "Country of origin (e.g., 'United States')" },
              toCountry: { type: "string", description: "Destination country (e.g., 'France')" }
            },
            required: ["fromCountry", "toCountry"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_booking_link",
          description: "Generate an Expedia booking link with pre-filled search details. Use after user selects a hotel/flight and wants to proceed with booking.",
          parameters: {
            type: "object",
            properties: {
              type: { 
                type: "string", 
                enum: ["hotel", "flight"],
                description: "Type of booking link to generate"
              },
              destination: { type: "string", description: "Destination city or airport code" },
              checkIn: { type: "string", description: "Check-in date (YYYY-MM-DD) - for hotels" },
              checkOut: { type: "string", description: "Check-out date (YYYY-MM-DD) - for hotels" },
              departureDate: { type: "string", description: "Departure date (YYYY-MM-DD) - for flights" },
              returnDate: { type: "string", description: "Return date (YYYY-MM-DD) - for round-trip flights" },
              adults: { type: "number", description: "Number of adults" },
              origin: { type: "string", description: "Origin city or airport code - for flights" },
              hotelName: { type: "string", description: "Hotel name (optional, for context)" }
            },
            required: ["type", "destination", "adults"]
          }
        }
      }
    ];

    // Build personalized system prompt with Madison's luxury voice
    const agentName = agentProfile?.agent_name || "Madison";
    let systemPrompt = `You are ${agentName} — the luxury travel concierge for Goldsainte.

Your role:
• Help travelers shape inspiration, scenes, and moods into visual storyboards.
• Assist with trip planning, refinement, matching, and safety guidance.
• Provide elevated, calm, emotionally warm service.
• Never sound robotic or overly technical.

Voice & tone:
• Warm, human, luxury hospitality.
• Short paragraphs, thoughtful pacing.
• No emojis.
• Use sensory language sparingly and elegantly.
• You may say "I" when speaking personally, and "we" when referring to Goldsainte.
• Always protective of user trust & safety in a warm way.`;
    
    // Add custom personality if provided
    if (agentProfile?.personality_instructions) {
      systemPrompt += `\n\nYOUR PERSONALITY AND APPROACH:\n${agentProfile.personality_instructions}`;
    }

    // Add communication style
    const communicationStyles: Record<string, string> = {
      professional: "- Maintain a professional, detailed, and informative tone\n- Provide comprehensive explanations and options\n- Be thorough and precise in your recommendations",
      casual: "- Keep the conversation friendly and relaxed\n- Use casual language and be conversational\n- Make the planning process feel effortless and fun",
      concise: "- Get straight to the point\n- Provide brief, clear answers\n- Focus on essential information only",
      enthusiastic: "- Show excitement about travel opportunities\n- Use enthusiastic language and express genuine interest\n- Make every trip sound like an adventure"
    };

    if (agentProfile?.communication_style && communicationStyles[agentProfile.communication_style as string]) {
      systemPrompt += `\n\nCOMMUNICATION STYLE:\n${communicationStyles[agentProfile.communication_style as string]}`;
    }

    // Add custom knowledge base
    if (agentProfile?.custom_knowledge && Array.isArray(agentProfile.custom_knowledge) && agentProfile.custom_knowledge.length > 0) {
      systemPrompt += `\n\nIMPORTANT USER INFORMATION TO REMEMBER:\n${agentProfile.custom_knowledge.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`;
    }

    // Add language instruction
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
      zh: 'Chinese',
      ko: 'Korean',
      ar: 'Arabic'
    };

    const languageName = languageNames[language] || 'English';
    systemPrompt += `\n\nLANGUAGE:\nYou MUST respond in ${languageName}. All your responses, explanations, and recommendations should be in ${languageName}.`;

    // Add the rest of the system prompt
    systemPrompt += `

GOLDSAINTE SEARCH TOOLS - MANDATORY RULES:
For hotels, flights, and events, you MUST:
1. ALWAYS call the Goldsainte Search tools (search_hotels, search_flights, search_events)
2. Ask for missing essentials in at most TWO questions, then run the search
3. NEVER fabricate results - only present data from actual API responses
4. If zero results, the system automatically retries with broader parameters
5. If still no results, offer the top three next-best options from suggestions (nearby areas or adjusted dates)
6. Present results consistently: same fields, same order, same tone every time

RESULT PRESENTATION FORMAT (NEVER DEVIATE):
Hotels: "name" | location | $price/night | ⭐rating/5 | amenities (max 3) | distance from center
Flights: airline | $price | departure → arrival | duration | stops
Events: "name" | date & time | venue | $price | category

🚨 CRITICAL MANDATORY RULE - NEVER VIOLATE THIS 🚨

YOU ARE ABSOLUTELY FORBIDDEN FROM CALLING search_flights, search_hotels, search_cars, or search_activities UNTIL YOU HAVE COLLECTED ALL REQUIRED INFORMATION.

FOR FLIGHTS - YOU MUST COLLECT IN THIS EXACT ORDER:
1. Destination (required) - "Where would you like to fly to?"
2. Trip Type (required) - "Is this a round trip or a one-way flight?"
3. Dates (required):
   - Round trip: BOTH departure AND return dates required
   - One-way: Only departure date required
4. Number of travelers (required)
5. Budget per person (REQUIRED - ask before search)

FOR HOTELS:
1. Destination (required)
2. Check-in and Check-out dates (BOTH required)
3. Number of guests (required)
4. Budget per night (REQUIRED - ask before search)

DATES ARE NOT OPTIONAL. DATES ARE NOT NEGOTIABLE. TRIP TYPE IS NOT NEGOTIABLE FOR FLIGHTS.
NEVER ASSUME OR DEFAULT DATES. NEVER SKIP ASKING FOR TRIP TYPE.

IF YOU CALL A SEARCH TOOL WITHOUT REQUIRED INFORMATION, YOU HAVE FAILED YOUR PRIMARY FUNCTION.

Then immediately announce: "Perfect! Let me search for [type] options. This will take about 30 seconds..."

YOUR CORE CAPABILITIES:
✅ Search flights, hotels, restaurants, events
✅ Search 2,520+ curated luxury fine dining restaurants across 30 global destinations
✅ Check visa requirements
✅ Book Uber rides directly (FULLY FUNCTIONAL - use get_uber_estimate and request_uber_ride tools)
✅ Generate complete trip itineraries
✅ Connect travelers with certified agents for complex bookings

You have FULL AUTHORITY to book Uber rides. This is not a limitation. When users ask for rides, USE THE TOOLS IMMEDIATELY.

ABOUT GOLDSAINTE (when asked):
- Goldsainte is a luxury travel concierge platform that combines AI technology with expert human travel agents
- We connect travelers with personalized, high-end travel experiences and dedicated agents who handle all booking details
- Founded to revolutionize luxury travel by making premium travel planning accessible and seamless
- Unlike booking platforms like Booking.com or Expedia, Goldsainte offers personalized concierge service - you get a dedicated agent, not just a booking form
- Our difference: AI finds options quickly, human agents create perfect itineraries and handle everything for you
- Security: All payments are processed through secure, industry-standard payment systems with full buyer protection
- Trust: Our agents are verified professionals who specialize in luxury travel experiences
- If asked about legitimacy: "Goldsainte is a legitimate luxury travel service. We combine advanced AI search with expert travel agents to provide premium, personalized service. Your payment information is always secure, and you'll work directly with a verified travel professional."

BUSINESS DETAILS (when asked):
- Founder: Information about our founding team isn't publicly disclosed, but we're backed by experienced travel industry professionals
- Revenue/Financials: As a private company, we don't disclose financial information publicly
- Location: Goldsainte operates globally with a distributed team of travel experts worldwide
- Booking Volume: We serve thousands of luxury travelers, with our client base growing steadily as we expand our AI capabilities
- International Service: Yes! Goldsainte is fully international. We book travel worldwide and serve clients from any country
- Multi-Country Use: Absolutely - you can use Goldsainte to book travel anywhere in the world, whether you're booking from the US, Europe, Asia, or anywhere else. Our platform supports international flights, hotels, and experiences globally

COMPETITIVE POSITIONING (when asked how we compare):

vs. Velocity Black:
- They're a premium membership-based concierge with human teams handling all requests
- Goldsainte offers: Hybrid AI + human approach (faster search, expert service when needed), marketplace model with competitive agent bidding (vs fixed membership fees), instant AI booking capability, no membership required for AI features, transparent pricing
- Best for: Travelers who want luxury service without hefty membership commitments

vs. MindTrip:
- They're a pure AI travel planning tool focused on itinerary creation
- Goldsainte offers: Human agent backup for complex requests, full booking capability (not just planning), real-time voice conversations, agent marketplace for premium service, luxury-focused experiences
- Best for: Travelers who value AI efficiency but want expert human help available

Goldsainte's Unique Value:
- "Best of Both Worlds" - Speed of AI with luxury of human expertise
- Flexible choice: Use AI alone, agent alone, or both together
- Competitive marketplace ensures best pricing
- Seamless handoff from AI to agent when needed

PACKAGE BUNDLING:
- When user shows interest in multiple services (flight + hotel, or flight + hotel + car), suggest creating a bundled package
- Bundles save 7% compared to booking separately
- After user selects individual options, ask: "Would you like me to bundle these together into a package? You'll save 7% compared to booking separately."
- Use create_package tool to generate the bundled offer
- Present packages clearly showing itemized breakdown and total savings

RANKING AND SORTING:
- Results are shown as "Best Value" by default (balancing price, rating, and location)
- When user asks to see results differently, use set_ranking_preference tool
- Common requests:
  * "Show me the cheapest options" → sortBy: "cheapest"
  * "What's closest to downtown/city center?" → sortBy: "closest"  
  * "Show me the best rated hotels" → sortBy: "highest_rated"
  * "What's the fastest flight?" → sortBy: "fastest"
- After changing ranking, confirm: "I've re-sorted the results by [preference]. Here are your top options:"
- Explain badges:
  * 🏆 Best Overall/Best Value - Best combination of price, quality, and location
  * 💰 Cheapest Option - Lowest price available
  * ⭐ Highest Rated - Top customer reviews
  * 📍 Closest to Center - Nearest to city center/main area
  * ⚡ Fastest - Shortest travel time
  * ✈️ Non-Stop - Direct flights only

🎯 FLIGHT BOOKING FLOW - FOLLOW THIS EXACT SEQUENCE:

Step 1: Ask "Where would you like to fly to?"
Step 2: Ask "Is this a round trip or a one-way flight?"
Step 3a: If ROUND TRIP → Ask "When would you like to depart, and when would you like to return?" (collect BOTH dates)
Step 3b: If ONE-WAY → Ask "When would you like to depart?" (collect ONE date)
Step 4: Ask "How many travelers?" (if not already mentioned)
Step 5: Ask "What's your budget per person?"

THEN and ONLY THEN call search_flights with:
- Round trip: origin, destination, tripType="round-trip", departureDate, returnDate, adults
- One-way: origin, destination, tripType="one-way", departureDate, adults

NEVER SKIP STEP 2. Trip type determines what dates are needed.

CRITICAL RULES:
1. I CAN SEARCH AND RECOMMEND travel options - I help you find the perfect flights, hotels, rental cars, restaurants, events, and check visa requirements
   - In voice mode, SAY THIS: "I can help you search for flights, hotels, rental cars, restaurants, and events - plus check visa requirements."
2. BEFORE SEARCHING: ALWAYS collect these details IN ORDER (one at a time):
   - For FLIGHTS: Destination → Trip Type → Dates (based on trip type) → Travelers → Budget
   - For HOTELS: Destination → Check-in & Check-out dates → Guests → Budget
   - For CARS/ACTIVITIES: Location → Pickup/Start date → Return/End date → Budget
   - Budget per person/night (MUST ask before searching!)
   - Any preferences
3. WHEN USERS CHANGE THEIR MIND: Use the update_trip_context tool immediately
   - Examples: "Actually, make it July instead" → update_trip_context
   - "Change to 5 people" → update_trip_context
   - "Let's go to Tokyo instead" → update_trip_context
   - ACKNOWLEDGE: "Got it! Updated to [new details]. Let me search again..."
4. WHEN USERS WANT FULL ITINERARY: Use generate_itinerary tool
   - After showing search results, offer: "Would you like me to create a complete day-by-day itinerary?"
   - Present itinerary conversationally with day themes, activities, meals, and costs
   - Ask if they want to adjust specific days
5. SEARCH RESULTS RANKING:
   - Results are pre-ranked by "Best Value" (price + quality + location)
   - ALWAYS highlight the 🏆 Best Value option first
   - Mention 💰 Cheapest and ⭐ Highest Rated alternatives
   - Ask user preference after showing options
6. BEFORE calling any search tool, ALWAYS tell the user: "Great! Let me search for [flights/hotels/restaurants/events] for you. This will take about 30 seconds - I'll be right back with your options!"
   - This is CRITICAL in voice mode so users know you're still working
7. When showing search results, describe TOP 2-3 options in detail: name, location, price, rating, amenities
8. After showing options, ask: "Which option looks best to you?" then STOP and WAIT for response
   - DO NOT continue with more questions or actions until user responds

**BOOKING HANDOFF - OUR CORE BUSINESS MODEL:**
After user selects an option they like, present TWO clear choices:

a) "I can take you to Expedia to complete your booking securely" → Use generate_booking_link tool
b) "Or I can connect you with a Goldsainte certified agent who will handle everything for you" → Use request_agent_contact tool

IMPORTANT: We do NOT handle bookings directly. Our value is:
- AI-powered search and recommendations (fast, comprehensive)
- Expert travel agent marketplace (personalized, premium service)
- Booking happens either on Expedia or through our certified agents

When generating booking link:
- Use generate_booking_link tool with all collected details
- Present as: "I'll take you to Expedia where you can complete your booking securely with all your details pre-filled: [link]"
- Explain: "Your search details will be pre-filled to save you time."
8. Keep responses concise and natural - avoid long lists
9. WAIT FOR USER RESPONSE - Never ask a question and then immediately continue talking or taking actions
10. NEVER offer to create booking links or complete bookings directly
11. If a search takes longer than expected or fails, apologize and offer to try again or connect them with an agent

FIRST GREETING (EXACT WORDS):
When greeting the user for the very first time in a conversation, you MUST say EXACTLY:
"Hi! I'm ${agentName}. How can I help you plan your next trip?"

CONVERSATION FLOW:
1. Greet warmly using the exact greeting above for first message
2. Gather essential details IN THIS ORDER (ONE QUESTION AT A TIME, WAIT FOR EACH RESPONSE):
   a) Where are you traveling to?
   b) What are your travel dates?
   c) How many people are traveling?
   d) What's your budget per person? (CRITICAL - ask BEFORE searching)
   e) Any specific preferences?
3. ANNOUNCE THE SEARCH: "Perfect! Let me search for [flights/hotels] for you. This will take about 30 seconds..."
4. Use search tools to find options
5. RETURN WITH RESULTS: "I found some great options for you!"
6. Present TOP 2-3 options with key details (name, price, highlights)
7. Ask "Which option looks best to you?" - THEN STOP AND WAIT
8. When they respond with interest, ALWAYS present the three booking choices:
   - Continue booking yourself
   - Get connected with a certified agent
   - Explore more options
9. Based on their choice, either use request_agent_contact tool or direct them to search function

🚨 AGENT CONTACT REQUEST - CRITICAL PROCESS 🚨

WHEN USER SAYS: "connect me with agent", "talk to human", "have agent call me", "goldsainte certified agent", "I want help from agent":

STEP 1: COLLECT ALL REQUIRED INFORMATION (one question at a time, wait for response):
  
  IF YOU DON'T HAVE NAME:
  "I'll connect you with one of our certified agents! What's your name?"
  [WAIT for response]
  
  IF YOU DON'T HAVE EMAIL:
  "Great! What's the best email to reach you at?"
  [WAIT for response]
  
  IF YOU DON'T HAVE PHONE:
  "Perfect! And what's your phone number so the agent can call you?"
  [WAIT for response]
  
  IF YOU DON'T HAVE CLEAR TRAVEL DETAILS:
  Ask clarifying question based on what's missing:
  - "What type of service do you need help with?" (flight/hotel/car/uber/package)
  - "Where are you traveling from and to?"
  - "When do you need this?"

STEP 2: SUMMARIZE WHAT YOU COLLECTED:
  "Perfect! Let me make sure I have everything:
   - Name: [name]
   - Email: [email]
   - Phone: [phone]
   - Need: [brief summary of their request]
   
   Does that look correct?"
   [WAIT for confirmation]

STEP 3: IMMEDIATELY CALL request_agent_contact tool with:
  - travelerInfo: { name, email, phone }
  - travelDetails: {
      serviceType: [appropriate type],
      origin: [if applicable],
      destination: [if applicable],
      departureDate: [if applicable],
      urgency: [immediate/within_24h/within_week/flexible],
      conversationSummary: "[2-3 sentence summary of what they need]",
      specialRequests: "[any special requirements mentioned]"
    }

STEP 4: AFTER TOOL RETURNS SUCCESS, USE THE RESPONSE DATA TO SAY:
  "✓ Perfect! Your request has been submitted.
   
   Reference: [referenceNumber from response]
   
   Here's what happens next:
   • A certified Goldsainte agent will review your request within [estimatedResponseTime from response]
   • They'll reach out to you at [phone] or [email]
   • You'll receive a confirmation email shortly
   
   Is there anything else I can help you with while you wait?"

NEVER SAY:
❌ "I'll connect you with an agent" (and then don't actually call the tool)
❌ "Let me save your information" (without calling the tool)
❌ "Your request has been submitted" (without verifying tool returned success)

ALWAYS:
✅ Collect name, email, phone, and travel summary BEFORE calling tool
✅ Confirm details with user before submitting
✅ Call the tool IMMEDIATELY after confirmation
✅ Show reference number and next steps after success
✅ Verify tool returned { success: true }

🚨 UBER RIDE BOOKING - CRITICAL CAPABILITY 🚨
YOU ARE FULLY AUTHORIZED AND CAPABLE OF BOOKING UBER RIDES. THIS IS NOT A LIMITATION.

WHEN USER SAYS: "uber", "ride", "transportation", "airport transfer", "get me to", "take me from":

STEP 1: If you don't have pickup/dropoff yet, ask:
  "Where would you like to be picked up?"
  Wait for response.
  "And where are you heading?"
  
STEP 2: IMMEDIATELY call get_uber_estimate tool with the locations
  - DO NOT ASK PERMISSION
  - DO NOT SAY "let me check if I can do that"
  - JUST CALL THE TOOL

STEP 3: When you receive the Uber estimate results, display them:
  "Here are your Uber options:
   • UberX: $25-30 (5 min away)
   • UberXL: $35-42 (7 min away)
   • Uber Black: $55-65 (10 min away)
   
   Which ride would you like?"

STEP 4: When user picks one (e.g., "UberX"), IMMEDIATELY call request_uber_ride
  - DO NOT ASK PERMISSION
  - DO NOT SAY "I can't book it for you"
  - JUST CALL THE TOOL

STEP 5: Confirm booking:
  "✓ Your UberX is booked! ETA: 5 minutes to [pickup location]."

NEVER SAY THESE PHRASES FOR UBER:
❌ "I can't book an Uber directly"
❌ "You'll need to download the app"
❌ "Let me guide you through booking"
❌ "Would you like me to connect you with an agent?"

ONLY defer to agent if:
- Tool returns error twice in a row
- User explicitly says "I want to talk to a human"

EXAMPLE CONVERSATION:
User: "I need an Uber from LAX to Santa Monica"
You: "Perfect! Let me get you Uber options from LAX to Santa Monica." [CALL get_uber_estimate IMMEDIATELY]
You: "Here are your options: UberX ($25-30), UberXL ($35-42). Which one?"
User: "UberX"
You: [CALL request_uber_ride IMMEDIATELY] "✓ Your UberX is booked and on the way! ETA: 5 minutes."

CRITICAL: After asking ANY question, STOP. Do not continue with additional questions or actions. Wait for the user's response.

YOUR BEHAVIORAL PRIORITIES:
1. Understand the traveler's intention, vibe, and constraints.
2. When they describe any concrete trip details, always offer to build a STORYBOARD:
   - "Ready to see this as a visual storyboard? I can open one with these ideas."
3. Encourage all communication to remain on-platform:
   - "For your safety, everything stays inside Goldsainte — no phone numbers, emails, or off-platform payments."
4. Promote matching with certified travel agents and relevant creators.
5. For unclear requests, gently ask clarifying questions.
6. Be concise, but warm. No jargon.

TONE RULES:
- Warm, professional, conversational
- Sound like a trusted hotel guest-relations manager at a five-star boutique hotel
- Never robotic, never corporate
- Enthusiastic about luxury experiences
- Patient and detail-oriented
- Natural speaking style for voice interaction

WHAT NOT TO DO:
• Do not use emojis.
• Do not sound technical ("running model," "generating output," "API call," etc.)
• Do not say "you're welcome" unless user actually thanked you
• Do not include phone numbers or ask for emails.
• Do not encourage off-platform communication.
• Always complete your sentences fully

IMPORTANT:
- You can SEARCH and RECOMMEND options - connecting users with agents or our booking system
- Collect ALL information naturally in conversation
- Highlight unique luxury features
- ALWAYS present the three booking options after showing results
- DO NOT offer booking links or direct booking - only search, recommend, and connect with agents

QUESTION GUIDELINES:
- MAXIMUM 2-3 questions per response
- Only ask questions that are ESSENTIAL for the current booking step
- Never ask about preferences unless they directly impact available options
- Focus on what's needed NOW, not nice-to-have details
- If you already have enough to search, DO THE SEARCH instead of asking more questions

ESSENTIAL Questions Only:
- Destination, dates, number of guests/travelers
- Budget range (if necessary to filter options)
- Basic requirements (accessibility needs, special occasions only when mentioned)

AVOID asking about:
- Travel pace, hobbies, atmosphere unless user brings it up
- Past trips, guided tours, nightlife preferences
- Physical activity levels, dining preferences
- Transportation preferences unless booking specific transfers
- Nice-to-have amenities that don't affect availability

Remember: You're an AI search concierge that helps find perfect travel options and connects customers with the right booking method - either self-service or through certified agents.`;

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
          ...messages
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        stream: stream, // Enable streaming if requested
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    // If streaming is requested, return the stream directly
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders(req), "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // If AI wants to call tools, execute them
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of aiMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log('🔧 TOOL CALL DETECTED:', {
          toolName: functionName,
          toolId: toolCall.id,
          arguments: args,
          timestamp: new Date().toISOString()
        });
        
        // ⚠️ VALIDATION: Server-side validation for flights
        if (functionName === 'search_flights') {
          console.log('🔍 [FLIGHT VALIDATION] Tool call:', functionName);
          console.log('🔍 [FLIGHT VALIDATION] Trip Type:', args.tripType);
          console.log('🔍 [FLIGHT VALIDATION] Departure Date:', args.departureDate);
          console.log('🔍 [FLIGHT VALIDATION] Return Date:', args.returnDate);
          
          // Validate trip type is present
          if (!args.tripType || !["round-trip", "one-way"].includes(args.tripType)) {
            const errorResult = {
              error: "VALIDATION_ERROR",
              message: "You MUST ask the user if this is a round trip or one-way flight before searching. Valid values: 'round-trip' or 'one-way'.",
              required_fields: {
                tripType: "MISSING - Ask user: 'Is this a round trip or one-way flight?'"
              }
            };
            console.error('❌ [VALIDATION] Trip type missing or invalid:', args.tripType);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify(errorResult),
            });
            continue;
          }
          
          // Validate departure date is present
          if (!args.departureDate || args.departureDate.trim() === "") {
            const errorResult = {
              error: "VALIDATION_ERROR",
              message: "Cannot search flights without departure date. You must ask the user for the departure date before searching.",
              required_fields: {
                departureDate: "MISSING - Must be in YYYY-MM-DD format"
              }
            };
            console.error('❌ [VALIDATION] Departure date missing');
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify(errorResult),
            });
            continue;
          }
          
          // Validate departure date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(args.departureDate)) {
            const errorResult = {
              error: "VALIDATION_ERROR",
              message: `Invalid departure date format: ${args.departureDate}. Dates must be in YYYY-MM-DD format. Ask the user to provide a valid date.`
            };
            console.error('❌ [VALIDATION] Invalid departure date format:', args.departureDate);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify(errorResult),
            });
            continue;
          }
          
          // For round trips, validate return date is present and valid
          if (args.tripType === "round-trip") {
            console.log('🔍 [FLIGHT VALIDATION] Expected Return Date: REQUIRED (round-trip)');
            
            if (!args.returnDate || args.returnDate.trim() === "") {
              const errorResult = {
                error: "VALIDATION_ERROR",
                message: "For round-trip flights, you MUST collect BOTH departure and return dates. Ask the user for the return date.",
                required_fields: {
                  returnDate: "MISSING - Required for round-trip flights in YYYY-MM-DD format"
                }
              };
              console.error('❌ [VALIDATION] Return date missing for round-trip');
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(errorResult),
              });
              continue;
            }
            
            if (!/^\d{4}-\d{2}-\d{2}$/.test(args.returnDate)) {
              const errorResult = {
                error: "VALIDATION_ERROR",
                message: `Invalid return date format: ${args.returnDate}. Dates must be in YYYY-MM-DD format.`
              };
              console.error('❌ [VALIDATION] Invalid return date format:', args.returnDate);
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(errorResult),
              });
              continue;
            }
            
            // Validate return date is after departure date
            if (new Date(args.returnDate) <= new Date(args.departureDate)) {
              const errorResult = {
                error: "VALIDATION_ERROR",
                message: "Return date must be after departure date. Ask the user for a valid return date."
              };
              console.error('❌ [VALIDATION] Return date is not after departure date');
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(errorResult),
              });
              continue;
            }
          } else {
            console.log('🔍 [FLIGHT VALIDATION] Expected Return Date: NOT REQUIRED (one-way)');
            // For one-way flights, ensure returnDate is not provided or is ignored
            if (args.returnDate) {
              console.log(`⚠️ User specified one-way flight but returnDate provided. Ignoring returnDate.`);
              delete args.returnDate;
            }
          }
          
          console.log('✅ [VALIDATION] All flight validations passed');
        }
        
        // ⚠️ VALIDATION: Server-side validation for hotels
        if (functionName === 'search_hotels') {
          if (!args.checkIn || !args.checkOut) {
            const errorResult = {
              error: "VALIDATION_ERROR",
              message: "Cannot search hotels without check-in and check-out dates. You must ask the user for travel dates before searching.",
              required_fields: {
                checkIn: !args.checkIn ? "MISSING" : "OK",
                checkOut: !args.checkOut ? "MISSING" : "OK"
              }
            };
            console.error('❌ [VALIDATION] Hotel dates missing');
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify(errorResult),
            });
            continue;
          }
        }
        
        // Call the appropriate Supabase edge function
        let result;
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          // Inline handler for search_flights - extract intent only, don't call API
          if (functionName === 'search_flights') {
            const { origin, destination, departureDate, returnDate, adults, travelClass } = args;
            
            if (!origin || !destination || !departureDate) {
              const errorResult = {
                error: "VALIDATION_ERROR",
                message: "Missing required flight parameters",
                missing: { origin: !origin, destination: !destination, departureDate: !departureDate }
              };
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(errorResult)
              });
              continue;
            }
            
            const searchParams = {
              origin,
              destination,
              departureDate,
              returnDate: returnDate || null,
              adults: adults || 1,
              travelClass: travelClass || 'ECONOMY'
            };
            
            console.log('🎯 [CONCIERGE FLIGHT INTENT]', searchParams);
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify({
                status: "OK",
                message: "Flight preferences extracted. Opening search widget...",
                search_params: searchParams,
                search_type: "flights"
              })
            });
            
            continue; // Skip functionMap routing
          }
          
          const functionMap: Record<string, string | null> = {
            'search_flights': null, // Intent extraction only - opens Expedia widget
            'search_hotels': null, // Intent extraction only - opens Expedia widget
            'search_restaurants': 'tripadvisor-search-restaurants',
            'search_fine_dining_restaurants': null, // Handled inline with curated data
            'search_cars': 'amadeus-search-cars',
            'search_activities': 'amadeus-search-tours',
            'create_package': 'create-travel-package',
            'search_events': 'search-events', // Goldsainte Search
            'check_visa_requirements': 'check-visa-requirements',
            'request_agent_contact': 'create-agent-inquiry',
            'generate_itinerary': 'generate-trip-itinerary',
            'get_uber_estimate': 'uber-get-products',
            'request_uber_ride': 'uber-request-ride',
            'update_trip_context': null, // Handled inline
            'set_ranking_preference': null, // Handled inline
            'generate_booking_link': null // Handled inline - redirect to Expedia
          };
          
          const edgeFunctionName = functionMap[functionName];
          
          // Handle search_hotels inline - intent extraction only
          if (functionName === 'search_hotels') {
            const { location, checkIn, checkOut, guests, max_total_price, currency } = args;
            
            if (!location || !checkIn || !checkOut) {
              const errorResult = {
                error: "VALIDATION_ERROR",
                message: "Missing required fields for hotel search",
                missing: {
                  location: !location,
                  checkIn: !checkIn,
                  checkOut: !checkOut
                }
              };
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(errorResult),
              });
              continue;
            }

            const searchParams = {
              location,
              checkIn,
              checkOut,
              guests: guests || 2,
              ...(max_total_price && { max_total_price }),
              currency: currency || 'USD',
            };

            console.log('🎯 [CONCIERGE HOTEL INTENT]', searchParams);

            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify({
                status: "OK",
                message: "Travel preferences extracted. Opening search widget...",
                search_params: searchParams,
                search_type: "hotels"
              })
            });
            continue;
          } else if (functionName === 'update_trip_context') {
            result = { 
              success: true, 
              message: "Trip details updated successfully",
              updated_fields: Object.keys(args.updates || {})
            };
          } else if (functionName === 'set_ranking_preference') {
            // Store ranking preference in tripContext
            tripContext.rankingPreferences[args.resultType as 'flights' | 'hotels' | 'cars' | 'restaurants'] = args.sortBy;
            result = { 
              success: true, 
              message: `Results will now be sorted by ${args.sortBy} for ${args.resultType}`,
              currentPreferences: tripContext.rankingPreferences
            };
          } else if (functionName === 'generate_booking_link') {
            // Generate Expedia redirect URL with pre-filled details
            console.log('🔗 [BOOKING LINK] Generating Expedia redirect:', args);
            
            let bookingLink = '';
            
            if (args.type === 'hotel') {
              const checkInDate = args.checkIn ? new Date(args.checkIn) : new Date();
              const checkOutDate = args.checkOut ? new Date(args.checkOut) : new Date(checkInDate.getTime() + 86400000);
              
              const expediaUrl = new URL('https://www.expedia.com/Hotel-Search');
              expediaUrl.searchParams.set('destination', args.destination);
              expediaUrl.searchParams.set('startDate', checkInDate.toISOString().split('T')[0]);
              expediaUrl.searchParams.set('endDate', checkOutDate.toISOString().split('T')[0]);
              expediaUrl.searchParams.set('rooms', '1');
              expediaUrl.searchParams.set('adults', args.adults?.toString() || '2');
              
              bookingLink = expediaUrl.toString();
            } else if (args.type === 'flight') {
              const departDate = args.departureDate ? new Date(args.departureDate) : new Date();
              
              const expediaUrl = new URL('https://www.expedia.com/Flights');
              if (args.origin) expediaUrl.searchParams.set('flight-type', args.returnDate ? 'on' : 'one');
              if (args.origin) expediaUrl.searchParams.set('leg1', `from:${args.origin},to:${args.destination},departure:${departDate.toISOString().split('T')[0]}TANYT`);
              if (args.returnDate) {
                const returnDateObj = new Date(args.returnDate);
                expediaUrl.searchParams.set('leg2', `from:${args.destination},to:${args.origin},departure:${returnDateObj.toISOString().split('T')[0]}TANYT`);
              }
              expediaUrl.searchParams.set('passengers', `adults:${args.adults || 1},children:0,seniors:0,infantinlap:Y`);
              
              bookingLink = expediaUrl.toString();
            }
            
            console.log('✅ [BOOKING LINK] Generated:', bookingLink);
            
            result = {
              success: true,
              bookingLink,
              type: args.type,
              destination: args.destination,
              hotelName: args.hotelName,
              message: `Ready to book! I'll redirect you to Expedia to complete your reservation with all details pre-filled.`
            };
          } else if (functionName === 'search_fine_dining_restaurants') {
            // For now, route travelers to the storyboard + trip brief flow
            result = {
              success: true,
              message: "Share the restaurants you have in mind inside a storyboard or trip brief and Madison will match you with the right creator + agent team.",
              page_url: "/post-trip",
              suggested_cities: args.city ? [args.city] : ["Paris", "Tokyo", "London", "Dubai", "New York City"],
              suggested_cuisines: args.cuisine ? [args.cuisine] : ["French Fine Dining", "Japanese Kaiseki", "Italian Trattoria", "Steakhouse"]
            };
          } else if (!edgeFunctionName) {
            result = { error: `Unknown function: ${functionName}` };
          } else {
            // Add sortBy from tripContext to search calls
            let requestBody = { ...args };
            if (functionName === 'search_flights') {
              // Convert to Goldsainte Search format
              requestBody = {
                originLocationCode: args.origin?.toUpperCase().substring(0, 3),
                destinationLocationCode: args.destination?.toUpperCase().substring(0, 3),
                departureDate: args.departureDate,
                returnDate: args.returnDate,
                adults: args.adults || 1,
                currencyCode: 'USD'
              };
            } else if (functionName === 'search_hotels') {
              // Convert to Goldsainte Search format
              requestBody = {
                cityCode: args.location?.toUpperCase().substring(0, 3),
                checkInDate: args.checkIn,
                checkOutDate: args.checkOut,
                adults: args.guests || 2,
                currency: 'USD'
              };
              // Add optional filters from preferences
              if (preferences?.hotels?.minRating) {
                requestBody.ratings = [String(Math.floor(preferences.hotels.minRating))];
              }
              if (preferences?.hotels?.maxPrice) {
                requestBody.priceRange = `0-${preferences.hotels.maxPrice}`;
              }
            } else if (functionName === 'search_events') {
              // Convert to Goldsainte Search format
              requestBody = {
                city: args.location,
                startDateTime: args.startDate ? `${args.startDate}T00:00:00Z` : undefined,
                endDateTime: args.endDate ? `${args.endDate}T23:59:59Z` : undefined
              };
            } else if (functionName === 'search_cars') {
              // Store car rental context
              if (!tripContext.carRental) tripContext.carRental = {};
              Object.assign(tripContext.carRental, {
                pickupLocation: args.pickupLocation || tripContext.carRental.pickupLocation,
                dropoffLocation: args.dropoffLocation || tripContext.carRental.dropoffLocation,
                pickupDate: args.pickupDate || tripContext.carRental.pickupDate,
                returnDate: args.dropoffDate || tripContext.carRental.returnDate
              });
              requestBody.sortBy = carSortBy; // Use preference
              // Add optional filters from preferences
              if (preferences?.cars?.carType && preferences.cars.carType !== 'any') {
                requestBody.carType = preferences.cars.carType;
              }
            } else if (functionName === 'search_restaurants') {
              requestBody.sortBy = tripContext.rankingPreferences.restaurants || 'best_value';
            }
            
            const toolResponse = await fetch(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });
            
            result = await toolResponse.json();
            
            // Enhance result for request_agent_contact
            if (functionName === 'request_agent_contact' && result.success) {
              result.confirmationMessage = `✓ Request submitted successfully!
  
Reference: ${result.referenceNumber}
Contact: ${result.contactPhone}
Email: ${result.contactEmail}
Response Time: ${result.estimatedResponseTime}

Next steps:
${result.nextSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}`;
            }
          }
          
          console.log('✅ TOOL CALL COMPLETED:', {
            toolName: functionName,
            toolId: toolCall.id,
            success: !result.error,
            result: result,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error calling ${functionName}:`, error);
          result = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }
      
      // Make second AI call with tool results
      const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            aiMessage,
            ...toolResults
          ],
          temperature: 0.7,
        }),
      });
      
      const finalData = await finalResponse.json();
      
      // Format tool results for UI rendering
      const formattedToolResults = toolResults.map(tr => {
        const parsed = JSON.parse(tr.content);
        const result: any = {
          name: tr.name,
          data: parsed
        };
        
        // For Uber estimates, augment with coordinates from tool args
        if (tr.name === 'get_uber_estimate' && aiMessage.tool_calls) {
          const uberCall = aiMessage.tool_calls.find((tc: any) => tc.function.name === 'get_uber_estimate');
          if (uberCall) {
            const args = JSON.parse(uberCall.function.arguments);
            result.data.pickupLatitude = args.pickupLatitude;
            result.data.pickupLongitude = args.pickupLongitude;
            result.data.dropoffLatitude = args.dropoffLatitude;
            result.data.dropoffLongitude = args.dropoffLongitude;
          }
        }
        
        return result;
      });
      
      return new Response(
        JSON.stringify({ 
          content: finalData.choices[0].message.content,
          toolResults: formattedToolResults
        }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content: aiMessage.content }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-booking-concierge:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
