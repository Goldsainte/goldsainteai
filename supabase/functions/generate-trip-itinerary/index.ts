import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface Activity {
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  duration: string;
  notes: string;
  bookingLink?: string;
  bookingId?: string;
}

interface RestaurantSuggestion {
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
  estimatedCost: number;
  rating?: number;
  photo?: string;
  bookingLink?: string;
}

interface HotelOption {
  name: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  photos: string[];
  bookingLink?: string;
  hotelId: string;
}

interface FlightOption {
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  stops: number;
  bookingLink?: string;
}

interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  meals: {
    breakfast: RestaurantSuggestion;
    lunch: RestaurantSuggestion;
    dinner: RestaurantSuggestion;
  };
  transportation: {
    method: string;
    estimatedCost: number;
    notes: string;
  };
  totalDayCost: number;
  alternatives: Activity[];
}

interface TripItineraryResponse {
  itinerary: DailyItinerary[];
  overview: {
    totalCost: number;
    highlights: string[];
    packingTips: string[];
    localTips: string[];
  };
  flights?: {
    outbound: FlightOption[];
    return: FlightOption[];
  };
  hotels?: HotelOption[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      destination, 
      startDate, 
      endDate, 
      travelers = 1, 
      interests = [], 
      pace = 'moderate', 
      budget,
      originCity,
      originAirport 
    } = await req.json();

    if (!destination || !startDate || !endDate) {
      throw new Error('Missing required fields: destination, startDate, endDate');
    }

    console.log('Generating itinerary for:', { destination, startDate, endDate, travelers, interests });

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Step 1: Search for flights if origin is provided
    let flightData = null;
    if (originAirport && destination) {
      try {
        console.log('Searching flights...');
        const { data: flightsResponse } = await supabaseClient.functions.invoke('search-flights', {
          body: {
            origin: originAirport,
            destination: destination,
            departureDate: startDate,
            returnDate: endDate,
            adults: travelers,
            maxResults: 5
          }
        });
        flightData = flightsResponse;
        console.log('Found flights:', flightsResponse?.results?.length || 0);
      } catch (error) {
        console.error('Flight search error:', error);
      }
    }

    // Step 2: Search for hotels
    let hotelData = null;
    try {
      console.log('Searching hotels...');
      const { data: hotelsResponse } = await supabaseClient.functions.invoke('search-hotels', {
        body: {
          cityCode: destination,
          checkInDate: startDate,
          checkOutDate: endDate,
          adults: travelers,
          maxResults: 10
        }
      });
      hotelData = hotelsResponse;
      console.log('Found hotels:', hotelsResponse?.results?.length || 0);
    } catch (error) {
      console.error('Hotel search error:', error);
    }

    // Step 3: Search for events during the trip
    let eventData = null;
    try {
      console.log('Searching events...');
      const { data: eventsResponse } = await supabaseClient.functions.invoke('search-events', {
        body: {
          city: destination,
          startDate: startDate,
          endDate: endDate,
          maxResults: 20
        }
      });
      eventData = eventsResponse;
      console.log('Found events:', eventsResponse?.results?.length || 0);
    } catch (error) {
      console.error('Event search error:', error);
    }

    // Step 4: Search for restaurants
    let restaurantData = null;
    try {
      console.log('Searching restaurants...');
      const { data: restaurantsResponse } = await supabaseClient.functions.invoke('tripadvisor-search-restaurants', {
        body: {
          location: destination,
          limit: 30
        }
      });
      restaurantData = restaurantsResponse;
      console.log('Found restaurants:', restaurantsResponse?.restaurants?.length || 0);
    } catch (error) {
      console.error('Restaurant search error:', error);
    }

    // Build comprehensive context from real search results
    let contextData = `\n\n# REAL SEARCH DATA\n\n`;
    
    if (flightData?.results?.length > 0) {
      contextData += `## Available Flights:\n`;
      flightData.results.slice(0, 5).forEach((flight: any, idx: number) => {
        contextData += `${idx + 1}. ${flight.airline} - $${flight.price} - ${flight.departure} to ${flight.arrival} (${flight.duration}, ${flight.stops} stops)\n`;
      });
      contextData += '\n';
    }

    if (hotelData?.results?.length > 0) {
      contextData += `## Available Hotels:\n`;
      hotelData.results.slice(0, 8).forEach((hotel: any, idx: number) => {
        contextData += `${idx + 1}. ${hotel.name} - $${hotel.price}/night - Rating: ${hotel.rating}/5 - ${hotel.amenities?.slice(0, 3).join(', ') || 'No amenities listed'}\n`;
      });
      contextData += '\n';
    }

    if (eventData?.results?.length > 0) {
      contextData += `## Local Events & Activities:\n`;
      eventData.results.slice(0, 15).forEach((event: any, idx: number) => {
        contextData += `${idx + 1}. ${event.name} - ${event.date} - ${event.venue || 'Various locations'} - $${event.minPrice}-${event.maxPrice}\n`;
      });
      contextData += '\n';
    }

    if (restaurantData?.restaurants?.length > 0) {
      contextData += `## Restaurant Options:\n`;
      restaurantData.restaurants.slice(0, 20).forEach((restaurant: any, idx: number) => {
        contextData += `${idx + 1}. ${restaurant.name} - ${restaurant.cuisine || 'Various'} - ${restaurant.price_level || '$$'} - Rating: ${restaurant.rating}/5\n`;
      });
      contextData += '\n';
    }

    // Build prompt for AI with real data
    const prompt = `Create a detailed ${days}-day itinerary for ${travelers} travelers visiting ${destination} from ${startDate} to ${endDate}.

Trip Details:
- Pace: ${pace}
- Interests: ${interests.join(', ') || 'general sightseeing'}
- Budget per day: ${budget?.perDay ? `$${budget.perDay}` : 'flexible'}
- Number of travelers: ${travelers}

${contextData}

IMPORTANT INSTRUCTIONS:
1. Use ONLY the hotels, restaurants, events, and activities from the REAL SEARCH DATA provided above
2. Match activities to the user's interests: ${interests.join(', ') || 'general sightseeing'}
3. Respect the ${pace} pace preference
4. Include actual hotel names with real prices from the hotel list
5. Include actual restaurant names with real prices from the restaurant list
6. Incorporate real events happening during their dates
7. Provide realistic transportation costs
8. Create a balanced daily schedule that matches their pace preference

For each day, provide:
1. A theme/focus for the day
2. Morning activity (9 AM - 12 PM) - use real events/attractions when available
3. Afternoon activity (2 PM - 6 PM) - use real events/attractions when available
4. Evening activity (7 PM - 10 PM) - use real events/attractions when available
5. Restaurant suggestions for breakfast, lunch, and dinner - USE ONLY restaurants from the provided list
6. Transportation recommendations with realistic local costs
7. 2-3 alternative activities from the real events/activities list

Return the response as valid JSON following this structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "Historic Center Exploration",
      "morning": { "time": "9:00 AM", "activity": "Visit [specific attraction]", "location": "[exact location]", "estimatedCost": 20, "duration": "3 hours", "notes": "Insider tip..." },
      "afternoon": { "time": "2:00 PM", "activity": "Explore [area]", "location": "[exact location]", "estimatedCost": 15, "duration": "4 hours", "notes": "Best viewed..." },
      "evening": { "time": "7:00 PM", "activity": "[real event name if available]", "location": "[venue]", "estimatedCost": 40, "duration": "3 hours", "notes": "Book ahead..." },
      "meals": {
        "breakfast": { "name": "[REAL restaurant name]", "cuisine": "[cuisine type]", "priceRange": "$", "location": "[area]", "estimatedCost": 15 },
        "lunch": { "name": "[REAL restaurant name]", "cuisine": "[cuisine type]", "priceRange": "$$", "location": "[area]", "estimatedCost": 25 },
        "dinner": { "name": "[REAL restaurant name]", "cuisine": "[cuisine type]", "priceRange": "$$$", "location": "[area]", "estimatedCost": 50 }
      },
      "transportation": { "method": "Metro/Walking", "estimatedCost": 10, "notes": "Day pass recommended" },
      "totalDayCost": 175,
      "alternatives": [
        { "time": "Flexible", "activity": "[REAL alternative event]", "location": "[venue]", "estimatedCost": 20, "duration": "2 hours", "notes": "Weather backup" }
      ]
    }
  ],
  "overview": {
    "totalCost": 0,
    "highlights": ["Must-see attractions", "Unique experiences", "Local favorites"],
    "packingTips": ["Weather-appropriate clothing", "Comfortable shoes", "Local SIM card"],
    "localTips": ["Best times to visit attractions", "Local customs", "Money-saving tips"]
  }
}

CRITICAL: Calculate totalCost in overview by summing all daily costs. Each day's totalDayCost should include all activities, meals, and transportation for that day.`;

    // Use Lovable AI (Gemini 2.5 Flash) to generate itinerary
    console.log('Calling Lovable AI to generate itinerary...');
    const { data, error } = await supabaseClient.functions.invoke('lovable-ai', {
      body: {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }
    });

    if (error) {
      console.error('Lovable AI error:', error);
      throw error;
    }

    // Parse the AI response
    const aiResponse = data.choices[0].message.content;
    console.log('AI response received, parsing...');
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const itineraryData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!itineraryData || !itineraryData.itinerary) {
      throw new Error('Failed to parse itinerary from AI response');
    }

    // Prepare the enhanced response with real booking data
    const response: TripItineraryResponse = {
      ...itineraryData,
      flights: flightData?.results ? {
        outbound: flightData.results.slice(0, 3).map((f: any) => ({
          airline: f.airline,
          departure: f.departure,
          arrival: f.arrival,
          duration: f.duration,
          price: f.price,
          stops: f.stops,
          bookingLink: f.deepLink
        })),
        return: []
      } : undefined,
      hotels: hotelData?.results ? hotelData.results.slice(0, 5).map((h: any) => ({
        name: h.name,
        rating: h.rating,
        pricePerNight: h.price,
        totalPrice: h.price * days,
        amenities: h.amenities || [],
        photos: h.photos || [],
        hotelId: h.hotelId
      })) : undefined
    };

    console.log('Itinerary generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        ...response,
        metadata: {
          destination,
          startDate,
          endDate,
          travelers,
          days,
          generatedAt: new Date().toISOString(),
          hasFlights: !!flightData?.results?.length,
          hasHotels: !!hotelData?.results?.length,
          hasEvents: !!eventData?.results?.length,
          hasRestaurants: !!restaurantData?.restaurants?.length
        }
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
