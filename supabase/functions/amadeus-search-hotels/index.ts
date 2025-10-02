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

// Fetch with timeout helper to avoid long waits
async function fetchWithTimeout(input: any, init: any = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cityCode, checkInDate, checkOutDate, adults = 1, cityName } = await req.json();
    
    // Determine currency from city
    const currency = cityName ? getCurrencyFromLocation(cityName) : getCurrencyFromLocation(cityCode);
    
    console.log('Hotel search request:', { cityCode, checkInDate, checkOutDate, adults, currency });

    const token = await getAmadeusToken();

    // Step 1: Get hotel IDs from Hotel List API
    console.log('Fetching hotel list for city:', cityCode);
    const hotelListParams = new URLSearchParams({
      cityCode
    });

    const hotelListResponse = await fetchWithTimeout(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?${hotelListParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      },
      12000
    );

    if (!hotelListResponse.ok) {
      const error = await hotelListResponse.text();
      console.error('Hotel List API error:', error);
      throw new Error(`Hotel list fetch failed: ${hotelListResponse.statusText}`);
    }

    const hotelListData = await hotelListResponse.json();
    console.log('Hotels found in city:', hotelListData.data?.length || 0);

    if (!hotelListData.data || hotelListData.data.length === 0) {
      return new Response(JSON.stringify({ 
        results: [],
        message: 'No hotels found in this city'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get first 200 hotel IDs for comprehensive filtering
    const hotelIds = hotelListData.data.slice(0, 200).map((hotel: any) => hotel.hotelId).join(',');
    console.log('Fetching offers for hotel IDs');

    // Step 2: Get hotel offers with prices
    const offerParams = new URLSearchParams({
      hotelIds,
      checkInDate,
      checkOutDate,
      adults: adults.toString(),
      currency,
      roomQuantity: '1',
      bestRateOnly: 'true'
    });

    const offersResponse = await fetchWithTimeout(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      },
      15000
    );

    if (!offersResponse.ok) {
      const error = await offersResponse.text();
      console.error('Hotel offers API error:', error);
      throw new Error(`Hotel offers fetch failed: ${offersResponse.statusText}`);
    }

    const offersData = await offersResponse.json();
    console.log('Hotel offers found:', offersData.data?.length || 0);

    // Filter to only include hotels with available offers
    const availableHotels = (offersData.data || []).filter((hotel: any) => {
      const name = hotel.hotel?.name || '';
      const lat = hotel.hotel?.latitude;
      const lon = hotel.hotel?.longitude;
      const looksFake = /test/i.test(name) || (lat === 0 && lon === 0);
      return hotel.available === true && hotel.offers && hotel.offers.length > 0 && !looksFake;
    });

    console.log('Available hotels after filtering:', availableHotels.length);

    return new Response(JSON.stringify({ 
      results: availableHotels,
      meta: offersData.meta
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
