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
    const { latitude, longitude, radius = 5000 } = await req.json();
    
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    console.log('Fetching restaurants near:', { latitude, longitude, radius });

    // Fetch nearby restaurants using Google Places Nearby Search
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${apiKey}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', placesData);
      throw new Error(`Google Places API error: ${placesData.status}`);
    }

    // Transform the results to include photo URLs
    const restaurants = placesData.results?.slice(0, 6).map((place: any) => {
      const photoReference = place.photos?.[0]?.photo_reference;
      const photoUrl = photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`
        : null;

      return {
        id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        priceLevel: place.price_level,
        address: place.vicinity,
        photoUrl,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        types: place.types || [],
        openNow: place.opening_hours?.open_now,
      };
    }) || [];

    console.log(`Found ${restaurants.length} restaurants`);

    return new Response(
      JSON.stringify({ restaurants }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in fetch-restaurants function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
