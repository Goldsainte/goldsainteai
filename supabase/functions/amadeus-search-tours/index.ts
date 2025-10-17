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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });

  if (!response.ok) {
    console.error('Amadeus auth error:', response.status);
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
    const { latitude, longitude, radius = 5, categories, startDate, endDate } = await req.json();
    
    console.log('Amadeus tours search request:', { latitude, longitude, radius, categories });

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const token = await getAmadeusToken();

    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    if (categories && categories.length > 0) {
      categories.forEach((cat: string) => params.append('categories', cat));
    }

    console.log('Calling Amadeus API:', `https://test.api.amadeus.com/v1/shopping/activities?${params}`);

    // Search for tours and activities
    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/activities?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus tours search failed:', response.status, errorText);
      throw new Error(`Tours search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Amadeus tours found:', data.data?.length || 0);

    // Apply 15% markup to prices
    const toursWithMarkup = data.data?.map((tour: any) => {
      if (tour.price?.amount) {
        const baseAmount = parseFloat(tour.price.amount);
        const markedUpAmount = (baseAmount * 1.15).toFixed(2);
        return {
          ...tour,
          price: {
            ...tour.price,
            amount: markedUpAmount,
            baseAmount: tour.price.amount,
          }
        };
      }
      return tour;
    }) || [];

    return new Response(
      JSON.stringify({ 
        success: true,
        data: toursWithMarkup,
        meta: data.meta
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in amadeus-search-tours:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
