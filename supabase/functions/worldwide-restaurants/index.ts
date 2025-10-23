import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Filter out non-restaurant establishments
function isActualRestaurant(place: any): boolean {
  const excludeTypes = ['hotel', 'lodging', 'spa', 'gym', 'hospital', 'pharmacy', 'store', 'shopping_mall'];
  const types = place.cuisine_types || [];
  return !excludeTypes.some(excluded => 
    types.some((type: string) => type.toLowerCase().includes(excluded))
  );
}

// Transform Worldwide Restaurants API response to legacy format
function transformRestaurant(place: any): any {
  // Convert price range (e.g., "$$") to price_level (1-4)
  const priceLevel = place.price_range ? place.price_range.length : 2;
  
  return {
    place_id: place.id || place.restaurant_id || `worldwide_${Date.now()}_${Math.random()}`,
    name: place.name || '',
    vicinity: place.address || place.location || '',
    formatted_address: place.full_address || place.address || '',
    geometry: {
      location: {
        lat: place.latitude || place.lat || 0,
        lng: place.longitude || place.lng || place.lon || 0,
      },
    },
    rating: place.rating || place.average_rating || 0,
    user_ratings_total: place.reviews_count || place.review_count || 0,
    price_level: priceLevel,
    opening_hours: place.hours ? {
      open_now: place.is_open || false,
      weekday_text: Array.isArray(place.hours) ? place.hours : [],
    } : undefined,
    photos: place.photos?.map((photo: any) => {
      const photoUrl = typeof photo === 'string' ? photo : photo.url || photo.image_url;
      return {
        photo_reference: photoUrl,
        height: 800,
        width: 800,
      };
    }) || [],
    types: place.cuisine_types || place.cuisines || place.categories || [],
    business_status: place.is_closed ? 'CLOSED' : 'OPERATIONAL',
    formatted_phone_number: place.phone || place.phone_number || place.contact?.phone,
    website: place.website || place.url,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, cuisine, keyword } = await req.json();

    if (!location) {
      console.error('Missing location parameter');
      return new Response(
        JSON.stringify({ error: 'location (city name) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`Searching restaurants in: ${location}${cuisine ? `, cuisine: ${cuisine}` : ''}`);

    // Build query parameters
    const params = new URLSearchParams({
      location: location,
      limit: '50',
    });

    if (cuisine) {
      params.append('cuisine', cuisine);
    }

    if (keyword) {
      params.append('query', keyword);
    }

    const url = `https://worldwide-restaurants.p.rapidapi.com/search?${params.toString()}`;
    
    console.info(`Calling Worldwide Restaurants API`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'worldwide-restaurants.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Worldwide Restaurants API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch restaurants',
          status: response.status,
          message: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.info(`Received ${data.results?.length || 0} results from API`);

    // Extract restaurants array (API response structure may vary)
    const results = data.results || data.restaurants || data.data || [];
    
    // Filter and transform restaurants
    const restaurants = results
      .filter(isActualRestaurant)
      .map(transformRestaurant);

    console.info(`Returning ${restaurants.length} restaurants after filtering`);

    return new Response(
      JSON.stringify({ restaurants, count: restaurants.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in worldwide-restaurants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
