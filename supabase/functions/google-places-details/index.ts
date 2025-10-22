import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,opening_hours,photos,types,formatted_phone_number,website,business_status&key=${googleApiKey}`;
    
    console.info(`Calling Google Places API: ${url.replace(googleApiKey, 'REDACTED')}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch place details',
          status: data.status,
          message: data.error_message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.result;
    console.info(`Found details for: ${result.name}`);

    return new Response(
      JSON.stringify({ data: result }),
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
