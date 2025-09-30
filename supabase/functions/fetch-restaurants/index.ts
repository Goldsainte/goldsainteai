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
    const { latitude, longitude, radius = 5000 } = await req.json();
    
    console.log('Fetching restaurants near:', { latitude, longitude, radius });

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured');
    }

    // Search for restaurants using Nearby Search API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.log('No restaurants found');
      return new Response(JSON.stringify({ 
        success: true,
        restaurants: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get top 6 restaurants
    const topRestaurants = searchData.results.slice(0, 6);
    
    // Format restaurant data
    const restaurants = topRestaurants.map((place: any) => {
      const photo = place.photos && place.photos[0] 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null;

      return {
        id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        priceLevel: place.price_level,
        vicinity: place.vicinity,
        photo,
        types: place.types || [],
        geometry: place.geometry
      };
    });

    console.log(`Found ${restaurants.length} restaurants`);

    return new Response(JSON.stringify({ 
      success: true,
      restaurants
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in fetch-restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
