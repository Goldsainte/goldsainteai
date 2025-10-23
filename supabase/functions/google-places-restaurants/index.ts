const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Filter out non-restaurant places (hotels, spas, etc.)
function isActualRestaurant(place: any): boolean {
  const types = place.types || [];
  
  // Exclude specific non-restaurant types using EXACT matching
  const excludedTypes = ['lodging', 'spa', 'gym', 'hotel', 'motel', 'resort'];
  const hasExcludedType = types.some((t: string) => excludedTypes.includes(t.toLowerCase()));
  
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
    formatted_address: place.formattedAddress,
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
      weekday_text: place.regularOpeningHours?.weekdayDescriptions || place.currentOpeningHours?.weekdayDescriptions,
    },
    photos: place.photos?.map((photo: any) => ({
      photo_reference: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=800&maxHeightPx=800`,
      height: photo.heightPx || 800,
      width: photo.widthPx || 800,
    })),
    types: place.types || [],
    business_status: place.businessStatus || 'OPERATIONAL',
    formatted_phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber,
    website: place.websiteUri,
    editorialSummary: place.editorialSummary,
    generativeSummary: place.generativeSummary,
    primaryTypeDisplayName: place.primaryTypeDisplayName,
    // Service options
    servesBeer: place.servesBeer,
    servesWine: place.servesWine,
    servesBreakfast: place.servesBreakfast,
    servesLunch: place.servesLunch,
    servesDinner: place.servesDinner,
    servesBrunch: place.servesBrunch,
    servesVegetarianFood: place.servesVegetarianFood,
    takeout: place.takeout,
    delivery: place.delivery,
    dineIn: place.dineIn,
    // Features
    outdoorSeating: place.outdoorSeating,
    liveMusic: place.liveMusic,
    menuForChildren: place.menuForChildren,
    servesCocktails: place.servesCocktails,
    servesCoffee: place.servesCoffee,
    servesDessert: place.servesDessert,
    // Amenities
    restroom: place.restroom,
    goodForChildren: place.goodForChildren,
    goodForGroups: place.goodForGroups,
    allowsDogs: place.allowsDogs,
    // Accessibility, parking, payment
    accessibilityOptions: place.accessibilityOptions,
    parkingOptions: place.parkingOptions,
    paymentOptions: place.paymentOptions,
  };
}

Deno.serve(async (req) => {
  console.log('🚀 NEW VERSION WITH FILTERING - v2.0');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5000, type = 'restaurant', cuisine } = await req.json();
    
    console.log(`🔍 Searching restaurants near (${latitude}, ${longitude}) with radius ${radius}m${cuisine ? ` for ${cuisine} cuisine` : ''}`);
    
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured');
    }
    
    // If cuisine is specified, use text search instead of nearby search
    let url: string;
    let requestBody: any;
    
    if (cuisine) {
      // Use searchText endpoint for cuisine-specific searches
      url = 'https://places.googleapis.com/v1/places:searchText';
      requestBody = {
        textQuery: `${cuisine} restaurant`,
        locationBias: {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: radius,
          },
        },
        maxResultCount: 20,
      };
      console.log(`Calling text search for "${cuisine} restaurant"`);
    } else {
      // Use searchNearby endpoint for general searches
      url = 'https://places.googleapis.com/v1/places:searchNearby';
      requestBody = {
        includedPrimaryTypes: [
          'restaurant',
          'french_restaurant',
          'italian_restaurant',
          'japanese_restaurant',
          'chinese_restaurant',
          'indian_restaurant',
          'thai_restaurant',
          'mediterranean_restaurant',
          'middle_eastern_restaurant',
          'american_restaurant',
          'steak_house',
          'seafood_restaurant',
          'sushi_restaurant',
          'ramen_restaurant',
          'greek_restaurant',
          'lebanese_restaurant',
          'vegan_restaurant',
          'vegetarian_restaurant',
          'mexican_restaurant',
          'spanish_restaurant',
          'vietnamese_restaurant',
          'korean_restaurant',
          'turkish_restaurant',
          'brazilian_restaurant',
          'fine_dining_restaurant',
          'fast_food_restaurant',
          'sandwich_shop',
          'pizza_restaurant',
          'hamburger_restaurant',
          'brunch_restaurant',
          'bar',
          'cafe'
        ],
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
      console.log('Calling nearby search for all restaurants');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.regularOpeningHours,places.photos,places.types,places.businessStatus,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.editorialSummary,places.generativeSummary,places.primaryTypeDisplayName,places.servesBeer,places.servesWine,places.servesBreakfast,places.servesLunch,places.servesDinner,places.servesBrunch,places.servesVegetarianFood,places.takeout,places.delivery,places.dineIn,places.outdoorSeating,places.liveMusic,places.menuForChildren,places.servesCocktails,places.servesCoffee,places.servesDessert,places.restroom,places.goodForChildren,places.goodForGroups,places.allowsDogs,places.accessibilityOptions,places.parkingOptions,places.paymentOptions',
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
