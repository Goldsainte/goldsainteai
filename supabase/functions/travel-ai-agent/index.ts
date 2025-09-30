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
          description: "Search for hotels in a specific location with various filters. Use this when users ask about hotels, accommodations, or places to stay. You can filter by price, rating, amenities, and sort by different criteria.",
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
              },
              sortBy: {
                type: "string",
                enum: ["popularity", "price", "distance", "review_score"],
                description: "How to sort results: popularity (most booked), price (lowest first), distance (closest to center), review_score (highest rated)"
              },
              minRating: {
                type: "number",
                description: "Minimum guest review score (0-10, e.g., 8 for excellent hotels)"
              },
              maxPrice: {
                type: "number",
                description: "Maximum price per night in USD"
              },
              amenities: {
                type: "array",
                items: { type: "string" },
                description: "Required amenities like 'wifi', 'pool', 'parking', 'gym', 'restaurant', 'spa'"
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

IMPORTANT: Be action-oriented and helpful. When users ask about hotels or destinations, IMMEDIATELY use the search tools with smart defaults.

Smart Defaults:
- If no dates mentioned: use today and tomorrow
- If no rating preference: use sortBy "review_score" or "popularity"
- If they say "best" or "top": use sortBy "review_score" with minRating 8
- If they say "popular": use sortBy "popularity"
- If they say "cheap" or "budget": use sortBy "price"
- If no guest count: assume 2 guests

CRITICAL: When you use search tools and get results, DO NOT list out all the hotel details in text. The interface will show beautiful visual cards automatically. Instead, give a brief, friendly response like:

"Perfect! I found some great hotels in Paris for you. Check out the options below!"

OR 

"Here are the top-rated hotels in Dubai - take a look at these beautiful properties!"

Then ask if they'd like to refine by budget, rating, amenities, dates, or guest count.

Always show results first with minimal text, ask questions later. Be conversational but let the visual interface do the heavy lifting.`
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
      console.log('Tool results to send to AI:', JSON.stringify(toolResults.map(tr => ({
        function: tr.function_name,
        resultType: tr.result?.type,
        resultCount: tr.result?.results?.length || 0,
        hasError: !!tr.result?.error
      }))));

      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map(tr => {
          const result = tr.result || { error: 'No result', results: [] };
          const summary = result.results?.length > 0 
            ? `Found ${result.results.length} ${result.type || 'items'} ${(result as any).location?.name ? `in ${(result as any).location.name}` : ''}`
            : result.error || 'No results found';
          
          return {
            role: "tool" as const,
            tool_call_id: tr.tool_call_id,
            content: JSON.stringify({
              ...result,
              summary
            })
          };
        })
      ];

      console.log('Sending final messages to AI...');
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

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error('Final AI response error:', finalResponse.status, errorText);
        throw new Error(`Final AI response error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices[0].message.content;

      console.log('Final AI message:', finalMessage);
      console.log('Returning tool results count:', toolResults.length);

      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: toolResults.map(tr => tr.result).filter(Boolean),
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
    const { location, checkIn, checkOut, guests = 2, sortBy, minRating, maxPrice, amenities } = args;
    console.log('searchHotels called with:', { location, checkIn, checkOut, guests, sortBy, minRating, maxPrice, amenities });

    // Search for location first with timeout
    console.log('Searching for location:', location);
    
    const locationController = new AbortController();
    const locationTimeout = setTimeout(() => {
      console.log('Location search timeout triggered');
      locationController.abort();
    }, 8000); // 8s timeout
    
    console.log('About to call location API...');
    const locationResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(location)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        },
        signal: locationController.signal
      }
    ).finally(() => {
      console.log('Location API call completed');
      clearTimeout(locationTimeout);
    });

    console.log('Location API response status:', locationResponse.status);
    
    if (!locationResponse.ok) {
      const errorText = await locationResponse.text();
      console.error('Location API error:', errorText);
      return { error: `Failed to find location: ${locationResponse.status}`, results: [] };
    }

    const locationData = await locationResponse.json();
    console.log('Location API response:', JSON.stringify(locationData).slice(0, 500));
    
    if (!locationData.data || locationData.data.length === 0) {
      console.log('No location data found');
      return { error: 'Location not found', results: [] };
    }

    const destId = locationData.data[0].dest_id;
    console.log('Found destination ID:', destId);

    // Get default dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCheckIn = checkIn || today.toISOString().split('T')[0];
    const defaultCheckOut = checkOut || tomorrow.toISOString().split('T')[0];

    // Build URL with filters
    const params = new URLSearchParams({
      dest_id: destId.toString(),
      search_type: 'CITY',
      arrival_date: defaultCheckIn,
      departure_date: defaultCheckOut,
      adults: guests.toString(),
      room_qty: '1',
      page_number: '1',
      units: 'metric',
      temperature_unit: 'c',
      languagecode: 'en-us',
      currency_code: 'USD'
    });

    // Add sorting
    if (sortBy) {
      const sortMap: { [key: string]: string } = {
        'popularity': 'popularity',
        'price': 'price',
        'distance': 'distance',
        'review_score': 'review_score'
      };
      if (sortMap[sortBy]) {
        params.append('order_by', sortMap[sortBy]);
      }
    }

    // Add price filter
    if (maxPrice) {
      params.append('price_max', maxPrice.toString());
    }

    console.log('Searching hotels with filters:', { destId, defaultCheckIn, defaultCheckOut, guests, sortBy, minRating, maxPrice });

    const hotelsUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${params.toString()}`;
    console.log('Hotels API URL:', hotelsUrl);
    
    const hotelsController = new AbortController();
    const hotelsTimeout = setTimeout(() => {
      console.log('Hotels search timeout triggered');
      hotelsController.abort();
    }, 12000); // 12s timeout
    
    console.log('About to call hotels API...');
    const hotelsResponse = await fetch(hotelsUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      },
      signal: hotelsController.signal
    }).finally(() => {
      console.log('Hotels API call completed');
      clearTimeout(hotelsTimeout);
    });

    console.log('Hotels API response status:', hotelsResponse.status);

    if (!hotelsResponse.ok) {
      const errorText = await hotelsResponse.text();
      console.error('Hotels API error:', errorText);
      return { error: `Failed to search hotels: ${hotelsResponse.status}`, results: [] };
    }

    const hotelsData = await hotelsResponse.json();
    console.log('Hotels API response keys:', Object.keys(hotelsData));
    
    let hotels = hotelsData.data?.hotels || [];
    console.log('Number of hotels found:', hotels.length);
    
    // Apply client-side filters for features not in API
    if (minRating) {
      hotels = hotels.filter((h: any) => {
        const rating = h.property?.reviewScore || 0;
        return rating >= minRating;
      });
      console.log(`After minRating filter (${minRating}):`, hotels.length);
    }

    if (amenities && amenities.length > 0) {
      // Note: Amenities filtering would require more detailed hotel data
      // This is a simplified version
      console.log('Amenities filter requested:', amenities);
    }
    
    return {
      type: 'hotels',
      location: locationData.data[0],
      results: hotels.slice(0, 20), // Return more results
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      guests,
      filters: { sortBy, minRating, maxPrice, amenities }
    };
  } catch (error) {
    console.error('Error in searchHotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    // Check if it's a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return { 
        error: 'Search timed out. The booking API is responding slowly. Please try again.', 
        results: [] 
      };
    }
    
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