import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false, agentProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for flights between two cities. Returns flight options with prices, airlines, and schedules.",
          parameters: {
            type: "object",
            properties: {
              origin: { type: "string", description: "Departure city or airport code (e.g., 'New York' or 'JFK')" },
              destination: { type: "string", description: "Arrival city or airport code (e.g., 'Paris' or 'CDG')" },
              departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
              returnDate: { type: "string", description: "Return date in YYYY-MM-DD format (optional for one-way)" },
              adults: { type: "number", description: "Number of adult passengers", default: 1 }
            },
            required: ["origin", "destination", "departureDate"]
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
      }
    ];

    // Build personalized system prompt
    const agentName = agentProfile?.agent_name || "your Goldsainte AI Travel Concierge";
    let systemPrompt = `You are ${agentName} - a sophisticated luxury travel assistant specializing in high-end travel experiences.`;
    
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

    // Add the rest of the system prompt
    systemPrompt += `

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

CRITICAL RULES:
1. I CAN SEARCH AND RECOMMEND travel options - I help you find the perfect flights, hotels, rental cars, restaurants, events, and check visa requirements
   - In voice mode, SAY THIS: "I can help you search for flights, hotels, rental cars, restaurants, and events - plus check visa requirements."
2. ALWAYS collect complete details before searching: dates, location, number of guests, preferences
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
3. BEFORE calling any search tool, ALWAYS tell the user: "Great! Let me search for [flights/hotels/restaurants/events] for you. This will take about 30 seconds - I'll be right back with your options!"
   - This is CRITICAL in voice mode so users know you're still working
4. When showing search results, describe TOP 2-3 options in detail: name, location, price, rating, amenities
5. After showing options, ask: "Which option looks best to you?" then STOP and WAIT for response
   - DO NOT continue with more questions or actions until user responds
6. After user shows interest in an option, ALWAYS present these three choices:
   a) "Would you like to continue booking yourself using our search function?"
   b) "Would you like me to send your information to a Goldsainte certified agent who can handle everything?"
   c) "Would you like to explore more options first?"
7. If user chooses agent contact, use the request_agent_contact tool to save their information
8. Keep responses concise and natural - avoid long lists
9. WAIT FOR USER RESPONSE - Never ask a question and then immediately continue talking or taking actions
10. NEVER offer to create booking links or complete bookings directly
11. If a search takes longer than expected or fails, apologize and offer to try again or connect them with an agent

FIRST GREETING (EXACT WORDS):
When greeting the user for the very first time in a conversation, you MUST say EXACTLY:
"Hi! I'm ${agentName}. How can I help you plan your next trip?"

CONVERSATION FLOW:
1. Greet warmly using the exact greeting above for first message
2. Gather essential details (destination, dates, guests, budget, preferences) - ONE QUESTION AT A TIME
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

TONE:
- Warm, professional, conversational
- Enthusiastic about luxury experiences
- Patient and detail-oriented
- Natural speaking style for voice interaction

IMPORTANT:
- You can SEARCH and RECOMMEND options - connecting users with agents or our booking system
- Collect ALL information naturally in conversation
- Highlight unique luxury features
- ALWAYS present the three booking options after showing results
- Never say "you're welcome" unless user actually thanked you
- Always complete your sentences fully
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    // If streaming is requested, return the stream directly
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
        
        // Call the appropriate Supabase edge function
        let result;
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          const functionMap: Record<string, string> = {
            'search_flights': 'unified-search-flights',
            'search_hotels': 'unified-search-hotels',
            'search_restaurants': 'tripadvisor-search-restaurants',
            'search_fine_dining_restaurants': null, // Handled inline with curated data
            'search_cars': 'amadeus-search-cars',
            'search_cars': 'amadeus-search-cars',
            'create_package': 'create-travel-package',
            'search_events': 'search-events',
            'check_visa_requirements': 'check-visa-requirements',
            'request_agent_contact': 'create-agent-inquiry',
            'generate_itinerary': 'generate-trip-itinerary',
            'get_uber_estimate': 'uber-get-products',
            'request_uber_ride': 'uber-request-ride',
            'update_trip_context': null, // Handled inline
            'set_ranking_preference': null // Handled inline
          };
          
          const edgeFunctionName = functionMap[functionName];
          
          // Handle update_trip_context inline
          if (functionName === 'update_trip_context') {
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
          } else if (functionName === 'search_fine_dining_restaurants') {
            // For now, return a message directing users to the fine dining page
            // In production, you'd want to duplicate the curated data or use an API
            result = {
              success: true,
              message: "I recommend visiting our Fine Dining page to explore our curated collection of 2,520+ luxury restaurants across 30 global destinations. You can filter by city and cuisine type to find the perfect dining experience.",
              page_url: "/fine-dining",
              suggested_cities: args.city ? [args.city] : ["Paris", "Tokyo", "London", "Dubai", "New York City"],
              suggested_cuisines: args.cuisine ? [args.cuisine] : ["French Fine Dining", "Japanese Kaiseki", "Italian Trattoria", "Steakhouse"]
            };
          } else if (!edgeFunctionName) {
            result = { error: `Unknown function: ${functionName}` };
          } else {
            // Add sortBy from tripContext to search calls
            let requestBody = { ...args };
            if (functionName === 'search_flights') {
              requestBody.sortBy = tripContext.rankingPreferences.flights || 'best_value';
            } else if (functionName === 'search_hotels') {
              requestBody.sortBy = tripContext.rankingPreferences.hotels || 'best_value';
            } else if (functionName === 'search_cars') {
              // Store car rental context
              if (!tripContext.carRental) tripContext.carRental = {};
              Object.assign(tripContext.carRental, {
                pickupLocation: args.pickupLocation || tripContext.carRental.pickupLocation,
                dropoffLocation: args.dropoffLocation || tripContext.carRental.dropoffLocation,
                pickupDate: args.pickupDate || tripContext.carRental.pickupDate,
                returnDate: args.dropoffDate || tripContext.carRental.returnDate
              });
              requestBody.sortBy = tripContext.rankingPreferences.cars || 'best_value';
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
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content: aiMessage.content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-booking-concierge:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
