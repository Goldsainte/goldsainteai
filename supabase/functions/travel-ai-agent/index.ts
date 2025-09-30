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
    const { message, conversationHistory = [], userLocation } = await req.json();
    
    console.log('AI Agent request:', { 
      message, 
      historyLength: conversationHistory.length,
      hasLocation: !!userLocation 
    });

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
      },
      {
        type: "function",
        function: {
          name: "search_restaurants",
          description: "Search for restaurants near a specific location or coordinates. Use this when users ask about restaurants, dining, food, or places to eat. If the user provides coordinates (latitude, longitude), use those. Otherwise, use a city name and it will find restaurants in that area.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city or area to search for restaurants (e.g., 'New York', 'Paris')"
              },
              latitude: {
                type: "number",
                description: "Latitude coordinate if user provided specific location"
              },
              longitude: {
                type: "number",
                description: "Longitude coordinate if user provided specific location"
              },
              radius: {
                type: "number",
                description: "Search radius in meters (default 5000)"
              }
            },
            required: []
          }
        }
      }
    ];

    const locationInfo = userLocation 
      ? `\n\nIMPORTANT: The user's current location is ${userLocation.latitude}, ${userLocation.longitude}. When they ask for restaurants, hotels, or things "near me" or "near my current location", use these exact coordinates in your search.`
      : '';

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a sophisticated travel assistant. You help users plan trips, find hotels, discover destinations, search for restaurants, and answer travel-related questions.${locationInfo}

IMPORTANT: Be action-oriented and helpful. When users ask about hotels, destinations, or restaurants, IMMEDIATELY use the search tools with smart defaults.

Smart Defaults:
- If no dates mentioned: use today and tomorrow
- If no rating preference: use sortBy "review_score" or "popularity"
- If they say "best" or "top": use sortBy "review_score" with minRating 8
- If they say "popular": use sortBy "popularity"
- If they say "cheap" or "budget": use sortBy "price"
- If no guest count: assume 2 guests
- For restaurants: if user provides coordinates, use those; otherwise try to use major city coordinates (NYC: 40.7128, -74.0060; Paris: 48.8566, 2.3522; London: 51.5074, -0.1278; Tokyo: 35.6762, 139.6503)

CRITICAL: When you use search tools and get results, DO NOT list out all the details in text. The interface will show beautiful visual cards automatically. Instead, give a brief, friendly response like:

"Perfect! I found some great hotels in Paris for you. Check out the options below!"

OR 

"Here are amazing restaurants nearby - check out these top-rated places!"

Then ask if they'd like to refine by budget, rating, amenities, dates, or other criteria.

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
        } else if (functionName === 'search_restaurants') {
          toolResult = await searchRestaurants(functionArgs);
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
    const { location, checkIn, checkOut, guests = 2, sortBy, minRating, maxPrice, amenities } = args;
    console.log('searchHotels called with:', { location, checkIn, checkOut, guests, sortBy, minRating, maxPrice, amenities });

    // Search for location first
    console.log('Searching for location:', location);
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
    const searchType = locationData.data[0].search_type || 'CITY';
    console.log('Found destination ID:', destId, 'Search type:', searchType);

    // Get default dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCheckIn = checkIn || today.toISOString().split('T')[0];
    const defaultCheckOut = checkOut || tomorrow.toISOString().split('T')[0];

    // Build URL with filters
    const params = new URLSearchParams({
      dest_id: destId.toString(),
      search_type: searchType.toUpperCase(),
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
    
    const hotelsResponse = await fetch(hotelsUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
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
      results: hotels.slice(0, 6),
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      guests,
      filters: { sortBy, minRating, maxPrice, amenities }
    };
  } catch (error) {
    console.error('Error in searchHotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
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

async function searchRestaurants(args: any) {
  try {
    const { location, latitude, longitude, radius = 5000 } = args;
    console.log('searchRestaurants called with:', { location, latitude, longitude, radius });

    // City coordinates lookup
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'nyc': { lat: 40.7128, lng: -74.0060 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
    };

    let searchLat = latitude;
    let searchLng = longitude;

    // If no coordinates provided, try to look up city
    if (!searchLat || !searchLng) {
      if (location) {
        const normalizedLocation = location.toLowerCase().trim();
        const coords = cityCoordinates[normalizedLocation];
        if (coords) {
          searchLat = coords.lat;
          searchLng = coords.lng;
          console.log(`Using coordinates for ${location}:`, coords);
        }
      }
      
      // Default to NYC if still no coordinates
      if (!searchLat || !searchLng) {
        searchLat = 40.7128;
        searchLng = -74.0060;
        console.log('Using default NYC coordinates');
      }
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        latitude: searchLat,
        longitude: searchLng,
        radius
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Restaurant search error:', errorText);
      return { error: 'Failed to search restaurants', results: [] };
    }

    const data = await response.json();
    console.log('Restaurants found:', data.restaurants?.length || 0);
    
    return {
      type: 'restaurants',
      results: data.restaurants || [],
      location: { latitude: searchLat, longitude: searchLng }
    };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
  }
}