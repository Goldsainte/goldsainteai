import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, getUserTier, getTieredRateLimit, type SubscriptionTier } from "../_shared/rateLimiter.ts";

// ⚠️ SECURITY: Input validation for AI messages
const validateAIInput = (data: any): { success: boolean; error?: string } => {
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
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return { success: false, error: 'Invalid message role' };
    }
  }
  
  return { success: true };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for all booking types
const tools = [
  // Hotels
  {
    type: "function",
    function: {
      name: "search_hotels",
      description: "Search for hotels based on location, dates, and preferences. Returns a list of available hotels.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or location name" },
          checkIn: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          checkOut: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
          adults: { type: "integer", description: "Number of guests", default: 2 }
        },
        required: ["location", "checkIn", "checkOut"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_hotel",
      description: "Book a hotel after user confirmation.",
      parameters: {
        type: "object",
        properties: {
          hotelId: { type: "string" },
          hotelName: { type: "string" },
          checkIn: { type: "string" },
          checkOut: { type: "string" },
          guestFirstName: { type: "string" },
          guestLastName: { type: "string" },
          guestEmail: { type: "string" },
          guestPhone: { type: "string" },
          totalPrice: { type: "number" }
        },
        required: ["hotelId", "hotelName", "checkIn", "checkOut", "guestFirstName", "guestLastName", "guestEmail", "totalPrice"],
        additionalProperties: false
      }
    }
  },
  // Flights
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for flights between origin and destination on specified dates.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin airport code (e.g., 'JFK', 'LAX')" },
          destination: { type: "string", description: "Destination airport code" },
          departureDate: { type: "string", description: "Departure date (YYYY-MM-DD)" },
          returnDate: { type: "string", description: "Return date (YYYY-MM-DD) for round-trip" },
          adults: { type: "integer", description: "Number of passengers", default: 1 }
        },
        required: ["origin", "destination", "departureDate"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_flight",
      description: "Book a flight after user confirmation.",
      parameters: {
        type: "object",
        properties: {
          flightId: { type: "string" },
          airline: { type: "string" },
          origin: { type: "string" },
          destination: { type: "string" },
          departureDate: { type: "string" },
          passengerFirstName: { type: "string" },
          passengerLastName: { type: "string" },
          passengerEmail: { type: "string" },
          totalPrice: { type: "number" }
        },
        required: ["flightId", "airline", "origin", "destination", "departureDate", "passengerFirstName", "passengerLastName", "passengerEmail", "totalPrice"],
        additionalProperties: false
      }
    }
  },
  // Restaurants
  {
    type: "function",
    function: {
      name: "search_restaurants",
      description: "Search for restaurants in a specific location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or area name" },
          cuisine: { type: "string", description: "Cuisine type (optional)" },
          priceLevel: { type: "string", description: "Price range (optional, e.g., '$', '$$', '$$$')" }
        },
        required: ["location"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_restaurant",
      description: "Make a restaurant reservation after user confirmation.",
      parameters: {
        type: "object",
        properties: {
          restaurantId: { type: "string" },
          restaurantName: { type: "string" },
          date: { type: "string", description: "Reservation date (YYYY-MM-DD)" },
          time: { type: "string", description: "Reservation time (HH:MM)" },
          partySize: { type: "integer", description: "Number of guests" },
          guestName: { type: "string" },
          guestPhone: { type: "string" },
          guestEmail: { type: "string" }
        },
        required: ["restaurantId", "restaurantName", "date", "time", "partySize", "guestName", "guestPhone", "guestEmail"],
        additionalProperties: false
      }
    }
  },
  // Events
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search for events and activities in a location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or area name" },
          startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
          endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
          category: { type: "string", description: "Event category (optional, e.g., 'music', 'sports', 'arts')" }
        },
        required: ["location"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_event",
      description: "Book tickets for an event after user confirmation.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          eventName: { type: "string" },
          date: { type: "string" },
          tickets: { type: "integer", description: "Number of tickets" },
          attendeeFirstName: { type: "string" },
          attendeeLastName: { type: "string" },
          attendeeEmail: { type: "string" },
          totalPrice: { type: "number" }
        },
        required: ["eventId", "eventName", "date", "tickets", "attendeeFirstName", "attendeeLastName", "attendeeEmail", "totalPrice"],
        additionalProperties: false
      }
    }
  },
  // Cars
  {
    type: "function",
    function: {
      name: "search_cars",
      description: "Search for rental cars at a location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Pickup location (city or airport code)" },
          pickupDate: { type: "string", description: "Pickup date (YYYY-MM-DD)" },
          dropoffDate: { type: "string", description: "Dropoff date (YYYY-MM-DD)" }
        },
        required: ["location", "pickupDate", "dropoffDate"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_car",
      description: "Book a rental car after user confirmation.",
      parameters: {
        type: "object",
        properties: {
          carId: { type: "string" },
          carType: { type: "string" },
          pickupLocation: { type: "string" },
          pickupDate: { type: "string" },
          dropoffDate: { type: "string" },
          driverFirstName: { type: "string" },
          driverLastName: { type: "string" },
          driverEmail: { type: "string" },
          totalPrice: { type: "number" }
        },
        required: ["carId", "carType", "pickupLocation", "pickupDate", "dropoffDate", "driverFirstName", "driverLastName", "driverEmail", "totalPrice"],
        additionalProperties: false
      }
    }
  },
  // Date Flexibility
  {
    type: "function",
    function: {
      name: "compare_date_flexibility",
      description: "Compare flight prices across different dates (±3 days). Shows price deltas and savings.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin airport code" },
          destination: { type: "string", description: "Destination airport code" },
          preferredDepartDate: { type: "string", description: "Preferred departure date (YYYY-MM-DD)" },
          preferredReturnDate: { type: "string", description: "Preferred return date (YYYY-MM-DD) - optional" },
          dayRange: { type: "integer", description: "Number of days to check before/after (default 3)", default: 3 }
        },
        required: ["origin", "destination", "preferredDepartDate"],
        additionalProperties: false
      }
    }
  },
  // Multi-City
  {
    type: "function",
    function: {
      name: "search_multi_city_flights",
      description: "Search multi-city flights with multiple segments (e.g., NYC→Paris→Rome→NYC).",
      parameters: {
        type: "object",
        properties: {
          segments: {
            type: "array",
            description: "Array of flight segments",
            items: {
              type: "object",
              properties: {
                origin: { type: "string", description: "Origin airport code" },
                destination: { type: "string", description: "Destination airport code" },
                date: { type: "string", description: "Departure date (YYYY-MM-DD)" }
              },
              required: ["origin", "destination", "date"]
            }
          },
          travelClass: { type: "string", description: "Travel class (ECONOMY, BUSINESS, FIRST)", default: "ECONOMY" }
        },
        required: ["segments"],
        additionalProperties: false
      }
    }
  },
  // Travel Advisories
  {
    type: "function",
    function: {
      name: "get_travel_advisories",
      description: "Get current U.S. State Department travel advisories for a destination.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string", description: "Country or city name" }
        },
        required: ["destination"],
        additionalProperties: false
      }
    }
  },
  // Baggage Policy
  {
    type: "function",
    function: {
      name: "lookup_baggage_policy",
      description: "Look up airline baggage policies and change/cancel fees.",
      parameters: {
        type: "object",
        properties: {
          airlineCode: { type: "string", description: "2-letter airline code (e.g., AA, DL, UA)" },
          fareClass: { type: "string", description: "Fare class (e.g., basic, main, premium)" },
          queryType: { type: "string", description: "Query type: 'baggage', 'change_cancel', or 'both'", default: "both" }
        },
        required: ["airlineCode"],
        additionalProperties: false
      }
    }
  }
];

// Handle tool calls
async function handleToolCall(toolName: string, args: any): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  console.log(`Executing tool: ${toolName}`, args);

  // HOTELS - Intent extraction only
  if (toolName === "search_hotels") {
    const { location, checkIn, checkOut, adults } = args;

    if (!location || !checkIn || !checkOut) {
      return { 
        status: "ERROR", 
        message: "Missing required fields", 
        missing: { 
          location: !location, 
          checkIn: !checkIn, 
          checkOut: !checkOut 
        } 
      };
    }

    const searchParams = {
      location,
      checkIn,
      checkOut,
      guests: adults || 2,
      currency: 'USD'
    };

    console.log('🎯 [ASSISTANT HOTEL INTENT]', searchParams);

    return {
      status: "OK",
      message: "Travel preferences extracted. Opening search widget...",
      search_params: searchParams,
      search_type: "hotels"
    };
  }

  if (toolName === "book_hotel") {
    const bookingReference = `HOTEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_type: 'hotel',
      booking_reference: bookingReference,
      status: 'confirmed',
      total_price: args.totalPrice,
      currency: 'USD',
      booking_data: {
        hotelId: args.hotelId,
        hotelName: args.hotelName,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        guest: {
          firstName: args.guestFirstName,
          lastName: args.guestLastName,
          email: args.guestEmail,
          phone: args.guestPhone
        }
      }
    }).select().single();

    if (error) return { error: 'Failed to create booking.' };
    return { success: true, bookingReference, message: `Hotel booked! Confirmation: ${bookingReference}` };
  }

  // FLIGHTS - Extract intent only, open Expedia widget
  if (toolName === "search_flights") {
    const { origin, destination, departureDate, returnDate, adults } = args;
    
    if (!origin || !destination || !departureDate) {
      return {
        status: "ERROR",
        message: "Missing required flight parameters",
        missing: { origin: !origin, destination: !destination, departureDate: !departureDate }
      };
    }
    
    const searchParams = {
      origin,
      destination,
      departureDate,
      returnDate: returnDate || null,
      adults: adults || 1
    };
    
    console.log('🎯 [ASSISTANT FLIGHT INTENT]', searchParams);
    
    return {
      status: "OK",
      message: "Flight preferences extracted. Opening search widget...",
      search_params: searchParams,
      search_type: "flights"
    };
  }

  if (toolName === "book_flight") {
    const bookingReference = `FLIGHT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_type: 'flight',
      booking_reference: bookingReference,
      status: 'confirmed',
      total_price: args.totalPrice,
      currency: 'USD',
      booking_data: {
        flightId: args.flightId,
        airline: args.airline,
        origin: args.origin,
        destination: args.destination,
        departureDate: args.departureDate,
        passenger: {
          firstName: args.passengerFirstName,
          lastName: args.passengerLastName,
          email: args.passengerEmail
        }
      }
    }).select().single();

    if (error) return { error: 'Failed to book flight.' };
    return { success: true, bookingReference, message: `Flight booked! Confirmation: ${bookingReference}` };
  }

  // RESTAURANTS
  if (toolName === "search_restaurants") {
    const response = await fetch(`${supabaseUrl}/functions/v1/tripadvisor-search-restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ location: args.location })
    });

    if (!response.ok) return { error: 'Failed to search restaurants.' };
    const data = await response.json();
    
    const restaurants = data.results?.slice(0, 5).map((rest: any) => ({
      id: rest.id,
      name: rest.name,
      cuisine: rest.cuisine,
      priceLevel: rest.priceLevel,
      rating: rest.rating,
      address: rest.address
    })) || [];

    return { success: true, restaurants, message: `Found ${restaurants.length} restaurants` };
  }

  if (toolName === "book_restaurant") {
    const bookingReference = `REST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_type: 'restaurant',
      booking_reference: bookingReference,
      status: 'confirmed',
      total_price: 0,
      currency: 'USD',
      booking_data: {
        restaurantId: args.restaurantId,
        restaurantName: args.restaurantName,
        date: args.date,
        time: args.time,
        partySize: args.partySize,
        guest: {
          name: args.guestName,
          phone: args.guestPhone,
          email: args.guestEmail
        }
      }
    }).select().single();

    if (error) return { error: 'Failed to book restaurant.' };
    return { success: true, bookingReference, message: `Reservation confirmed! Reference: ${bookingReference}` };
  }

  // EVENTS
  if (toolName === "search_events") {
    const response = await fetch(`${supabaseUrl}/functions/v1/search-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        city: args.location,
        startDateTime: args.startDate ? `${args.startDate}T00:00:00Z` : undefined,
        endDateTime: args.endDate ? `${args.endDate}T23:59:59Z` : undefined,
        keyword: args.category
      })
    });

    if (!response.ok) return { error: 'Failed to search events.' };
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const events = data.results.slice(0, 5).map((event: any) => ({
        id: event.id,
        name: event.name,
        date: event.dates?.start?.localDate || '',
        time: event.dates?.start?.localTime || 'TBD',
        venue: event.venues?.[0]?.name || 'TBD',
        price: event.priceRanges?.[0]?.min || 0,
        currency: event.priceRanges?.[0]?.currency || 'USD',
        category: event.classifications?.[0]?.segment?.name || 'Event',
        images: event.images?.slice(0, 2) || []
      }));
      return { success: true, events, message: `Found ${events.length} events` };
    }
    
    return { 
      success: true, 
      events: [], 
      suggestions: data.suggestions || [],
      message: 'No events found. Try adjusting your search criteria.' 
    };
  }

  if (toolName === "book_event") {
    const bookingReference = `EVENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_type: 'event',
      booking_reference: bookingReference,
      status: 'confirmed',
      total_price: args.totalPrice,
      currency: 'USD',
      booking_data: {
        eventId: args.eventId,
        eventName: args.eventName,
        date: args.date,
        tickets: args.tickets,
        attendee: {
          firstName: args.attendeeFirstName,
          lastName: args.attendeeLastName,
          email: args.attendeeEmail
        }
      }
    }).select().single();

    if (error) return { error: 'Failed to book event.' };
    return { success: true, bookingReference, message: `Event tickets booked! Confirmation: ${bookingReference}` };
  }

  // CARS
  if (toolName === "search_cars") {
    const response = await fetch(`${supabaseUrl}/functions/v1/amadeus-search-cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        location: args.location,
        pickupDate: args.pickupDate,
        dropoffDate: args.dropoffDate
      })
    });

    if (!response.ok) return { error: 'Failed to search cars.' };
    const data = await response.json();
    
    const cars = data.results?.slice(0, 5).map((car: any) => ({
      id: car.id,
      type: car.type,
      price: car.price,
      company: car.company,
      category: car.category
    })) || [];

    return { success: true, cars, message: `Found ${cars.length} rental cars` };
  }

  if (toolName === "book_car") {
    const bookingReference = `CAR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_type: 'car',
      booking_reference: bookingReference,
      status: 'confirmed',
      total_price: args.totalPrice,
      currency: 'USD',
      booking_data: {
        carId: args.carId,
        carType: args.carType,
        pickupLocation: args.pickupLocation,
        pickupDate: args.pickupDate,
        dropoffDate: args.dropoffDate,
        driver: {
          firstName: args.driverFirstName,
          lastName: args.driverLastName,
          email: args.driverEmail
        }
      }
    }).select().single();

    if (error) return { error: 'Failed to book car.' };
    return { success: true, bookingReference, message: `Car rental booked! Confirmation: ${bookingReference}` };
  }

  // DATE FLEXIBILITY
  if (toolName === "compare_date_flexibility") {
    const response = await fetch(`${supabaseUrl}/functions/v1/compare-date-flexibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        origin: args.origin,
        destination: args.destination,
        preferredDepartDate: args.preferredDepartDate,
        preferredReturnDate: args.preferredReturnDate,
        dayRange: args.dayRange || 3
      })
    });

    if (!response.ok) return { error: 'Failed to compare date flexibility.' };
    const data = await response.json();
    
    return { 
      success: true, 
      comparison: data.comparison,
      cheapestOption: data.cheapestOption,
      summary: data.summary,
      message: `Found ${data.totalOptionsFound} date options. Save up to $${data.cheapestOption.savings.toFixed(2)} by flying on ${data.cheapestOption.departDate}`
    };
  }

  // MULTI-CITY
  if (toolName === "search_multi_city_flights") {
    const response = await fetch(`${supabaseUrl}/functions/v1/search-multi-city-flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        segments: args.segments,
        travelClass: args.travelClass || 'ECONOMY'
      })
    });

    if (!response.ok) return { error: 'Failed to search multi-city flights.' };
    const data = await response.json();
    
    if (data.flights && data.flights.length > 0) {
      const topFlights = data.flights.slice(0, 5).map((flight: any) => ({
        id: flight.id,
        price: flight.price?.total,
        currency: flight.price?.currency,
        totalDuration: flight.metadata?.totalDurationFormatted,
        stops: flight.metadata?.totalStops,
        segments: flight.itineraries
      }));
      
      return { 
        success: true, 
        flights: topFlights,
        cheapest: data.cheapest,
        message: `Found ${data.totalOptions} multi-city options. Best price: ${data.summary.priceRange?.currency} ${data.summary.priceRange?.min}`
      };
    }
    
    return { success: true, flights: [], message: 'No multi-city flights found for these segments.' };
  }

  // TRAVEL ADVISORIES
  if (toolName === "get_travel_advisories") {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-travel-advisories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ destination: args.destination })
    });

    if (!response.ok) return { error: 'Failed to get travel advisories.' };
    const data = await response.json();
    
    return { 
      success: true, 
      advisory: {
        destination: data.destination,
        level: data.level,
        levelName: data.levelName,
        summary: data.summary,
        safetyTips: data.safetyTips,
        source: data.source
      },
      message: `Travel Advisory for ${data.destination}: Level ${data.level} - ${data.levelName}`
    };
  }

  // BAGGAGE POLICY
  if (toolName === "lookup_baggage_policy") {
    const response = await fetch(`${supabaseUrl}/functions/v1/lookup-baggage-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        airlineCode: args.airlineCode,
        fareClass: args.fareClass,
        queryType: args.queryType || 'both'
      })
    });

    if (!response.ok) return { error: 'Failed to lookup baggage policy.' };
    const data = await response.json();
    
    return { 
      success: true, 
      airline: data.airline,
      policy: {
        carryOn: data.carryOn,
        checked: data.checked,
        changeCancelPolicy: data.changeCancelPolicy
      },
      message: `${data.airline} baggage policy retrieved`
    };
  }

  return { error: 'Unknown tool' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ⚠️ SECURITY: Rate limiting for AI assistant
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    let tier: SubscriptionTier = 'unauthenticated';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
        const tempClient = createClient(supabaseUrl!, supabaseKey!);
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
    const limits = getTieredRateLimit(tier, 'ai-booking-assistant');
    
    const rateLimit = await checkRateLimit({
      ...limits,
      identifier: clientId,
      endpoint: 'ai-booking-assistant',
      tier
    });
    
    if (!rateLimit.allowed) {
      console.log('❌ [RATE LIMIT] Request blocked for:', clientId);
      return createRateLimitResponse(rateLimit, corsHeaders);
    }
    
    console.log(`✅ [RATE LIMIT] ${rateLimit.remaining} AI assistant requests remaining`);

    // ⚠️ SECURITY: Validate input
    const body = await req.json();
    console.log('🔒 [VALIDATION] Validating AI assistant input');
    const validation = validateAIInput(body);
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [VALIDATION] Input validated');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI responses

    try {
      const { messages } = body;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `You are a luxury travel booking assistant for Goldsainte AI with full booking capabilities.

GOLDSAINTE SEARCH TOOLS - CRITICAL RULES:
For hotels, flights, and events, you MUST:
1. Always call the Goldsainte Search tools (search_hotels, search_flights, search_events)
2. Ask for missing essentials in at most TWO questions, then run the search
3. NEVER fabricate results - only present data from actual API responses
4. If there are no results, the system will retry once with broader parameters automatically
5. If still no results, offer the top three next-best options (nearby areas or dates) from suggestions
6. Present results consistently: the same fields, the same order, and the same tone every time

RESULT PRESENTATION (ALWAYS THIS EXACT FORMAT):
Hotels: name, location, price per night, rating/5, top 3 amenities, distance from center
Flights: airline, price, departure time → arrival time, duration, stops (non-stop/1 stop/2 stops)
Events: name, date & time, venue, price, category, ticket availability

CAPABILITIES:
✈️ FLIGHTS - Search and book flights worldwide using Amadeus data
   • Simple round-trip & one-way flights
   • Multi-city flights with multiple segments
   • Date flexibility comparison (±3 days with price deltas)
🏨 HOTELS - Search and book luxury accommodations with photos and ratings
🍽️ RESTAURANTS - Find and reserve dining experiences
🎭 EVENTS - Discover and book tickets for events and activities
🚗 CARS - Search and book rental vehicles
📋 BAGGAGE POLICIES - Look up airline baggage allowances and change/cancel fees
🌍 TRAVEL ADVISORIES - Get current U.S. State Department safety advisories

ADVANCED FLIGHT FEATURES:
• DATE FLEXIBILITY: When users ask "around March 10" or want to save money, use compare_date_flexibility to show ±3 day options with price deltas
  Example: "NYC→MIA around March 10" → Compare March 7-13 and show cheapest dates
• MULTI-CITY: For complex itineraries like "NYC→Paris→Rome→NYC", use search_multi_city_flights
  Example: Segments [{origin: JFK, dest: CDG, date: 2025-05-01}, {origin: CDG, dest: FCO, date: 2025-05-10}, ...]
• BAGGAGE: When users ask about carry-on/checked bags or change fees, use lookup_baggage_policy
  Example: "AA basic economy baggage" → Show carry-on rules, checked fees, change penalties
• SAFETY: For destination safety concerns, use get_travel_advisories
  Example: "Is Istanbul safe?" → Show State Dept advisory level, safety tips

HOTEL SEARCH PROTOCOL - CRITICAL DATE TERMINOLOGY:
When booking hotels, ALWAYS use these EXACT terms:
✅ "When would you like to CHECK IN?"
✅ "And when will you be CHECKING OUT?"
❌ NEVER say "departure date" for hotels
❌ NEVER ask for "arrival" or "departure" for hotels

CORRECT hotel conversation flow:
User: "I need a hotel in Miami"
AI: "Perfect! When would you like to check in to your Miami hotel?"
User: "November 8th"
AI: "Great! And when will you be checking out?"
User: "November 11th"
AI: "Excellent - I'll search for hotels in Miami from November 8-11 (3 nights). What's your budget per night?"

VALIDATION: Always verify check-out date is AFTER check-in date. If not, politely ask user to confirm dates.

BOOKING WORKFLOW (applies to all services):
1. Gather requirements: destination/location, dates, number of people
2. Ask about budget (REQUIRED before search): "What's your approximate budget per person?"
3. Use appropriate Goldsainte search tool (search_hotels, search_flights, search_events)
4. Present top 3-5 options consistently with photos when available
5. When user selects an option, collect required information (name, email, phone)
6. Confirm ALL details before booking
7. Use appropriate booking tool (book_hotel, book_flight, etc.)
8. Provide booking reference and confirmation

IMPORTANT RULES:
- Always search before booking
- Never book without explicit user confirmation
- Always collect complete guest/passenger/driver information
- Present prices clearly with currency
- Show hotel photos and ratings from Amadeus
- Be conversational and luxury-focused
- Handle one booking type at a time for clarity
- If zero results, acknowledge suggestions and offer alternatives
- Proactively suggest date flexibility when prices are high
- Mention baggage policies for economy/basic fares
- For HOTELS: Use "check in" and "check out" terminology exclusively
- For FLIGHTS: Use "departure" and "return/arrival" terminology

Example: "I can search for hotels in Paris from March 15-20. What's your budget per person?"
Example: "Want to save money? I can check flights ±3 days around your dates to find better prices."
Example: "Would you like me to book the Ritz Paris for $450/night (March 15-20)? I'll need your full name, email, and phone number."
Example: "Flying Basic Economy? Let me check AA's baggage policy for you - carry-on may not be included."`;

      // First API call with tools
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-2025-08-07",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          tools,
          stream: false, // Disable streaming for tool calls
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await response.json();
      const assistantMessage = aiResponse.choices[0].message;

      // Check if AI wants to call a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('AI requested tool calls:', assistantMessage.tool_calls);
        
        // Execute all tool calls
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall: any) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await handleToolCall(toolCall.function.name, args);
            return {
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: JSON.stringify(result)
            };
          })
        );

        // Second API call with tool results - this time with streaming
        const updatedMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults
        ];

        const streamResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-5-2025-08-07",
            messages: updatedMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          throw new Error('Failed to get streaming response after tool execution');
        }

        return new Response(streamResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // No tool calls, return the assistant's message as stream
      const content = assistantMessage.content || "I'm here to help you book hotels. What destination are you interested in?";
      
      // Create a simple SSE stream
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const chunk = {
            choices: [{
              delta: { content },
              index: 0,
              finish_reason: "stop"
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        console.error("AI request timeout");
        return new Response(JSON.stringify({ error: "Request timed out. Please try again." }), {
          status: 408,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("AI booking assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
