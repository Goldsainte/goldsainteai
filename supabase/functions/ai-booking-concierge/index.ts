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
          name: "book_selection",
          description: "Book a selected flight or hotel. Call this when user confirms they want to book a specific option. Returns payment link.",
          parameters: {
            type: "object",
            properties: {
              bookingType: { type: "string", description: "Type of booking: 'flight' or 'hotel'" },
              selectedOption: { type: "object", description: "The complete booking details from the search results" },
              travelerInfo: { 
                type: "object", 
                description: "Traveler contact information",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" }
                }
              }
            },
            required: ["bookingType", "selectedOption", "travelerInfo"]
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
1. I CAN SEARCH, RECOMMEND, AND BOOK directly - I have full booking capabilities with secure payment processing
2. ALWAYS collect complete details before searching: dates, location, number of guests, preferences
3. When showing search results, describe TOP 2-3 options in detail: name, location, price, rating, amenities
4. After showing options, ask: "Which option would you like? I can book it for you right now, or if you prefer, I can:
   - Pass your information to a Goldsainte Certified Travel Agent
   - Direct you to our AI Agent or traditional search function"
5. When user selects an option to book, collect: full name, email, phone number
6. After collecting info, use the book_selection tool to initiate booking and payment
7. Provide the payment link and explain: "I've prepared your booking. Please complete payment through this secure link, and your reservation will be confirmed immediately."
8. Keep responses concise and natural - avoid long lists
9. Wait for user confirmation before moving to the next step

CONVERSATION FLOW:
1. Greet warmly and ask what they're planning
2. Gather essential details (destination, dates, guests, budget, preferences)
3. Use search tools to find options
4. Present TOP 2-3 options with key details (name, price, highlights)
5. Ask which option they'd like to book
6. When they select, collect: full name, email, phone number
7. Use book_selection tool to create the booking
8. Provide payment link: "Here's your secure payment link. Once completed, you'll receive confirmation immediately."
9. Alternatively, if they prefer, offer to pass to an agent or direct to AI Agent/search

TONE:
- Warm, professional, conversational
- Enthusiastic about luxury experiences
- Patient and detail-oriented
- Natural speaking style for voice interaction

IMPORTANT:
- You can SEARCH, RECOMMEND, AND BOOK directly with secure payment processing
- Collect ALL information naturally in conversation
- Highlight unique luxury features
- Booking is handled through secure Stripe payment links
- After booking, confirmation is sent automatically
- Never say "you're welcome" unless user actually thanked you
- Always complete your sentences fully

Remember: You're a full-service AI concierge that can complete bookings end-to-end, or connect customers with agents if they prefer.`;

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
            'check_visa_requirements': 'check-visa-requirements',
            'book_selection': 'create-booking-payment'
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
