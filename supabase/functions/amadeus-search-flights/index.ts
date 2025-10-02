import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCurrencyFromLocation } from "../_shared/currencyHelpers.ts";

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
    const { origin, destination, departureDate, returnDate, adults, travelClass = 'ECONOMY', cabinClass, nonStop = 'false', max = 20, includedAirlineCodes, destinationCity } = await req.json();
    
    // Support both parameter naming conventions
    const originLocationCode = origin;
    const destinationLocationCode = destination;
    const finalTravelClass = cabinClass || travelClass;
    
    // Determine currency from destination
    const currencyCode = destinationCity ? getCurrencyFromLocation(destinationCity) : 'USD';
    
    console.log('Flight search request:', { 
      originLocationCode, 
      destinationLocationCode, 
      departureDate, 
      returnDate,
      adults,
      currencyCode,
      includedAirlineCodes 
    });

    const token = await getAmadeusToken();

    // Build query parameters
    const params = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: adults.toString(),
      travelClass: finalTravelClass,
      nonStop,
      currencyCode,
      max: max.toString()
    });

    // Add return date if provided (round trip)
    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    // Add airline filters if provided (e.g., "AA,DL" for American and Delta)
    if (includedAirlineCodes) {
      params.append('includedAirlineCodes', includedAirlineCodes);
    }

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Amadeus flight search error:', error);
      throw new Error(`Flight search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Flights found:', data.data?.length || 0);

    return new Response(JSON.stringify({ 
      results: data.data || [],
      dictionaries: data.dictionaries,
      meta: data.meta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in amadeus-search-flights:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
