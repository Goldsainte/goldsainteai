import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCurrencyFromLocation } from "../_shared/currencyHelpers.ts";
import { validateHotelDates, validateNumericParam } from "../_shared/dateValidation.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rateLimiter.ts";

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
    
    // ⚠️ SECURITY: Rate limiting - 30 requests per 5 minutes per IP
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit({
      maxRequests: 30,
      windowMs: 5 * 60 * 1000, // 5 minutes
      identifier: clientId,
      endpoint: 'amadeus-search-hotels'
    });
    
    if (!rateLimit.allowed) {
      console.log('❌ [RATE LIMIT] Request blocked for:', clientId);
      return createRateLimitResponse(rateLimit, corsHeaders);
    }
    
    console.log(`✅ [RATE LIMIT] ${rateLimit.remaining} requests remaining`);
    
    // ⚠️ SECURITY: Server-side date validation
    console.log('🔒 [VALIDATION] Validating hotel dates:', { checkInDate, checkOutDate });
    const dateValidation = validateHotelDates(checkInDate, checkOutDate);
    if (!dateValidation.valid) {
      console.error('❌ [VALIDATION] Date validation failed:', dateValidation.error);
      return new Response(JSON.stringify({ 
        error: dateValidation.error,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // ⚠️ SECURITY: Validate adults parameter
    const adultsValidation = validateNumericParam(adults, 'adults', 1, 10);
    if (!adultsValidation.valid) {
      console.error('❌ [VALIDATION] Adults validation failed:', adultsValidation.error);
      return new Response(JSON.stringify({ 
        error: adultsValidation.error,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log('✅ [VALIDATION] All validations passed');
    
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

    // Apply 15% markup to all prices for consistency
    const MARKUP_PERCENTAGE = 15;
    
    // Filter to only include hotels with available offers and apply markup
    const availableHotels = (offersData.data || []).filter((hotel: any) => {
      const name = (hotel.hotel?.name || '').toLowerCase();
      const description = (hotel.offers?.[0]?.room?.description?.text || '').toLowerCase();
      const lat = hotel.hotel?.latitude || 0;
      const lon = hotel.hotel?.longitude || 0;
      
      // Exclude test hotels, demo hotels, "do not use" hotels, and fake coordinates
      const isTestHotel = /test|demo|do not use|sample|fake/i.test(name) || 
                          /test|demo|do not use|sample|fake/i.test(description) ||
                          (lat === 0 && lon === 0);
      
      return hotel.available === true && hotel.offers && hotel.offers.length > 0 && !isTestHotel;
    }).map((hotel: any) => {
      // Apply markup to each offer
      const updatedOffers = hotel.offers.map((offer: any) => {
        const basePrice = parseFloat(offer.price?.total || 0);
        const markedUpPrice = basePrice * (1 + MARKUP_PERCENTAGE / 100);
        
        return {
          ...offer,
          price: {
            ...offer.price,
            total: markedUpPrice.toFixed(2),
            base: basePrice.toFixed(2), // Store original price
          }
        };
      });
      
      return {
        ...hotel,
        offers: updatedOffers
      };
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
