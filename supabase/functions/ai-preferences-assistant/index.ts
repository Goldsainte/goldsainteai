import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a friendly travel preferences assistant for Goldsainte. Your goal is to help users set their travel booking preferences through natural conversation.

Guide users through setting preferences for:
- **Hotel Preferences**: destination, price range, location (distance from center/airport), room type, bed type, star rating, number of guests, amenities (WiFi, breakfast, pool, gym, parking, pet-friendly, airport shuttle, accessible rooms), cancellation flexibility
- **Flight Preferences**: departure/destination airports, flight type (round-trip/one-way/multi-city), cabin class (economy/premium economy/business/first), budget per passenger, preferred airlines, seat preference (window/aisle/middle), direct flights only, baggage (carry-on/checked), meal preferences
- **Restaurant Preferences**: cuisine types, dietary restrictions (vegetarian, vegan, gluten-free, halal, kosher, nut allergies), price range ($/$$/$$$), seating preference (indoor/outdoor), dining experience type (fine dining/casual/local), private dining needs, group-friendly
- **Car Rental Preferences**: car type (economy/compact/SUV/luxury/electric/van), transmission (automatic/manual), budget range, pickup/dropoff locations, unlimited mileage, insurance, fuel policy, minimum driver age, features (GPS, Bluetooth, child seats)
- **Event Preferences**: event types (concerts, sports, theater, festivals, tours), location, budget range, ticket type (general/VIP/premium), accessibility needs, seating preference, group tickets
- **Travel Documents**: passport number, expiry date, issuing country, visa requirements for specific countries, visa assistance needed

CONVERSATION STYLE:
- Be warm, conversational, and encouraging
- Ask ONE category at a time (e.g., "Let's start with hotels, or would you prefer flights?")
- Ask follow-up questions to gather complete details
- Confirm understanding after each response (e.g., "Got it! So you prefer suites with king beds")
- Show enthusiasm when saving preferences ("✓ Perfect! I've saved your hotel preferences")
- Suggest next steps naturally ("Would you like to set up flight preferences next?")

WHEN TO SAVE:
Use the save_preferences tool when:
- User completes a full category of preferences
- User explicitly says "save" or "that's all"
- You have enough meaningful data to be helpful

IMPORTANT RULES:
- Don't ask for ALL fields - focus on the most important ones first
- Be flexible - if user volunteers info about multiple categories, adapt
- Skip optional fields unless user brings them up
- Always confirm what was saved in plain language`;

    const toolDefinition = {
      type: "function",
      function: {
        name: "save_preferences",
        description: "Save user's travel booking preferences to the database. Call this when you have gathered preferences for at least one complete category (hotel, flight, restaurant, car, or events).",
        parameters: {
          type: "object",
          properties: {
            // Hotel Preferences
            destination: { type: "string", description: "Preferred destination or city" },
            neighborhood: { type: "string", description: "Preferred neighborhood" },
            price_range_min: { type: "number", description: "Minimum price per night" },
            price_range_max: { type: "number", description: "Maximum price per night" },
            distance_from_center: { type: "number", description: "Max distance from city center in miles" },
            distance_from_airport: { type: "number", description: "Max distance from airport in miles" },
            room_type: { type: "string", enum: ["single", "double", "suite", "family"], description: "Preferred room type" },
            bed_type: { type: "string", enum: ["king", "queen", "twin", "bunk"], description: "Preferred bed type" },
            preferred_hotel_rating: { type: "number", minimum: 1, maximum: 5, description: "Minimum star rating" },
            number_of_adults: { type: "number", description: "Number of adults" },
            number_of_children: { type: "number", description: "Number of children" },
            property_types: { type: "array", items: { type: "string" }, description: "Preferred property types" },
            currency: { type: "string", enum: ["USD", "EUR", "GBP", "JPY"], description: "Preferred currency" },
            free_wifi: { type: "boolean", description: "Requires free WiFi" },
            breakfast_included: { type: "boolean", description: "Breakfast included" },
            pool: { type: "boolean", description: "Swimming pool required" },
            gym: { type: "boolean", description: "Gym/fitness center required" },
            parking: { type: "boolean", description: "Parking required" },
            pet_friendly: { type: "boolean", description: "Pet-friendly property" },
            airport_shuttle: { type: "boolean", description: "Airport shuttle required" },
            accessible_rooms: { type: "boolean", description: "Accessible/wheelchair-friendly rooms" },
            free_cancellation: { type: "boolean", description: "Free cancellation required" },
            pay_at_property: { type: "boolean", description: "Pay at property option" },
            include_taxes_fees: { type: "boolean", description: "Include taxes and fees in price" },
            min_review_score: { type: "number", description: "Minimum review score (1-10)" },

            // Flight Preferences
            departure_airport: { type: "string", description: "Preferred departure airport code" },
            destination_airport: { type: "string", description: "Preferred destination airport code" },
            flight_type: { type: "string", enum: ["round-trip", "one-way", "multi-city"], description: "Flight type" },
            cabin_class: { type: "string", enum: ["economy", "premium_economy", "business", "first"], description: "Cabin class" },
            max_price_per_passenger: { type: "number", description: "Maximum price per passenger" },
            preferred_airlines: { type: "array", items: { type: "string" }, description: "Preferred airlines" },
            excluded_airlines: { type: "array", items: { type: "string" }, description: "Airlines to exclude" },
            seat_preference: { type: "string", enum: ["window", "aisle", "middle"], description: "Seat preference" },
            direct_flights_only: { type: "boolean", description: "Direct flights only" },
            max_stops: { type: "number", description: "Maximum number of stops" },
            max_layover_hours: { type: "number", description: "Maximum layover hours" },
            baggage_carry_on: { type: "boolean", description: "Carry-on baggage included" },
            baggage_checked: { type: "number", description: "Number of checked bags" },
            meal_preference: { type: "string", enum: ["regular", "vegetarian", "vegan", "kosher", "halal"], description: "Meal preference" },
            preferred_departure_time: { type: "string", description: "Preferred departure time range" },
            preferred_arrival_time: { type: "string", description: "Preferred arrival time range" },
            include_nearby_airports: { type: "boolean", description: "Include nearby airports" },
            refundable_ticket: { type: "boolean", description: "Refundable ticket required" },
            flexible_fare: { type: "boolean", description: "Flexible fare for changes" },

            // Restaurant Preferences
            cuisine_types: { type: "array", items: { type: "string" }, description: "Preferred cuisine types" },
            dietary_restrictions: { type: "array", items: { type: "string" }, description: "Dietary restrictions" },
            restaurant_price_range: { type: "string", enum: ["$", "$$", "$$$", "$$$$"], description: "Price range" },
            seating_preference: { type: "string", enum: ["indoor", "outdoor", "no_preference"], description: "Seating preference" },
            restaurant_experience_type: { type: "array", items: { type: "string" }, description: "Experience types (fine dining, casual, local)" },
            preferred_dining_time: { type: "string", description: "Preferred dining time" },
            private_dining: { type: "boolean", description: "Private dining required" },
            group_friendly: { type: "boolean", description: "Group-friendly restaurants" },

            // Car Rental Preferences
            car_type: { type: "string", enum: ["economy", "compact", "suv", "luxury", "electric", "van"], description: "Car type" },
            transmission_type: { type: "string", enum: ["automatic", "manual"], description: "Transmission type" },
            car_budget_min: { type: "number", description: "Minimum car rental budget" },
            car_budget_max: { type: "number", description: "Maximum car rental budget" },
            pickup_location: { type: "string", description: "Pickup location" },
            dropoff_location: { type: "string", description: "Dropoff location" },
            unlimited_mileage: { type: "boolean", description: "Unlimited mileage" },
            insurance_included: { type: "boolean", description: "Insurance included" },
            fuel_policy: { type: "string", enum: ["full_to_full", "same_to_same", "pre_purchase"], description: "Fuel policy" },
            car_features: { type: "array", items: { type: "string" }, description: "Required features (GPS, Bluetooth, child seats)" },
            minimum_driver_age: { type: "number", description: "Minimum driver age" },
            young_driver_accepted: { type: "boolean", description: "Young driver accepted" },

            // Event Preferences
            event_types: { type: "array", items: { type: "string" }, description: "Preferred event types" },
            event_location: { type: "string", description: "Preferred event location" },
            event_budget_min: { type: "number", description: "Minimum event budget" },
            event_budget_max: { type: "number", description: "Maximum event budget" },
            ticket_type: { type: "string", enum: ["general", "vip", "premium"], description: "Ticket type" },
            event_accessibility: { type: "boolean", description: "Accessibility requirements" },
            seating_type: { type: "string", description: "Preferred seating type" },
            digital_tickets: { type: "boolean", description: "Digital tickets preferred" },

            // Travel Documents
            passport_number: { type: "string", description: "Passport number" },
            passport_expiry: { type: "string", description: "Passport expiry date" },
            passport_issuing_country: { type: "string", description: "Passport issuing country" },
            visa_required_countries: { type: "array", items: { type: "string" }, description: "Countries requiring visa" },
            visa_assistance_needed: { type: "boolean", description: "Visa assistance needed" },

            // Special Requests
            special_requests: { type: "string", description: "Any special requests or notes" },
            use_preferences_in_search: { type: "boolean", description: "Use preferences in search by default" },
          }
        }
      }
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [toolDefinition],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream response and detect tool calls
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  
                  // Check for tool calls
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    const toolCall = parsed.choices[0].delta.tool_calls[0];
                    if (toolCall.function?.name === 'save_preferences') {
                      const args = JSON.parse(toolCall.function.arguments);
                      
                      // Save to database
                      const { error: upsertError } = await supabase
                        .from('user_booking_preferences')
                        .upsert({
                          user_id: user.id,
                          ...args,
                          updated_at: new Date().toISOString(),
                        }, {
                          onConflict: 'user_id'
                        });

                      if (upsertError) {
                        console.error('Error saving preferences:', upsertError);
                      } else {
                        console.log('Preferences saved successfully for user:', user.id);
                      }
                    }
                  }

                  // Forward the chunk to client
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          // Process remaining buffer
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(buffer));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-preferences-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
