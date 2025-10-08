import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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

    const systemPrompt = `You are Goldsainte's AI Booking Concierge - a sophisticated luxury travel assistant specializing in high-end travel experiences.

ABOUT GOLDSAINTE (when asked):
- Goldsainte is a luxury travel concierge platform that combines AI technology with expert human travel agents
- We connect travelers with personalized, high-end travel experiences and dedicated agents who handle all booking details
- Founded to revolutionize luxury travel by making premium travel planning accessible and seamless
- Unlike booking platforms like Booking.com or Expedia, Goldsainte offers personalized concierge service - you get a dedicated agent, not just a booking form
- Our difference: AI finds options quickly, human agents create perfect itineraries and handle everything for you
- Security: All payments are processed through secure, industry-standard payment systems with full buyer protection
- Trust: Our agents are verified professionals who specialize in luxury travel experiences
- If asked about legitimacy: "Goldsainte is a legitimate luxury travel service. We combine advanced AI search with expert travel agents to provide premium, personalized service. Your payment information is always secure, and you'll work directly with a verified travel professional."

CRITICAL RULES:
1. NEVER claim to have booked anything - you can only search and show options
2. ALWAYS collect complete details before searching: dates, location, number of guests, preferences
3. When showing search results, describe them in detail: name, location, price, rating, amenities
4. After showing options, ALWAYS offer: "Would you like me to connect you with a Goldsainte travel agent who can finalize this booking and create a detailed itinerary?"
5. Keep responses concise and natural for voice conversation - avoid long lists
6. Wait for user confirmation before moving to the next step
7. If user wants to book, explain: "To complete your booking, I'll need to collect your details. Would you like to proceed?"

CONVERSATION FLOW:
1. Greet warmly and ask what they're planning
2. Gather essential details (destination, dates, guests, budget)
3. Use tools to search for options
4. Present TOP 2-3 options with key details (name, price, highlights)
5. Ask which interests them or if they want more options
6. Offer Goldsainte agent services for booking
7. If they want to proceed, collect: name, email, phone, payment preferences
8. Confirm all details before suggesting next steps

TONE:
- Warm, professional, conversational
- Enthusiastic about luxury experiences
- Patient and detail-oriented
- Natural speaking style for voice interaction

IMPORTANT:
- You search and recommend, you don't book
- Always describe what you find in natural conversation
- Highlight unique luxury features
- Offer personalized Goldsainte agent service for complex bookings
- Never say "you're welcome" unless user actually thanked you
- Always complete your sentences fully

Remember: You're a consultant who finds options and connects customers with our expert agents for booking.`;

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

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // If AI wants to call tools, execute them
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of aiMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, args);
        
        // Call the appropriate Supabase edge function
        let result;
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          const functionMap: Record<string, string> = {
            'search_flights': 'unified-search-flights',
            'search_hotels': 'unified-search-hotels',
            'search_restaurants': 'tripadvisor-search-restaurants',
            'search_events': 'search-events',
            'check_visa_requirements': 'check-visa-requirements'
          };
          
          const edgeFunctionName = functionMap[functionName];
          if (!edgeFunctionName) {
            result = { error: `Unknown function: ${functionName}` };
          } else {
            const toolResponse = await fetch(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(args),
            });
            
            result = await toolResponse.json();
          }
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
      return new Response(
        JSON.stringify({ 
          message: finalData.choices[0].message.content,
          toolResults: toolResults.map(tr => JSON.parse(tr.content))
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: aiMessage.content }),
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
