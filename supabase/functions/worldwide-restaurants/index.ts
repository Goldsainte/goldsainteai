import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

// Filter for high-quality restaurants only (4+ stars)
function isHighQualityRestaurant(place: any): boolean {
  const rating = place.rating || place.average_rating || 0;
  return rating >= 4.0;
}

// Transform Worldwide Restaurants API response to legacy format
function transformRestaurant(place: any): any {
  // Handle rating as string or number
  const rating = typeof place.rating === 'string' 
    ? parseFloat(place.rating) 
    : (place.rating || 0);
  
  // Handle price_level - convert $ signs to numeric ($ = 1, $$ = 2, etc.)
  const priceRange = place.price_level || place.price || '';
  const priceLevel = typeof priceRange === 'string' ? priceRange.length : 2;
  
  // Handle address - try multiple fields
  const address = place.address || place.location_string || place.address_obj?.street1 || '';
  
  // Handle photos - check different possible structures
  const photos = [];
  if (place.photo?.images?.large?.url) {
    photos.push({
      photo_reference: place.photo.images.large.url,
      height: 800,
      width: 800,
    });
  } else if (place.photo?.images?.medium?.url) {
    photos.push({
      photo_reference: place.photo.images.medium.url,
      height: 800,
      width: 800,
    });
  }
  
  // Handle coordinates - convert strings to floats
  const lat = typeof place.latitude === 'string' 
    ? parseFloat(place.latitude) 
    : (place.latitude || 0);
  const lng = typeof place.longitude === 'string' 
    ? parseFloat(place.longitude) 
    : (place.longitude || 0);
  
  return {
    place_id: place.location_id || `worldwide_${Date.now()}_${Math.random()}`,
    name: place.name || '',
    vicinity: address,
    formatted_address: address,
    geometry: {
      location: { lat, lng },
    },
    rating: rating,
    user_ratings_total: place.num_reviews || 0,
    price_level: priceLevel,
    opening_hours: undefined,
    photos: photos,
    types: place.cuisine_types || place.cuisine?.map((c: any) => c.name) || place.cuisine || [],
    business_status: place.is_closed ? 'CLOSED' : 'OPERATIONAL',
    formatted_phone_number: place.phone || '',
    website: place.website || '',
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

    console.info(`🔍 Searching restaurants in: ${location}${cuisine ? `, cuisine: ${cuisine}` : ''}`);

    // Step 1: Get location_id from city name using typeahead
    const typeaheadUrl = 'https://worldwide-restaurants.p.rapidapi.com/typeahead';
    
    console.info(`📍 Resolving city name to location_id...`);

    const typeaheadResponse = await fetch(typeaheadUrl, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'worldwide-restaurants.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ 
        q: location,
        language: 'en_US'
      }),
    });

    if (!typeaheadResponse.ok) {
      const errorText = await typeaheadResponse.text();
      console.error(`Typeahead API error: ${typeaheadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to resolve city location',
          restaurants: [],
        }),
        { status: typeaheadResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typeaheadData = await typeaheadResponse.json();
    const locationId = typeaheadData.results?.find((r: any) => r.result_object?.location_id)?.result_object?.location_id 
      || typeaheadData.results?.[0]?.location_id;

    if (!locationId) {
      console.error(`❌ City not found: ${location}`);
      return new Response(
        JSON.stringify({ error: 'City not found', restaurants: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`✅ Found location_id: ${locationId}`);

    // Step 2: Fetch restaurants using location_id
    const restaurantsUrl = 'https://worldwide-restaurants.p.rapidapi.com/restaurants/list';
    
    console.info(`📡 Fetching restaurants for location_id: ${locationId}`);

    const restaurantsResponse = await fetch(restaurantsUrl, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'worldwide-restaurants.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        location_id: locationId,
        limit: '50',
        language: 'en_US',
        currency: 'USD',
      }),
    });

    if (!restaurantsResponse.ok) {
      const errorText = await restaurantsResponse.text();
      console.error(`Restaurants API error: ${restaurantsResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch restaurants',
          restaurants: [],
        }),
        { status: restaurantsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restaurantsData = await restaurantsResponse.json();
    const results = restaurantsData.data || [];
    
    console.info(`✅ Received ${results.length} total restaurants`);
    
    // Filter and transform restaurants
    const afterFirstFilter = results.filter(isActualRestaurant);
    console.info(`🏪 After filtering non-restaurants: ${afterFirstFilter.length} remaining`);
    
    const restaurants = afterFirstFilter
      .filter(isHighQualityRestaurant)
      .map(transformRestaurant);

    console.info(`⭐ Filtered to ${restaurants.length} high-quality (4+ stars) restaurants`);

    return new Response(
      JSON.stringify({ restaurants, count: restaurants.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in worldwide-restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
