import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  ratings?: string[];
  amenities?: string[];
  priceRange?: string;
  currency?: string;
  max_total_price?: number;
}

interface NormalizedHotel {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    cityCode: string;
  };
  rating: number;
  price: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  images: string[];
  distance?: {
    value: number;
    unit: string;
  };
}

async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });

  if (!response.ok) {
    throw new Error('Failed to get Amadeus access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function getHotelMedia(token: string, hotelId: string): Promise<string[]> {
  try {
    const url = `https://api.amadeus.com/v2/shopping/hotel-offers/by-hotel?hotelIds=${hotelId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    const media = data.data?.[0]?.hotel?.media || [];
    
    return media
      .filter((m: any) => m.uri)
      .map((m: any) => m.uri)
      .slice(0, 5); // Limit to 5 images
  } catch (error) {
    console.error('Error fetching hotel media:', error);
    return [];
  }
}

async function searchHotelsAmadeus(
  token: string,
  params: HotelSearchParams,
  retryCount = 0
): Promise<NormalizedHotel[]> {
  const url = new URL('https://api.amadeus.com/v3/shopping/hotel-offers');
  
  url.searchParams.append('cityCode', params.cityCode);
  url.searchParams.append('checkInDate', params.checkInDate);
  url.searchParams.append('checkOutDate', params.checkOutDate);
  url.searchParams.append('adults', String(params.adults || 1));
  
  if (params.radius) {
    url.searchParams.append('radius', String(params.radius));
    url.searchParams.append('radiusUnit', params.radiusUnit || 'KM');
  }
  
  if (params.ratings?.length) {
    url.searchParams.append('ratings', params.ratings.join(','));
  }
  
  if (params.amenities?.length) {
    url.searchParams.append('amenities', params.amenities.join(','));
  }
  
  if (params.priceRange) {
    url.searchParams.append('priceRange', params.priceRange);
  }
  
  if (params.currency) {
    url.searchParams.append('currency', params.currency);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error('Amadeus API error:', response.status, await response.text());
    throw new Error(`Amadeus API error: ${response.status}`);
  }

  const data = await response.json();
  const hotels: NormalizedHotel[] = [];

  if (!data.data || data.data.length === 0) {
    // Zero results: retry once with broader parameters
    if (retryCount === 0) {
      console.log('No results found, retrying with broader parameters...');
      const broaderParams = { ...params };
      delete broaderParams.ratings;
      delete broaderParams.amenities;
      if (broaderParams.radius) {
        broaderParams.radius = Math.min((broaderParams.radius || 10) * 2, 50);
      }
      return searchHotelsAmadeus(token, broaderParams, 1);
    }
    return [];
  }

  // Normalize results and fetch images in parallel
  const hotelPromises = data.data.map(async (offer: any) => {
    const hotel = offer.hotel;
    const firstOffer = offer.offers?.[0];
    
    if (!firstOffer) return null;

    // Fetch images for this hotel
    const images = await getHotelMedia(token, hotel.hotelId);

    return {
      id: hotel.hotelId,
      name: hotel.name,
      location: {
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address?.lines?.join(', ') || '',
        cityCode: params.cityCode,
      },
      rating: hotel.rating || 0,
      price: {
        amount: parseFloat(firstOffer.price.total),
        currency: firstOffer.price.currency,
      },
      amenities: hotel.amenities || [],
      images,
      distance: hotel.distance ? {
        value: parseFloat(hotel.distance.value),
        unit: hotel.distance.unit,
      } : undefined,
    };
  });

  const resolvedHotels = await Promise.all(hotelPromises);
  hotels.push(...resolvedHotels.filter((h): h is NormalizedHotel => h !== null));

  // Apply server-side price filtering BEFORE sorting
  const currency = params.currency || 'USD';
  const maxPrice = params.max_total_price ?? Infinity;
  const filtered = hotels.filter(h => 
    h.price.currency === currency && h.price.amount <= maxPrice
  );
  
  console.log(`Filtered ${hotels.length} hotels to ${filtered.length} within budget (${maxPrice} ${currency})`);

  // Sort by: price ascending, then rating descending
  filtered.sort((a, b) => {
    const priceDiff = a.price.amount - b.price.amount;
    if (priceDiff !== 0) return priceDiff;
    return b.rating - a.rating;
  });

  return filtered;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const params: HotelSearchParams = await req.json();
    
    // Validate required fields
    if (!params.cityCode || !params.checkInDate || !params.checkOutDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: cityCode, checkInDate, checkOutDate' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching hotels with params:', params);
    
    const token = await getAmadeusToken();
    const hotels = await searchHotelsAmadeus(token, params);

    if (hotels.length === 0) {
      // Return top 3 alternative suggestions
      return new Response(
        JSON.stringify({
          results: [],
          suggestions: [
            'Try expanding your search radius',
            'Consider nearby cities or areas',
            'Adjust your check-in/check-out dates',
          ],
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ results: hotels }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-hotels:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
