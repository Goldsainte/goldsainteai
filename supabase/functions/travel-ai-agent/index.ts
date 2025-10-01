import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const BOOKING_API_KEY = Deno.env.get('BOOKING_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
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
      },
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for flights between two cities. Use this when users ask about flights, airfare, or flying from one place to another. You can specify one-way or round-trip, cabin class, and whether direct flights only.",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin city or airport (e.g., 'New York', 'JFK', 'London')"
              },
              destination: {
                type: "string",
                description: "Destination city or airport (e.g., 'Paris', 'CDG', 'Tokyo')"
              },
              departureDate: {
                type: "string",
                description: "Departure date in YYYY-MM-DD format"
              },
              returnDate: {
                type: "string",
                description: "Return date in YYYY-MM-DD format (optional, only for round-trip flights)"
              },
              adults: {
                type: "number",
                description: "Number of adult passengers (default 1)"
              },
              travelClass: {
                type: "string",
                enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
                description: "Cabin class (default ECONOMY)"
              },
              nonStop: {
                type: "boolean",
                description: "Whether to show only direct flights (default false)"
              },
              sortBy: {
                type: "string",
                enum: ["best", "price", "duration", "departure_early", "departure_late"],
                description: "How to sort flight results: best (Amadeus recommendation), price (cheapest first), duration (shortest first), departure_early (earliest departure), departure_late (latest departure). Default is 'best'."
              }
            },
            required: ["origin", "destination", "departureDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_events",
          description: "Search for upcoming events, concerts, sports, theater shows, and entertainment using Ticketmaster. Use this when users ask about events, concerts, shows, tickets, or things to do.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "The city name to search events in"
              },
              keyword: {
                type: "string",
                description: "Search keyword for event name, artist, or venue"
              },
              startDate: {
                type: "string",
                description: "Start date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              endDate: {
                type: "string",
                description: "End date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              classificationName: {
                type: "string",
                enum: ["Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"],
                description: "Event category/classification"
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_visa_requirements",
          description: "Check visa requirements for travel between two countries. Use this when users ask about visa requirements, travel documents needed, or whether they need a visa to visit a country. Provide country names or ISO codes.",
          parameters: {
            type: "object",
            properties: {
              fromCountry: {
                type: "string",
                description: "Origin country name or ISO code (e.g., 'United States', 'USA', 'US')"
              },
              toCountry: {
                type: "string",
                description: "Destination country name or ISO code (e.g., 'France', 'FRA', 'FR')"
              }
            },
            required: ["fromCountry", "toCountry"]
          }
        }
      }
    ];

    const locationInfo = userLocation 
      ? `\n\nIMPORTANT: The user's current location is available. When they ask for restaurants, hotels, or things "near me" or "near my current location", ask them to specify their city or use context clues to determine their city. NEVER ask for or mention latitude, longitude, or GPS coordinates - only use city names.`
      : '';

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a sophisticated travel assistant. You help users plan trips, find hotels, discover destinations, search for restaurants, book flights, answer travel-related questions, and provide visa information.${locationInfo}

CRITICAL BEHAVIOR: Be action-oriented and proactive. When users mention travel needs (hotels, flights, restaurants), IMMEDIATELY use the search tools with smart defaults. DO NOT ask clarifying questions first - show results, then offer to refine.

LOCATION RULES:
- NEVER ask users for latitude, longitude, GPS coordinates, or precise location data
- ALWAYS ask for city names instead (e.g., "What city are you in?" not "What's your latitude and longitude?")
- When users say "near me" or "current location", ask them for their city name
- Use city names in all search queries

EXCEPTION - FLIGHTS REQUIRE ORIGIN: For flight searches, if the user does NOT specify where they're flying FROM, you MUST ask them for the origin city before searching. Do not assume or guess the origin location. For example, if they say "flights to Paris" or "fly to London", ask "Where will you be flying from?" before calling search_flights.

VISA REQUIREMENTS PROTOCOL:
When you provide visa information using check_visa_requirements tool:
1. First, provide the visa requirement details clearly, including:
   - Visa status (required, visa-free, visa on arrival, eVisa)
   - Duration of stay allowed
   - Passport validity requirements
   - IMPORTANT: Explain visa fee considerations:
     * Fees vary by destination country
     * Different visa types (tourism, business, study, work) have different fees
     * Petition-based visas (like work visas) may have different fee structures
     * Expedited processing typically costs more
     * Additional charges may apply (SEVIS fees, service center fees)
     * User should verify exact fees on official embassy/consulate website
2. If the destination country REQUIRES a visa (not visa-free, not visa on arrival), ALWAYS ask: "Would you like Goldsainte to assist you with your visa application? Our team can handle the entire process for you, including helping you understand the exact fees and requirements."
3. If they say yes or express interest, inform them: "Great! To get started with your visa application, I'll need to collect some information. Please provide your contact details and travel information."
4. DO NOT collect information in the chat - the interface will show a form for them to fill out.

Smart Defaults to Use IMMEDIATELY:
- Hotels: If no dates → use today and tomorrow
- Flights: If no dates → use tomorrow (one-way by default)
- Flights: If origin is missing → ASK the user where they're flying from (DO NOT ASSUME)
- If they say "round trip" or mention return → use tomorrow + 7 days return
- If no passenger/guest count → assume 1 adult for flights, 2 guests for hotels
- If they say "best" or "top" → use sortBy "review_score" with minRating 8
- If they say "popular" → use sortBy "popularity"
- If they say "cheap" or "budget" → use sortBy "price"
- If they say "direct" or "nonstop" for flights → set nonStop to true
- For cabin class: default to ECONOMY unless specified
- For restaurants: if city not mentioned, ask "What city are you looking for restaurants in?"

CALCULATING DATES: When using "tomorrow", calculate the actual date. For example, if today is 2025-09-30, tomorrow is 2025-10-01. For "next week" add 7 days.

EXAMPLE USER FLOWS (COPY THIS EXACT PATTERN):
User: "Show me flights from New York to Paris"
YOU: *Immediately call search_flights with origin="New York", destination="Paris", departureDate="2025-10-01" (tomorrow's date), adults=1*

User: "I need a hotel in Tokyo"  
YOU: *Immediately call search_hotels with location="Tokyo", checkIn="2025-09-30" (today), checkOut="2025-10-01" (tomorrow), guests=2*

User: "Show me restaurants near me"
YOU: "What city are you in? I'll find the best restaurants for you!"

CRITICAL: When you use search tools and get results, DO NOT list out all the details in text. The interface will show beautiful visual cards automatically. Instead, give a brief, friendly response like:

"Perfect! I found some great hotels in Paris for you. Check out the options below!"

OR 

"Here are amazing restaurants nearby - check out these top-rated places!"

OR

"Great! I found some excellent flight options for you. See the details below!"

Then ask if they'd like to refine by budget, rating, amenities, dates, cabin class, or other criteria.

Always show results first with minimal text, ask questions later. Be conversational but let the visual interface do the heavy lifting.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling OpenAI with tools...');

    const aiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
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
        } else if (functionName === 'search_flights') {
          toolResult = await searchFlights(functionArgs);
        } else if (functionName === 'search_events') {
          toolResult = await searchEvents(functionArgs);
        } else if (functionName === 'check_visa_requirements') {
          toolResult = await checkVisaRequirements(functionArgs);
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

      const finalResponse = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
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

    // No tool calls - attempt a smart fallback if the user likely provided a city
    const simpleText = (message || '').trim();
    const looksLikeCity = simpleText.length > 0 && simpleText.length <= 60 && /[a-zA-Z]/.test(simpleText) && simpleText.split(/\s+/).length <= 5;

    if (looksLikeCity) {
      console.log('No tool calls from AI. Fallback: trying searchHotels with', simpleText);
      const fallbackResult = await searchHotels({ location: simpleText, guests: 2, sortBy: 'popularity' }, '');

      if (fallbackResult && Array.isArray(fallbackResult.results) && fallbackResult.results.length > 0) {
        const finalMessage = `Perfect! I found some great hotels in ${simpleText}. Check out the options below!`;
        return new Response(JSON.stringify({
          message: finalMessage,
          toolResults: [fallbackResult],
          conversationHistory: [...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: finalMessage }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      console.log('Fallback search returned no results for', simpleText);
    }

    // No tool calls and no fallback results, return direct response
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

    // Get Amadeus credentials
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus credentials not configured', results: [] };
    }

    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with Amadeus', results: [] };
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Search for city code dynamically
    const locationParams = new URLSearchParams({
      keyword: location,
      subType: 'CITY',
      'page[limit]': '5'
    });

    const locationResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?${locationParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!locationResponse.ok || !(await locationResponse.clone().json()).data?.length) {
      return { 
        error: `Could not find city "${location}". Please try a different spelling.`,
        results: [] 
      };
    }

    const locationData = await locationResponse.json();
    const cityInfo = locationData.data[0];
    const cityCode = cityInfo.iataCode;
    const countryCode = cityInfo.address?.countryCode || cityInfo.iataCode?.slice(0, 2);
    const currencyMap: Record<string, string> = { US:'USD', FR:'EUR', GB:'GBP', DE:'EUR', ES:'EUR', IT:'EUR', NL:'EUR', BE:'EUR', PT:'EUR', IE:'EUR', CH:'CHF', JP:'JPY', AU:'AUD', CA:'CAD', AE:'AED', SG:'SGD', IN:'INR', ID:'IDR', TH:'THB', MY:'MYR', MX:'MXN', BR:'BRL', ZA:'ZAR', SA:'SAR', TR:'TRY', KR:'KRW', HK:'HKD' };
    const localCurrency = currencyMap[countryCode] || 'USD';
    console.log(`Found city code for "${location}": ${cityCode} (${countryCode}), currency: ${localCurrency}`);

    // Default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCheckIn = checkIn || today.toISOString().split('T')[0];
    const defaultCheckOut = checkOut || tomorrow.toISOString().split('T')[0];

    // Step 1: Get hotel IDs
    const hotelListResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!hotelListResponse.ok) {
      return { error: 'Failed to fetch hotel list', results: [] };
    }

    const hotelListData = await hotelListResponse.json();
    if (!hotelListData.data || hotelListData.data.length === 0) {
      return { error: 'No hotels found in this city', results: [] };
    }

    // Build hotel id list and fetch offers in batches to avoid URL limits
    const hotelIdList: string[] = hotelListData.data.slice(0, 40).map((h: any) => h.hotelId);
    const chunk = (arr: string[], size: number) => arr.reduce<string[][]>((acc, _, i) => {
      if (i % size === 0) acc.push(arr.slice(i, i + size));
      return acc;
    }, []);

    const fetchOffersForIds = async (ids: string[], checkInDate: string, checkOutDate: string, bestRateOnly: boolean) => {
      const offerParams = new URLSearchParams({
        hotelIds: ids.join(','),
        checkInDate,
        checkOutDate,
        adults: guests.toString(),
        currency: localCurrency,
        roomQuantity: '1',
        bestRateOnly: bestRateOnly ? 'true' : 'false',
      });
      const resp = await fetch(
        `https://test.api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.warn('Offers fetch failed for batch:', ids.length, 'status:', resp.status);
        return [] as any[];
      }
      const data = await resp.json();
      return (data.data || []) as any[];
    };

    const idBatches = chunk(hotelIdList, 20); // Amadeus works reliably with <=20 IDs per request
    let hotels: any[] = [];

    // Fetch batches in parallel for speed
    const batchPromises = idBatches.map((batch) =>
      fetchOffersForIds(batch, defaultCheckIn, defaultCheckOut, true)
    );
    const batchResults = await Promise.all(batchPromises);
    for (const batchHotels of batchResults) {
      console.log('Batch offers found:', batchHotels.length);
      hotels.push(...batchHotels);
    }

    console.log('Total Amadeus hotels found:', hotels.length);

    // Fallback retry: if no offers for default dates, try +30 days and disable bestRateOnly
    if (!hotels.length) {
      const baseIn = new Date(defaultCheckIn);
      const altIn = new Date(baseIn);
      altIn.setDate(baseIn.getDate() + 30);
      const altOut = new Date(altIn);
      altOut.setDate(altIn.getDate() + 1);

      const retryPromises = idBatches.map((batch) =>
        fetchOffersForIds(
          batch,
          altIn.toISOString().split('T')[0],
          altOut.toISOString().split('T')[0],
          false
        )
      );
      const retryResults = await Promise.all(retryPromises);
      for (const retryHotels of retryResults) {
        console.log('Retry batch (+30 days) offers:', retryHotels.length);
        hotels.push(...retryHotels);
      }

      console.log('Total hotels after retry:', hotels.length);
    }

    // Transform to expected format with Google Places enrichment
    let transformedHotels = await Promise.all(hotels.map(async (offer: any, idx: number) => {
      const hotel = offer.hotel;
      const firstOffer = offer.offers?.[0];
      const price = firstOffer?.price;

      const item: any = {
        hotel_id: hotel.hotelId,
         property: {
          name: hotel.name,
          photoUrls: [`https://placehold.co/800x600/1a1a1a/d4af37?text=${encodeURIComponent(hotel.name.substring(0, 30))}&font=roboto`],
          reviewScore: 0,
          reviewCount: 0,
          externalUrls: { default: `https://www.amadeus.com/hotel/${hotel.hotelId}` }
        },
        location: hotel.cityCode,
        region: hotel.address?.cityName || location,
        cityCode: hotel.cityCode,
        price: price?.total ? parseFloat(price.total) : 0,
        priceBreakdown: {
          grossPrice: { value: price?.total ? parseFloat(price.total) : 0, currency: price?.currency || 'USD' }
        },
        accessibilityLabel: `${hotel.name}. ${hotel.address?.cityName || ''}. Current price ${price?.total || 0} ${price?.currency || 'USD'}`,
        amadeusOffer: offer
      };

       try { if (idx < 12) {
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('GOOGLE_PLACES_API_KEY_2');
        if (apiKey) {
          let place: any | undefined;

          // Prefer Nearby Search using precise coordinates to get the exact property
          if (hotel.latitude && hotel.longitude) {
            const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${hotel.latitude},${hotel.longitude}&radius=400&keyword=${encodeURIComponent(hotel.name)}&type=lodging&key=${apiKey}`;
            const nearbyResp = await fetch(nearbyUrl);
            if (nearbyResp.ok) {
              const nearbyData = await nearbyResp.json();
              place = nearbyData.results?.[0];
            }
          }

          // Fallback to Text Search if nearby did not yield a result
          if (!place) {
            const q = `${hotel.name} ${hotel.address?.cityName || location}`;
            const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&type=lodging&key=${apiKey}`;
            const textResp = await fetch(textUrl);
            if (textResp.ok) {
              const textData = await textResp.json();
              place = textData.results?.[0];
            }
          }

          if (place) {
            if (typeof place.rating === 'number') item.property.reviewScore = place.rating;
            if (typeof place.user_ratings_total === 'number') item.property.reviewCount = place.user_ratings_total;
            const ref = place.photos?.[0]?.photo_reference;
            if (ref) {
              item.property.photoUrls = [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${ref}&key=${apiKey}`];
            }
            if (place.place_id) {
              item.property.externalUrls.google = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
            }
          }
        }
        }
      } catch (_) { /* ignore enrichment errors */ }

      return item;
    }));

    // Apply filters
    const minRatingNormalized = typeof minRating === 'number' ? (minRating > 5 ? minRating / 2 : minRating) : undefined;
    if (typeof minRatingNormalized === 'number') {
      transformedHotels = transformedHotels.filter((h: any) => h.property.reviewScore >= minRatingNormalized);
    }
    if (typeof maxPrice === 'number') {
      transformedHotels = transformedHotels.filter((h: any) => h.price <= maxPrice);
    }
    if (sortBy === 'price') {
      transformedHotels.sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === 'review_score') {
      transformedHotels.sort((a: any, b: any) => b.property.reviewScore - a.property.reviewScore);
    }

    return {
      type: 'hotels',
      location: { name: location, dest_id: cityCode },
      results: transformedHotels,
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      guests,
      filters: { sortBy, minRating, maxPrice, amenities }
    };
  } catch (error) {
    console.error('Error in searchHotels:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
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

// Search flights using Amadeus API
async function searchFlights(args: any) {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY', nonStop = false, sortBy = 'best' } = args;
    console.log('searchFlights called with:', { origin, destination, departureDate, returnDate, adults, travelClass, nonStop, sortBy });

    // Get Amadeus credentials
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus credentials not configured', results: [] };
    }

    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with Amadeus', results: [] };
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Convert city names to airport codes if needed
    const getAirportCode = async (location: string) => {
      // If already looks like an airport code (3 letters), use it
      if (/^[A-Z]{3}$/i.test(location.trim())) {
        return location.toUpperCase();
      }

      // Search for airport code
      const searchParams = new URLSearchParams({
        keyword: location,
        subType: 'AIRPORT,CITY',
        'page[limit]': '1'
      });

      const resp = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations?${searchParams}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].iataCode;
        }
      }

      return location.toUpperCase();
    };

    const originCode = await getAirportCode(origin);
    const destinationCode = await getAirportCode(destination);

    console.log('Airport codes:', { originCode, destinationCode });

    // Build flight search params
    const flightParams = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: adults.toString(),
      travelClass,
      nonStop: nonStop ? 'true' : 'false',
      currencyCode: 'USD',
      max: '20'
    });

    if (returnDate) {
      flightParams.append('returnDate', returnDate);
    }

    const flightResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${flightParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!flightResponse.ok) {
      console.error('Flight search failed:', flightResponse.status);
      return { 
        error: `Could not find flights from ${origin} to ${destination}. Try different dates or cities.`,
        results: [] 
      };
    }

    const flightData = await flightResponse.json();
    console.log('Flights found:', flightData.data?.length || 0);

    // Sort flights based on sortBy parameter
    let sortedFlights = flightData.data || [];
    
    if (sortBy && sortedFlights.length > 0) {
      switch (sortBy) {
        case 'price':
          // Sort by total price (lowest first)
          sortedFlights.sort((a: any, b: any) => {
            const priceA = parseFloat(a.price.total);
            const priceB = parseFloat(b.price.total);
            return priceA - priceB;
          });
          break;
          
        case 'duration':
          // Sort by duration (shortest first)
          sortedFlights.sort((a: any, b: any) => {
            const getDurationMinutes = (duration: string) => {
              const hours = duration.match(/(\d+)H/)?.[1] || '0';
              const minutes = duration.match(/(\d+)M/)?.[1] || '0';
              return parseInt(hours) * 60 + parseInt(minutes);
            };
            const durationA = getDurationMinutes(a.itineraries[0].duration);
            const durationB = getDurationMinutes(b.itineraries[0].duration);
            return durationA - durationB;
          });
          break;
          
        case 'departure_early':
          // Sort by earliest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeA - timeB;
          });
          break;
          
        case 'departure_late':
          // Sort by latest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeB - timeA;
          });
          break;
          
        case 'best':
        default:
          // Keep Amadeus default sorting (combination of price, duration, and quality)
          break;
      }
    }

    return {
      type: 'flights',
      origin: { code: originCode, name: origin },
      destination: { code: destinationCode, name: destination },
      departureDate,
      returnDate,
      results: sortedFlights,
      dictionaries: flightData.dictionaries,
      meta: flightData.meta,
      filters: { sortBy }
    };

  } catch (error) {
    console.error('Error in searchFlights:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function checkVisaRequirements(args: any) {
  try {
    const { fromCountry, toCountry } = args;
    console.log('checkVisaRequirements called with:', { fromCountry, toCountry });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return { 
        error: 'Visa check service not configured',
        requirement: 'unknown'
      };
    }

    // Use Lovable AI to get accurate visa information
    const prompt = `Provide accurate and up-to-date visa requirements for a traveler from ${fromCountry} visiting ${toCountry}. Include:
    
1. Visa requirement status (visa required, visa-free, visa on arrival, eVisa available, etc.)
2. Maximum stay duration if visa-free or visa on arrival
3. Passport validity requirements (e.g., must be valid for 6 months beyond stay)

IMPORTANT - VISA FEE CONSIDERATIONS:
Explain that visa fees vary based on:
- Destination Country: Each country has different fee structures
- Visa Type: Purpose of visit (tourism, business, study, work) affects the category and fee
- Petition vs. Non-Petition Based: Some visas (like work visas) are petition-based with different fees
- Application Processing Time: Expedited processing may cost more
- Additional Charges: May include SEVIS fees (for exchange visitors) or visa service center fees

4. Estimated fee range (if available) and note that exact fees should be verified on:
   - Official embassy or consulate website of ${toCountry}
   - Official government visa fee schedules (.gov websites)

5. Any special conditions or requirements
6. Official embassy/government website link if available

If visa is required, mention that Goldsainte can assist with the application process and handle all the complexity.

Be specific and factual. Always recommend verifying exact fees and requirements with official government sources.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return { 
        error: `Visa information lookup failed: ${response.statusText}`,
        requirement: 'unknown'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('Visa requirement AI response:', aiResponse);

    return {
      type: 'visa',
      fromCountry,
      toCountry,
      information: aiResponse,
      source: 'AI-powered visa information'
    };

  } catch (error) {
    console.error('Error in checkVisaRequirements:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      requirement: 'unknown'
    };
  }
}

async function searchEvents(args: any) {
  try {
    const { city, keyword, startDate, endDate, classificationName } = args;
    console.log('searchEvents called with:', { city, keyword, startDate, endDate, classificationName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: 'Supabase configuration missing', results: [] };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/search-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, keyword, startDate, endDate, classificationName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('search-events error:', response.status, errorText);
      return { error: `Failed to fetch events: ${response.statusText}`, results: [] };
    }

    const data = await response.json();
    console.log('Events found:', data.events?.length || 0);

    return {
      type: 'events',
      results: data.events || [],
      page: data.page,
      city
    };

  } catch (error) {
    console.error('Error in searchEvents:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}