import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Amadeus access token
async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus auth error:', error);
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cityCode, checkInDate, checkOutDate, adults, radius = 5, radiusUnit = 'KM', currency = 'USD' } = await req.json();
    
    console.log('Hotel search request:', { cityCode, checkInDate, checkOutDate, adults });

    const token = await getAmadeusToken();

    // Build query parameters
    const params = new URLSearchParams({
      cityCode,
      radius: radius.toString(),
      radiusUnit,
      checkInDate,
      checkOutDate,
      adults: adults.toString(),
      currency,
      ratings: '3,4,5', // Only 3+ star hotels
      hotelSource: 'ALL'
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Amadeus hotel search error:', error);
      throw new Error(`Hotel search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Hotels found:', data.data?.length || 0);

    return new Response(JSON.stringify({ 
      results: data.data || [],
      meta: data.meta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in amadeus-search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
