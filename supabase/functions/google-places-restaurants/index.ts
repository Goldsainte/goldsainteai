const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Filter out non-restaurant places (hotels, spas, etc.)
function isActualRestaurant(place: any): boolean {
  const types = place.types || [];
  
  // Exclude lodging, spas, hotels, gyms, health facilities
  const excludeTypes = ['lodging', 'spa', 'gym', 'health', 'hotel', 'motel', 'resort', 'inn'];
  const hasExcludedType = types.some((t: string) => 
    excludeTypes.some(excluded => t.toLowerCase().includes(excluded))
  );
  
  if (hasExcludedType) {
    console.log(`Filtering out ${place.displayName?.text || place.name} - has excluded type:`, types);
    return false;
  }
  
  // Must have restaurant or meal-related type
  const restaurantTypes = ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe', 'bar', 'bakery', 'meal'];
  const hasRestaurantType = types.some((t: string) => 
    restaurantTypes.some(restaurant => t.toLowerCase().includes(restaurant))
  );
  
  if (!hasRestaurantType) {
    console.log(`Filtering out ${place.displayName?.text || place.name} - no restaurant type:`, types);
    return false;
  }
  
  return true;
}

// Transform new API response to legacy format for frontend compatibility
function transformRestaurant(place: any, apiKey: string): any {
  return {
    place_id: place.id,
    name: place.displayName?.text || place.name || '',
    vicinity: place.formattedAddress || place.vicinity || '',
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: place.priceLevel,
    geometry: {
      location: {
        lat: place.location?.latitude,
        lng: place.location?.longitude,
      },
    },
    opening_hours: {
      open_now: place.currentOpeningHours?.openNow || place.regularOpeningHours?.openNow,
    },
    photos: place.photos?.map((photo: any) => ({
      photo_reference: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=800&maxHeightPx=800`,
      height: photo.heightPx || 800,
      width: photo.widthPx || 800,
    })),
    types: place.types || [],
    business_status: place.businessStatus || 'OPERATIONAL',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5000, type = 'restaurant' } = await req.json();
    
    console.log(`Searching restaurants near (${latitude}, ${longitude}) with radius ${radius}m`);
    
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured');
    }
    
    // New Google Places API (v1) - searchNearby endpoint
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    
    const requestBody = {
      includedPrimaryTypes: ['restaurant'],  // More strict - only primary restaurants
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: radius,
        },
      },
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
    };
    
    console.log('Calling new Google Places API (v1)');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.regularOpeningHours,places.photos,places.types,places.businessStatus',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      throw new Error(`Google Places API error: ${response.status}`);
    }
    
    const data = await response.json();
    const places = data.places || [];
    
    console.log(`Found ${places.length} places from API`);
    
    // Filter to only actual restaurants (exclude hotels, spas, etc.)
    const actualRestaurants = places.filter(isActualRestaurant);
    
    console.log(`Filtered to ${actualRestaurants.length} actual restaurants`);
    
    // Transform to legacy format
    const transformedPlaces = actualRestaurants.map((place: any) => transformRestaurant(place, apiKey));
    
    return new Response(
      JSON.stringify({ data: transformedPlaces }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in google-places-restaurants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
