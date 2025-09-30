import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, checkIn, checkOut, guests } = await req.json();
    
    console.log('Search hotels request:', { location, checkIn, checkOut, guests });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Search for location first to get destination ID
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
      throw new Error(`Location search failed: ${locationResponse.statusText}`);
    }

    const locationData = await locationResponse.json();
    console.log('Location data:', locationData);

    if (!locationData.data || locationData.data.length === 0) {
      return new Response(JSON.stringify({ error: 'Location not found', results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const destId = locationData.data[0].dest_id;

    // Search for hotels
    const hotelsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=CITY&arrival_date=${checkIn}&departure_date=${checkOut}&adults=${guests || 2}&room_qty=1&page_number=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=USD`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!hotelsResponse.ok) {
      throw new Error(`Hotels search failed: ${hotelsResponse.statusText}`);
    }

    const hotelsData = await hotelsResponse.json();
    console.log('Hotels found:', hotelsData.data?.hotels?.length || 0);

    return new Response(JSON.stringify({ 
      results: hotelsData.data?.hotels || [],
      location: locationData.data[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});