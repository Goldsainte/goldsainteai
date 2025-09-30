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
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();
  return data.access_token;
}

// Search for city code using Amadeus location API
async function findCityCode(location: string, token: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      keyword: location,
      subType: 'CITY',
      'page[limit]': '5'
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.log('Location search failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Location search results:', data.data?.length || 0);

    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Return the IATA code of the first city match
    return data.data[0].iataCode || null;
  } catch (error) {
    console.error('Error finding city code:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, checkIn, checkOut, guests } = await req.json();
    
    console.log('Amadeus hotel search request:', { location, checkIn, checkOut, guests });

    // Default dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const arrival = checkIn && String(checkIn).trim() !== '' ? checkIn : today.toISOString().split('T')[0];
    const departure = checkOut && String(checkOut).trim() !== '' ? checkOut : tomorrow.toISOString().split('T')[0];

    const token = await getAmadeusToken();

    // Dynamically find city code using Amadeus location API
    const cityCode = await findCityCode(location, token);
    
    if (!cityCode) {
      return new Response(JSON.stringify({ 
        results: [], 
        error: `Could not find city "${location}". Please try a different spelling or a nearby major city.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found city code for "${location}": ${cityCode}`);

    // Step 1: Get hotel IDs from Hotel List API
    console.log('Fetching hotel list for city:', cityCode);
    const hotelListResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!hotelListResponse.ok) {
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

    // Get first 15 hotel IDs
    const hotelIds = hotelListData.data.slice(0, 15).map((hotel: any) => hotel.hotelId).join(',');
    console.log('Fetching offers for hotel IDs');

    // Step 2: Get hotel offers with prices
    const offerParams = new URLSearchParams({
      hotelIds,
      checkInDate: arrival,
      checkOutDate: departure,
      adults: String(guests || 2),
      currency: 'USD',
      roomQuantity: '1',
      bestRateOnly: 'true'
    });

    const offersResponse = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!offersResponse.ok) {
      throw new Error(`Hotel offers fetch failed: ${offersResponse.statusText}`);
    }

    const offersData = await offersResponse.json();
    console.log('Hotel offers found:', offersData.data?.length || 0);

    // Transform Amadeus format to match expected property card format
    const transformedResults = (offersData.data || []).map((offer: any) => {
      const hotel = offer.hotel;
      const firstOffer = offer.offers?.[0];
      const price = firstOffer?.price;

      return {
        hotel_id: hotel.hotelId,
        property: {
          name: hotel.name,
          photoUrls: [], // Amadeus doesn't provide photos in this endpoint
          reviewScore: hotel.rating ? parseFloat(hotel.rating) : 0,
          reviewCount: 0,
          externalUrls: {
            default: `https://www.amadeus.com/hotel/${hotel.hotelId}` // placeholder
          }
        },
        location: `${hotel.cityCode}`,
        region: hotel.address?.cityName || location,
        cityCode: hotel.cityCode,
        price: price?.total ? parseFloat(price.total) : 0,
        priceBreakdown: {
          grossPrice: {
            value: price?.total ? parseFloat(price.total) : 0,
            currency: price?.currency || 'USD'
          }
        },
        accessibilityLabel: `${hotel.name}. ${hotel.address?.cityName || ''}. Current price ${price?.total || 0} ${price?.currency || 'USD'}`,
        // Keep full Amadeus data for booking
        amadeusOffer: offer
      };
    });

    return new Response(JSON.stringify({ 
      results: transformedResults,
      location: { name: location, dest_id: cityCode }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
