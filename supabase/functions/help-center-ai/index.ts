import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { checkAndTrackAIUsage } from '../_shared/aiUsageTracker.ts';

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strip technical routes from AI responses
const stripRoutes = (text: string): string => {
  return text
    // Remove parenthetical route references e.g. "(/travel-profile)"
    .replace(/\s*\(\/[^\)]+\)/g, '')
    // Remove "at /path", "visit /path", etc.
    .replace(/\s+(?:at|visit|go to|or visit|or go to)\s+\/[^\s\.,)]+/gi, '')
    // Remove any remaining naked "/path" strings
    .replace(/\/[a-z0-9\-\/\?=]+/gi, '')
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const systemPrompt = `You are Goldsainte's AI Travel Assistant. You help users with travel-related questions, booking inquiries, destination recommendations, and trip planning.

**CURRENT DATE: ${getTodayDate()}** (Use this for all date calculations)

## DATE REQUIREMENTS - CRITICAL:
**YOU MUST ALWAYS ASK FOR DATES BEFORE SEARCHING**
- NEVER assume or default dates if the user hasn't provided them
- If user says "find hotels in Paris" → Ask: "When are you planning to visit? I'll need check-in and check-out dates to search for availability."
- If user says "search flights to Tokyo" → Ask: "What dates are you looking to travel? I need departure and return dates."
- If user says "find events in New York" → Ask: "When would you like to attend events? Please provide the date or date range."

## DATE INFERENCE (only use after user provides dates):
When users mention dates in natural language, convert them to YYYY-MM-DD format:
- "next weekend" → next Saturday and Sunday
- "this weekend" → upcoming Saturday and Sunday
- "in 2 weeks" → 14 days from today
- "next month" → same day next month
- "tomorrow" → current date + 1 day
- "next Friday" → the upcoming Friday
Always use the CURRENT DATE above as the reference point for calculations.

**Date Ambiguity**: If a date reference could have multiple interpretations, ask ONE clarifying question. Example: "Did you mean this coming Saturday (Jan 15) or the following weekend (Jan 22)?"

## YOUR EXPERTISE:
You can assist with:
- **Destination Recommendations**: Suggest places based on interests, budget, season, and travel style
- **Travel Planning**: Help with itinerary planning, best times to visit, travel tips
- **Hotel Search**: Find accommodations based on location, dates, budget, and guest count
- **Flight Search**: Find flights between cities with flexible date and cabin class options
- **Event Search**: Discover concerts, sports, theater, and other events in any city
- **Budget Planning**: Estimate costs, find deals, understand what's included
- **Booking Help**: Guide through the booking process, explain policies
- **Travel Logistics**: Visa requirements, weather, transportation, packing tips
- **Local Insights**: Culture, cuisine, must-see attractions, hidden gems

## COMPANY INFORMATION:
- Goldsainte is an AI-powered luxury travel platform
- We offer hotels, flights, restaurants, and complete travel packages
- Expert travel agents available for complex bookings
- Features include AI voice search, personalized recommendations, and group bookings

## BOOKING POLICIES:
- Cancellations: Varies by booking, typically 24-48h notice required
- Refunds: Processed in 5-7 business days
- Payment: Secure payment processing via Stripe
- Support: Available via email at support@goldsainte.com

## RESPONSE GUIDELINES:
- Be friendly, enthusiastic, and helpful about travel
- Ask clarifying questions to better understand travel preferences
- Provide specific, actionable recommendations
- Keep answers concise (under 200 words) unless complex explanations needed
- Focus on the travel experience, not technical platform details
- If you can't help with something specific, suggest contacting support@goldsainte.com

## HANDLING SEARCH RESULTS:
**CRITICAL RULES - MUST FOLLOW**:
1. NEVER say "I found X" or "I have options" BEFORE calling the search tool
2. NEVER make assumptions about availability - always search first, speak second
3. When users ask to search, IMMEDIATELY call the appropriate tool with their criteria
4. ONLY comment on results AFTER receiving the actual tool response

**After receiving hotel search results**:
- **If status: "OK" & data.length > 0**: 
  "Here are [count] hotels in [location] under [currency][amount]/night on [dates]. [Mention top option]. Want to see more or adjust filters?"
- **If status: "NO_RESULTS"**: 
  "I couldn't find hotels in [location] under [currency][amount]/night for [dates]. Try +[amount] budget, different dates, or wider area?"

**After receiving flight search results**:
- **If results found**: 
  "Here are [count] flights from [origin] to [destination] on [dates]. [Mention cheapest option]. Want different dates or cabin class?"
- **If no results**: 
  "No flights found from [origin] to [destination] on [dates]. Try nearby airports, different dates, or check dates are valid?"

**After receiving event search results**:
- **If results found**: 
  "Here are [count] events in [location] [mention dates if specified]. [Mention top event]. Want more options or different dates?"
- **If no results**: 
  "No events found in [location] for those dates. Try broader dates, nearby cities, or different keywords?"

**NEVER say "I found options" then later say "I can't find any" - this contradicts yourself and confuses users.**

## SAMPLE QUESTIONS YOU EXCEL AT:
- "What are the best destinations for a beach vacation in December?"
- "How much should I budget for a week in Tokyo?"
- "What's the best time to visit Paris?"
- "Can you help me plan a 5-day Italy itinerary?"
- "What should I pack for a safari in Kenya?"
- "Are there any cultural customs I should know before visiting Thailand?"

Remember: You're a travel expert helping people plan their dream trips! Focus on inspiring travel experiences and practical advice.`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_hotels",
      description: "Search for hotels in a specific location with check-in/check-out dates, guest count, and budget constraints. Returns budget-filtered results only.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City or destination name (e.g., 'London', 'Paris', 'New York')"
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
          max_total_price: {
            type: "number",
            description: "Maximum price per night in the specified currency"
          },
          currency: {
            type: "string",
            description: "Currency code (e.g., 'USD', 'EUR', 'GBP')",
            enum: ["USD", "EUR", "GBP"]
          }
        },
        required: ["location", "checkIn", "checkOut", "guests", "max_total_price", "currency"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for flights between two cities with departure/return dates and cabin class. Returns available flight options.",
      parameters: {
        type: "object",
        properties: {
          origin: {
            type: "string",
            description: "Origin airport code (e.g., 'JFK', 'LAX', 'LHR')"
          },
          destination: {
            type: "string",
            description: "Destination airport code (e.g., 'CDG', 'NRT', 'SYD')"
          },
          departureDate: {
            type: "string",
            description: "Departure date in YYYY-MM-DD format"
          },
          returnDate: {
            type: "string",
            description: "Return date in YYYY-MM-DD format (optional for one-way)"
          },
          adults: {
            type: "number",
            description: "Number of adult passengers"
          },
          cabinClass: {
            type: "string",
            description: "Cabin class preference",
            enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]
          }
        },
        required: ["origin", "destination", "departureDate", "adults"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search for events (concerts, sports, theater, etc.) in a specific city or location with optional date filtering.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name (e.g., 'New York', 'London', 'Tokyo')"
          },
          keyword: {
            type: "string",
            description: "Event keyword or type (e.g., 'concert', 'sports', 'theater', artist name)"
          },
          startDateTime: {
            type: "string",
            description: "Start date in YYYY-MM-DD format or YYYY-MM-DDTHH:MM:SSZ"
          },
          endDateTime: {
            type: "string",
            description: "End date in YYYY-MM-DD format or YYYY-MM-DDTHH:MM:SSZ"
          }
        },
        required: ["city"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check AI usage limits
    const usageCheck = await checkAndTrackAIUsage(
      userId,
      'help-center-ai',
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY
    );

    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "AI usage limit exceeded",
          tier: usageCheck.tier,
          used: usageCheck.used,
          limit: usageCheck.limit,
          resetDate: usageCheck.resetDate,
          needsUpgrade: true
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let conversationMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    let lastSearchMeta: any = null;

    // Tool calling loop - allow up to 5 iterations
    for (let iteration = 0; iteration < 5; iteration++) {
      console.log(`AI call iteration ${iteration + 1}`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversationMessages,
          tools: tools,
          tool_choice: "auto"
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
            {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error("No response from AI");
      }

      // If no tool calls, return the final response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        const finalMessageRaw = assistantMessage.content || "";
        const finalMessage = stripRoutes(finalMessageRaw);
        
        return new Response(
          JSON.stringify({ response: finalMessage, meta: lastSearchMeta }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Add assistant message with tool calls to conversation
      conversationMessages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        console.log(`Executing tool: ${toolCall.function.name}`);
        
        let toolResult;
        
        if (toolCall.function.name === "search_hotels") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log("Hotel search args:", args);
          
          try {
            const { data: hotelData, error: hotelError } = await supabase.functions.invoke('unified-search-hotels', {
              body: {
                location: args.location,
                checkIn: args.checkIn,
                checkOut: args.checkOut,
                guests: args.guests,
                max_total_price: args.max_total_price,
                currency: args.currency,
                sortBy: 'best_value',
                filter: 'all'
              }
            });

            if (hotelError) {
              console.error("Hotel search error:", hotelError);
              toolResult = {
                status: "ERROR",
                message: "Failed to search hotels",
                error: hotelError.message
              };
            } else {
              const results = hotelData?.results || [];
              console.log(`Found ${results.length} hotels`);
              
              toolResult = {
                status: results.length > 0 ? "OK" : "NO_RESULTS",
                data: results.slice(0, 20), // Limit to top 20 for context
                count: results.length,
                search_params: args,
                search_type: 'hotels'
              };
            }
          } catch (error) {
            console.error("Tool execution error:", error);
            toolResult = {
              status: "ERROR",
              message: "Failed to execute hotel search",
              error: error instanceof Error ? error.message : String(error)
            };
          }

          // Store meta for client navigation/opening results
          if (toolResult && (toolResult.status === "OK" || toolResult.status === "NO_RESULTS")) {
            lastSearchMeta = {
              status: toolResult.status,
              count: toolResult.count ?? 0,
              search_params: args,
              search_type: 'hotels'
            };
          }
        } else if (toolCall.function.name === "search_flights") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log("Flight search args:", args);
          
          try {
            const { data: flightData, error: flightError } = await supabase.functions.invoke('unified-search-flights', {
              body: {
                origin: args.origin,
                destination: args.destination,
                departureDate: args.departureDate,
                returnDate: args.returnDate,
                adults: args.adults,
                cabinClass: args.cabinClass || 'ECONOMY'
              }
            });

            if (flightError) {
              console.error("Flight search error:", flightError);
              toolResult = {
                status: "ERROR",
                message: "Failed to search flights",
                error: flightError.message
              };
            } else {
              const results = flightData?.results || [];
              console.log(`Found ${results.length} flights`);
              
              toolResult = {
                status: results.length > 0 ? "OK" : "NO_RESULTS",
                data: results.slice(0, 20), // Limit to top 20 for context
                count: results.length,
                search_params: args,
                search_type: 'flights'
              };
            }
          } catch (error) {
            console.error("Tool execution error:", error);
            toolResult = {
              status: "ERROR",
              message: "Failed to execute flight search",
              error: error instanceof Error ? error.message : String(error)
            };
          }

          // Store meta for client navigation/opening results
          if (toolResult && (toolResult.status === "OK" || toolResult.status === "NO_RESULTS")) {
            lastSearchMeta = {
              status: toolResult.status,
              count: toolResult.count ?? 0,
              search_params: args,
              search_type: 'flights'
            };
          }
        } else if (toolCall.function.name === "search_events") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log("Event search args:", args);
          
          try {
            const { data: eventData, error: eventError } = await supabase.functions.invoke('search-events', {
              body: {
                city: args.city,
                keyword: args.keyword,
                startDateTime: args.startDateTime,
                endDateTime: args.endDateTime
              }
            });

            if (eventError) {
              console.error("Event search error:", eventError);
              toolResult = {
                status: "ERROR",
                message: "Failed to search events",
                error: eventError.message
              };
            } else {
              const results = eventData?.results || [];
              console.log(`Found ${results.length} events`);
              
              toolResult = {
                status: results.length > 0 ? "OK" : "NO_RESULTS",
                data: results.slice(0, 20), // Limit to top 20 for context
                count: results.length,
                search_params: args,
                search_type: 'events'
              };
            }
          } catch (error) {
            console.error("Tool execution error:", error);
            toolResult = {
              status: "ERROR",
              message: "Failed to execute event search",
              error: error instanceof Error ? error.message : String(error)
            };
          }

          // Store meta for client navigation/opening results
          if (toolResult && (toolResult.status === "OK" || toolResult.status === "NO_RESULTS")) {
            lastSearchMeta = {
              status: toolResult.status,
              count: toolResult.count ?? 0,
              search_params: args,
              search_type: 'events'
            };
          }
        } else {
          toolResult = {
            status: "ERROR",
            message: `Unknown tool: ${toolCall.function.name}`
          };
        }

        // Add tool result to conversation
        conversationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }
    }

    // If we exhausted iterations, return error
    throw new Error("Maximum tool call iterations reached");
    
  } catch (error) {
    console.error("Help Center AI error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
