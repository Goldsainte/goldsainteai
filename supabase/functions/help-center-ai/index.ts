import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { checkAndTrackAIUsage } from '../_shared/aiUsageTracker.ts';

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strip technical routes from AI responses
const stripRoutes = (text: string): string => {
  return text
    // Remove parenthetical route references e.g. "(/travel-profile)"
    .replace(/\s*\(\/[^)]+\)/g, '')
    // Remove "at /path", "visit /path", etc.
    .replace(/\s+(?:at|visit|go to|or visit|or go to)\s+\/[^\s.,)]+/gi, '')
    // Remove any remaining naked "/path" strings
    .replace(/\/[a-z0-9/?=-]+/gi, '')
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Detect explicit self-service vs agent intent from user message
const detectBookingIntent = (userMessage: string): 'self_service' | 'agent' | 'unknown' => {
  const text = userMessage.toLowerCase();
  
  // Explicit self-service patterns
  if (/\b(book (it )?myself|i'?ll do it|self[- ]?service|expedia|i want to book|do it myself|book on my own)\b/.test(text)) {
    return 'self_service';
  }
  
  // Explicit agent patterns
  if (/\b(agent|concierge|human help|handle it for me|curate|plan it for me|can someone|certified agent|travel agent)\b/.test(text)) {
    return 'agent';
  }
  
  // Default to unknown (UI will present choice with agent preselected)
  return 'unknown';
};

const systemPrompt = `You are Goldsainte's travel concierge. Your PRIMARY job is:
1. Gather ALL required trip requirements through structured questions
2. Recommend "Match me with a Goldsainte agent" as the preferred option
3. Create an Agent Marketplace request with the collected data

Only if the user clearly says they want to book it themselves, render the Expedia widget (inline) for self-service.

**CURRENT DATE: ${getTodayDate()}** (Use this for all date calculations)

## CRITICAL - FLIGHT BOOKING INTAKE FLOW:

**NEVER INVENT OR ASSUME FLIGHT DETAILS** - You must gather information in this exact order:

When a user says "I need a flight to [destination]":

**Step 1: Origin** (if not provided)
- Ask: "Where will you be flying from? Please provide the city or airport code."
- WAIT for user response
- NEVER assume or default the origin

**Step 2: Destination** (if not provided) 
- Ask: "What is your destination city or airport?"
- WAIT for user response

**Step 3: Travel Dates** (ALWAYS required)
- Ask: "What are your departure and return dates? (Or let me know if this is a one-way trip)"
- WAIT for user response
- NEVER use placeholder dates like "flexible" or "to be determined"

**Step 4: Number of Travelers**
- Ask: "How many people will be traveling?"
- WAIT for user response

**Step 5: Preferences** (optional but helpful)
- Ask: "Do you have a preferred airline, cabin class (economy/business/first), or specific budget in mind?"
- WAIT for user response

**ONLY AFTER** you have:
✓ Origin airport/city
✓ Destination airport/city  
✓ Departure date (specific date, not "flexible")
✓ Return date (or confirmed one-way)
✓ Number of travelers

Then you MUST summarize the complete request:
"I have your flight request from [origin] to [destination], departing [date] and returning [date] for [X] travelers. Would you like a Goldsainte Certified Travel Agent to curate this trip for you, or would you prefer to book it yourself via Expedia?"

**VALIDATION RULES:**
- NEVER call the search_flights tool until you have ALL required fields
- NEVER fabricate airports, dates, or passenger counts
- If user provides vague info ("next month", "sometime in summer"), ask for SPECIFIC dates
- If user says "CLT to London", you have origin and destination - STILL ask for dates and travelers
- Count the questions asked - minimum 3 follow-ups required before booking options

## YOUR ROLE:
You are a travel concierge whose PRIMARY goal is to match users with Goldsainte Certified Travel Agents who curate end-to-end trips. Self-service booking is a secondary option offered ONLY when explicitly requested.

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

## HOTEL & FLIGHT SEARCH BEHAVIOR:
When users want to search for hotels or flights:
1. Extract their travel details (destination, dates, guests/travelers, budget)
2. Call the search_hotels or search_flights tool with these parameters
3. **CRITICAL**: NEVER claim to have found specific hotels or flights (e.g., "I found 15 hotels")
4. **You are NOT searching** - you're extracting intent to open the booking widget
5. After tool call, the system will ask about booking preferences - do not generate your own response

**Ask for missing information**:
- If no destination: "Where would you like to stay?" or "Where are you flying to?"
- If no dates: "When are you planning to visit?" or "What are your travel dates?"
- If dates unclear: "Could you clarify your dates?"

**NEVER say things like**:
❌ "I found 15 hotels for your dates"
❌ "Here are the best hotels in Miami"
❌ "I've searched and found these options"

**The system handles the response** - your job is only to extract the travel parameters.

## HANDLING FLIGHT/EVENT SEARCH RESULTS:
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
      description: "CRITICAL: Only call this tool when you have EXPLICITLY received ALL required information from the user. NEVER assume, default, or fabricate any values. This tool extracts hotel search parameters to open the booking widget - it does NOT return hotel results. You MUST ask follow-up questions if any required field is missing.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City or destination name EXPLICITLY provided by user (e.g., 'London', 'Paris', 'New York'). NEVER assume or default this value."
          },
          checkIn: {
            type: "string",
            description: "SPECIFIC check-in date EXPLICITLY provided by user in YYYY-MM-DD format. NEVER use placeholders like 'flexible' or 'TBD'. If user hasn't provided a specific date, DO NOT call this tool."
          },
          checkOut: {
            type: "string",
            description: "SPECIFIC check-out date EXPLICITLY provided by user in YYYY-MM-DD format. NEVER use placeholders."
          },
          guests: {
            type: "number",
            description: "EXACT number of guests EXPLICITLY stated by user. If not provided, ask the user - do NOT default to 2."
          },
          max_total_price: {
            type: "number",
            description: "OPTIONAL: Maximum price per night in the specified currency. Only use if user explicitly mentions a budget."
          },
          currency: {
            type: "string",
            description: "Currency code (e.g., 'USD', 'EUR', 'GBP'). Defaults to USD if not specified.",
            enum: ["USD", "EUR", "GBP"]
          }
        },
        required: ["location", "checkIn", "checkOut", "guests"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "CRITICAL: Only call this tool when you have EXPLICITLY received ALL required information from the user. NEVER assume, default, or fabricate any values. This tool extracts flight search parameters to open the booking widget - it does NOT return flight results. You MUST ask follow-up questions if any required field is missing.",
      parameters: {
        type: "object",
        properties: {
          origin: {
            type: "string",
            description: "Origin airport code or city name EXPLICITLY provided by user (e.g., 'JFK', 'Charlotte', 'LAX'). NEVER assume or default this value."
          },
          destination: {
            type: "string",
            description: "Destination airport code or city name EXPLICITLY provided by user (e.g., 'LHR', 'London', 'CDG'). NEVER assume or default this value."
          },
          departureDate: {
            type: "string",
            description: "SPECIFIC departure date EXPLICITLY provided by user in YYYY-MM-DD format. NEVER use placeholders like 'flexible' or 'TBD'. If user hasn't provided a specific date, DO NOT call this tool."
          },
          returnDate: {
            type: "string",
            description: "SPECIFIC return date EXPLICITLY provided by user in YYYY-MM-DD format, or null for one-way flights. NEVER use placeholders."
          },
          adults: {
            type: "number",
            description: "EXACT number of adult passengers EXPLICITLY stated by user. NEVER default to 1 or any other number - if not provided, ask the user."
          },
          cabinClass: {
            type: "string",
            description: "Cabin class preference if EXPLICITLY mentioned by user. If not mentioned, omit this field.",
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
    const conversationMessages = [
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
        let finalText = stripRoutes(assistantMessage.content || "I apologize, but I'm having trouble processing your request right now.");
        
        // Check if we've already made a booking decision in this conversation
        const hasExistingBookingDecision = messages.some((msg: any) => 
          msg.role === 'assistant' && 
          msg.content && (
            msg.content.includes('Would you like a Goldsainte Certified Travel Agent') ||
            msg.content.includes('Opening Expedia search') ||
            msg.content.includes('Great! Let me gather a few details')
          )
        );
        
        // Only run intent detection on the FIRST booking request, not follow-ups
        if (lastSearchMeta && (lastSearchMeta.search_type === 'hotels' || lastSearchMeta.search_type === 'flights') && lastSearchMeta.search_params && !hasExistingBookingDecision) {
          const lastUserMessage = messages[messages.length - 1]?.content || '';
          const detectedIntent = detectBookingIntent(lastUserMessage);
          
          console.log('🎯 [BOOKING ROUTING] Intent detected:', detectedIntent, 'for type:', lastSearchMeta.search_type);
          
          // If user explicitly said they want self-service, skip choice and open widget
          if (detectedIntent === 'self_service') {
            lastSearchMeta.ui = { 
              openWidgetInline: true,
              showChoicePrompt: false 
            };
            finalText = `Opening Expedia search for you...`;
            console.log('🎯 [TELEMETRY] booking_intent_detected=self_service, opening_widget_directly');
          } 
          // If user explicitly said they want agent, skip choice and start intake
          else if (detectedIntent === 'agent') {
            lastSearchMeta.ui = { 
              showAgentIntake: true,
              showChoicePrompt: false 
            };
            finalText = `Great! Let me gather a few details so I can match you with the perfect Goldsainte agent.`;
            console.log('🎯 [TELEMETRY] booking_intent_detected=agent, starting_intake_directly');
          }
          // Otherwise show choice with agent preselected (canonical message)
          else {
            lastSearchMeta.ui = { 
              showChoicePrompt: true,
              defaultChoice: 'agent'
            };
            finalText = `I can help you get this booked. Would you like a Goldsainte Certified Travel Agent to curate the trip for you, or would you prefer to book it yourself via Expedia?`;
            console.log('🎯 [TELEMETRY] booking_intent_detected=unknown, showing_choice_with_agent_default');
          }
        } else if (hasExistingBookingDecision) {
          console.log('🎯 [BOOKING ROUTING] Skipping intent detection - booking decision already made in conversation');
        }
        
        console.log("🎯 [HELP CENTER] Returning final response:", {
          messageLength: finalText.length,
          hasLastSearchMeta: !!lastSearchMeta,
          metaDetails: lastSearchMeta
        });
        
        return new Response(
          JSON.stringify({ response: finalText, meta: lastSearchMeta }),
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
          
          // CRITICAL: Validate ALL required fields are present and valid
          const missingFields: string[] = [];
          
          if (!args.location || args.location.toLowerCase().includes('flexible') || args.location.toLowerCase().includes('tbd')) {
            missingFields.push('location');
          }
          if (!args.checkIn || args.checkIn.toLowerCase().includes('flexible') || args.checkIn.toLowerCase().includes('tbd') || !/^\d{4}-\d{2}-\d{2}$/.test(args.checkIn)) {
            missingFields.push('checkIn');
          }
          if (!args.checkOut || args.checkOut.toLowerCase().includes('flexible') || args.checkOut.toLowerCase().includes('tbd') || !/^\d{4}-\d{2}-\d{2}$/.test(args.checkOut)) {
            missingFields.push('checkOut');
          }
          if (!args.guests || args.guests < 1) {
            missingFields.push('guests');
          }
          
          console.log('🎯 [HOTEL VALIDATION]', {
            received: args,
            missingFields,
            timestamp: new Date().toISOString()
          });
          
          // If ANY required fields are missing, return validation error
          if (missingFields.length > 0) {
            console.log('🎯 [TELEMETRY] hotel_intent_detected=true, hotel_intake_completed=false, missing_fields=', missingFields);
            
            toolResult = {
              status: "VALIDATION_ERROR",
              error: "MISSING_REQUIRED_FIELDS",
              message: `Cannot proceed with hotel search. Missing required information: ${missingFields.join(', ')}. Please ask the user for these specific details.`,
              missing_fields: missingFields,
              search_type: 'hotels'
            };
            
            lastSearchMeta = {
              status: "VALIDATION_ERROR",
              missing_fields: missingFields,
              search_type: 'hotels'
            };
          } else {
            // All required fields present
            const searchParams = {
              location: args.location,
              checkIn: args.checkIn,
              checkOut: args.checkOut,
              guests: args.guests,
              ...(args.max_total_price && { max_total_price: args.max_total_price }),
              currency: args.currency || 'USD'
            };
            
            console.log('🎯 [TELEMETRY] hotel_intent_detected=true, hotel_intake_completed=true, missing_fields=[]');
            console.log('🎯 [HOTEL INTENT] Complete hotel request:', {
              ...searchParams,
              timestamp: new Date().toISOString()
            });
            
            // Return structured parameters without calling any API
            toolResult = {
              status: "OK",
              message: `Hotel preferences extracted successfully. Summarize the request: "${searchParams.location}, checking in ${searchParams.checkIn}, checking out ${searchParams.checkOut}, ${searchParams.guests} guest(s)." Then present booking options.`,
              search_params: searchParams,
              search_type: 'hotels',
              ui: { showChoicePrompt: true }
            };
            
            // Store meta for client to show choice prompt
            lastSearchMeta = {
              status: "OK",
              search_params: searchParams,
              search_type: 'hotels',
              ui: { showChoicePrompt: true }
            };
          }
          
          // Add tool result to conversation
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
          
        } else if (toolCall.function.name === "search_flights") {
          const args = JSON.parse(toolCall.function.arguments);
          
          // CRITICAL: Validate ALL required fields are present and valid
          const missingFields: string[] = [];
          const validationErrors: string[] = [];
          
          if (!args.origin || args.origin.toLowerCase().includes('flexible') || args.origin.toLowerCase().includes('tbd')) {
            missingFields.push('origin');
          }
          if (!args.destination || args.destination.toLowerCase().includes('flexible') || args.destination.toLowerCase().includes('tbd')) {
            missingFields.push('destination');
          }
          if (!args.departureDate || args.departureDate.toLowerCase().includes('flexible') || args.departureDate.toLowerCase().includes('tbd') || !/^\d{4}-\d{2}-\d{2}$/.test(args.departureDate)) {
            missingFields.push('departureDate');
          }
          if (!args.adults || args.adults < 1) {
            missingFields.push('adults');
          }
          
          console.log('🎯 [FLIGHT VALIDATION]', {
            received: args,
            missingFields,
            validationErrors,
            timestamp: new Date().toISOString()
          });
          
          // If ANY required fields are missing, return validation error
          if (missingFields.length > 0) {
            console.log('🎯 [TELEMETRY] flight_intent_detected=true, flight_intake_completed=false, missing_fields=', missingFields);
            
            toolResult = {
              status: "VALIDATION_ERROR",
              error: "MISSING_REQUIRED_FIELDS",
              message: `Cannot proceed with flight search. Missing required information: ${missingFields.join(', ')}. Please ask the user for these specific details.`,
              missing_fields: missingFields,
              search_type: 'flights'
            };
            
            lastSearchMeta = {
              status: "VALIDATION_ERROR",
              missing_fields: missingFields,
              search_type: 'flights'
            };
          } else {
            // All required fields present - proceed with intent extraction
            const searchParams = {
              origin: args.origin,
              destination: args.destination,
              departureDate: args.departureDate,
              returnDate: args.returnDate || null,
              adults: args.adults,
              cabinClass: args.cabinClass || 'ECONOMY'
            };
            
            console.log('🎯 [TELEMETRY] flight_intent_detected=true, flight_intake_completed=true, missing_fields=[]');
            console.log('🎯 [FLIGHT INTENT] Complete flight request:', {
              ...searchParams,
              timestamp: new Date().toISOString()
            });
            
            toolResult = {
              status: "OK",
              message: `Flight preferences extracted successfully. Summarize the request: "${searchParams.origin} to ${searchParams.destination}, departing ${searchParams.departureDate}${searchParams.returnDate ? ` returning ${searchParams.returnDate}` : ' (one-way)'}, ${searchParams.adults} traveler(s)." Then present booking options.`,
              search_params: searchParams,
              search_type: 'flights',
              ui: { showChoicePrompt: true }
            };
            
            lastSearchMeta = {
              status: "OK",
              search_params: searchParams,
              search_type: 'flights',
              ui: { showChoicePrompt: true }
            };
          }
          
          // Add tool result to conversation
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
          
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
