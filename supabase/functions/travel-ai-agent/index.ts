import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    console.log('AI Agent request:', { message, historyLength: conversationHistory.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const BOOKING_API_KEY = Deno.env.get('BOOKING_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!BOOKING_API_KEY) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Define tools for the AI agent
    const tools = [
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for hotels in a specific location with check-in/check-out dates and number of guests. Use this when users ask about hotels, accommodations, or places to stay.",
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
      }
    ];

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a sophisticated travel assistant. You help users plan trips, find hotels, discover destinations, and answer travel-related questions.

When users ask about travel, you should:
1. Use the search_hotels tool to find accommodations when they mention hotels, stays, or accommodations
2. Use the search_destinations tool to discover places when they ask about destinations, cities, or where to go
3. Provide helpful, conversational responses with specific recommendations
4. Ask clarifying questions if needed (dates, number of guests, preferences)
5. Be enthusiastic and knowledgeable about travel

Always be helpful, friendly, and provide detailed information when available.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling Lovable AI with tools...');

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        let toolResult;
        
        if (functionName === 'search_hotels') {
          toolResult = await searchHotels(functionArgs, BOOKING_API_KEY);
        } else if (functionName === 'search_destinations') {
          toolResult = await searchDestinations(functionArgs, BOOKING_API_KEY);
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

      const finalResponse = await fetch(LOVABLE_AI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
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

    // No tool calls, return direct response
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
  try {
    const { location, checkIn, checkOut, guests = 2 } = args;

    // Search for location first
    const locationResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(location)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!locationResponse.ok) {
      return { error: 'Failed to find location', results: [] };
    }

    const locationData = await locationResponse.json();
    
    if (!locationData.data || locationData.data.length === 0) {
      return { error: 'Location not found', results: [] };
    }

    const destId = locationData.data[0].dest_id;

    // Get default dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCheckIn = checkIn || today.toISOString().split('T')[0];
    const defaultCheckOut = checkOut || tomorrow.toISOString().split('T')[0];

    // Search for hotels
    const hotelsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=CITY&arrival_date=${defaultCheckIn}&departure_date=${defaultCheckOut}&adults=${guests}&room_qty=1&page_number=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=USD`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!hotelsResponse.ok) {
      return { error: 'Failed to search hotels', results: [] };
    }

    const hotelsData = await hotelsResponse.json();
    
    return {
      type: 'hotels',
      location: locationData.data[0],
      results: (hotelsData.data?.hotels || []).slice(0, 6),
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      guests
    };
  } catch (error) {
    console.error('Error searching hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
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