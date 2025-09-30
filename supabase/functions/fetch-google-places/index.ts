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
    const body = await req.json();
    const { hotelName, latitude, longitude, query } = body;
    
    console.log('Fetching Google Places data for:', query || hotelName);

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured');
    }

    // Handle general location search (for cities, destinations)
    if (query) {
      // First, try the Find Place API for robust city/destination lookup
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,formatted_address,geometry,place_id,types&key=${apiKey}`;
      const findResp = await fetch(findUrl);
      const findData = await findResp.json();

      if (findData.candidates && findData.candidates.length > 0) {
        console.log('Found candidates via Find Place:', findData.candidates.length);
        return new Response(JSON.stringify({ 
          success: true,
          results: findData.candidates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Fallback to Text Search if Find Place yields nothing
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      const results = searchData.results || [];
      if (results.length === 0) {
        console.log('No place found for query:', query);
        return new Response(JSON.stringify({ 
          success: false,
          message: 'Location not found',
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle hotel details search (existing functionality)
    const searchQuery = `${hotelName} hotel`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${latitude},${longitude}&radius=500&type=lodging&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.log('No place found for:', hotelName);
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Hotel not found on Google Places'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const placeId = searchData.results[0].place_id;
    console.log('Found place ID:', placeId);

    // Step 2: Get place details including reviews and photos
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,photos&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsData.result) {
      throw new Error('Failed to fetch place details');
    }

    const place = detailsData.result;

    // Format reviews
    const reviews = (place.reviews || []).map((review: any) => ({
      id: review.time.toString(),
      author: review.author_name,
      rating: review.rating,
      date: new Date(review.time * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      comment: review.text,
      profilePhoto: review.profile_photo_url
    }));

    // Format photos - get photo URLs
    const photos = (place.photos || []).slice(0, 20).map((photo: any) => {
      // Get the highest resolution available
      const maxWidth = photo.width || 2000;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photo.photo_reference}&key=${apiKey}`;
    });

    console.log(`Found ${reviews.length} reviews and ${photos.length} photos`);

    return new Response(JSON.stringify({ 
      success: true,
      data: {
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        reviews,
        photos
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in fetch-google-places:', error);
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
