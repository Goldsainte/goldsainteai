import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Transform new API response to legacy format for frontend compatibility
function transformPlaceDetails(place: any, apiKey: string): any {
  return {
    place_id: place.id,
    name: place.displayName?.text || place.name || '',
    vicinity: place.formattedAddress || '',
    formatted_address: place.formattedAddress || '',
    geometry: {
      location: {
        lat: place.location?.latitude,
        lng: place.location?.longitude,
      },
    },
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: place.priceLevel,
    opening_hours: place.currentOpeningHours ? {
      open_now: place.currentOpeningHours.openNow,
      weekday_text: place.currentOpeningHours.weekdayDescriptions,
    } : (place.regularOpeningHours ? {
      open_now: place.regularOpeningHours.openNow,
      weekday_text: place.regularOpeningHours.weekdayDescriptions,
    } : undefined),
    photos: place.photos?.map((photo: any) => ({
      photo_reference: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=800&maxHeightPx=800`,
      height: photo.heightPx || 800,
      width: photo.widthPx || 800,
    })),
    types: place.types || [],
    business_status: place.businessStatus || 'OPERATIONAL',
    formatted_phone_number: place.internationalPhoneNumber || place.nationalPhoneNumber,
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
    // Reviews
    reviews: place.reviews?.map((review: any) => ({
      author_name: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating,
      text: review.text?.text || review.originalText?.text || '',
      time: review.publishTime,
      relative_time_description: review.relativePublishTimeDescription,
    })) || [],
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId } = await req.json();

    if (!placeId) {
      console.error('Missing placeId parameter');
      return new Response(
        JSON.stringify({ error: 'placeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`Fetching details for place_id: ${placeId}`);

    // New Google Places API (v1) - Get Place endpoint
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    console.info(`Calling new Google Places API (v1)`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,currentOpeningHours,regularOpeningHours,photos,types,internationalPhoneNumber,nationalPhoneNumber,websiteUri,businessStatus,editorialSummary,reviews,generativeSummary,primaryTypeDisplayName,servesBeer,servesWine,servesBreakfast,servesLunch,servesDinner,servesBrunch,servesVegetarianFood,takeout,delivery,dineIn,outdoorSeating,liveMusic,menuForChildren,servesCocktails,servesCoffee,servesDessert,restroom,goodForChildren,goodForGroups,allowsDogs,accessibilityOptions,parkingOptions,paymentOptions',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch place details',
          status: response.status,
          message: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const place = await response.json();
    console.info(`Found details for: ${place.displayName?.text || place.name}`);

    // Transform to legacy format
    const transformedPlace = transformPlaceDetails(place, googleApiKey);

    return new Response(
      JSON.stringify({ data: transformedPlace }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-places-details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
