import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  }
];

// Handle tool calls
async function handleToolCall(toolName: string, args: any): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  console.log(`Executing tool: ${toolName}`, args);

  // HOTELS
  if (toolName === "search_hotels") {
    const response = await fetch(`${supabaseUrl}/functions/v1/unified-search-hotels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        location: args.location,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        guests: args.adults || 2
      })
    });

    if (!response.ok) return { error: 'Failed to search hotels.' };
    const data = await response.json();
    
    const hotels = data.results?.slice(0, 5).map((hotel: any) => ({
      id: hotel.id,
      name: hotel.title,
      location: hotel.location,
      pricePerNight: hotel.price,
      rating: hotel.rating,
      description: hotel.description?.substring(0, 150)
    })) || [];

    return { success: true, hotels, message: `Found ${hotels.length} hotels` };
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

  // FLIGHTS
  if (toolName === "search_flights") {
    const response = await fetch(`${supabaseUrl}/functions/v1/unified-search-flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        origin: args.origin,
        destination: args.destination,
        departureDate: args.departureDate,
        returnDate: args.returnDate,
        adults: args.adults || 1
      })
    });

    if (!response.ok) return { error: 'Failed to search flights.' };
    const data = await response.json();
    
    const flights = data.results?.slice(0, 5).map((flight: any) => ({
      id: flight.id,
      airline: flight.airline,
      price: flight.price,
      departure: flight.departure,
      arrival: flight.arrival,
      duration: flight.duration
    })) || [];

    return { success: true, flights, message: `Found ${flights.length} flights` };
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
        location: args.location,
        startDate: args.startDate,
        endDate: args.endDate
      })
    });

    if (!response.ok) return { error: 'Failed to search events.' };
    const data = await response.json();
    
    const events = data.results?.slice(0, 5).map((event: any) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.venue,
      price: event.price,
      category: event.category
    })) || [];

    return { success: true, events, message: `Found ${events.length} events` };
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

  return { error: 'Unknown tool' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI responses

    try {
      const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `You are a luxury travel booking assistant for Goldsainte AI with full booking capabilities.

CAPABILITIES:
✈️ FLIGHTS - Search and book flights worldwide
🏨 HOTELS - Search and book luxury accommodations  
🍽️ RESTAURANTS - Find and reserve dining experiences
🎭 EVENTS - Discover and book tickets for events and activities
🚗 CARS - Search and book rental vehicles

BOOKING WORKFLOW (applies to all services):
1. Gather requirements: destination/location, dates, number of people, preferences
2. Use appropriate search tool (search_hotels, search_flights, etc.)
3. Present top 3-5 options with key details and prices
4. When user selects an option, collect required information (name, email, phone)
5. Confirm ALL details before booking
6. Use appropriate booking tool (book_hotel, book_flight, etc.)
7. Provide booking reference and confirmation

IMPORTANT RULES:
- Always search before booking
- Never book without explicit user confirmation
- Always collect complete guest/passenger/driver information
- Present prices clearly with currency
- Be conversational and luxury-focused
- Handle one booking type at a time for clarity

Example: "I can search for hotels in Paris from March 15-20. How many guests will be staying?"
Example: "I found 5 flights from JFK to LAX. The best option is..."
Example: "Would you like me to book the Ritz Paris for $450/night (March 15-20)? I'll need your full name, email, and phone number."`;

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
