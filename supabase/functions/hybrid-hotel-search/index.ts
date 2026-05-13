import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCurrencyFromLocation } from "../_shared/currencyHelpers.ts";
import { validateHotelDates, validateNumericParam } from "../_shared/dateValidation.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, getUserTier, getTieredRateLimit, type SubscriptionTier } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

const EXPEDIA_API_KEY = Deno.env.get("EXPEDIA_API_KEY");
const EXPEDIA_API_SECRET = Deno.env.get("EXPEDIA_API_SECRET");

// Get Amadeus access token
async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
  });

  if (!response.ok) throw new Error('Failed to authenticate with Amadeus');
  const data = await response.json();
  return data.access_token;
}

// Fetch with timeout helper
async function fetchWithTimeout(input: any, init: any = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

// Search Expedia for photos and reviews
async function enrichWithExpedia(hotelName: string, cityName: string, checkIn: string, checkOut: string) {
  if (!EXPEDIA_API_KEY || !EXPEDIA_API_SECRET) {
    console.log('Expedia credentials not configured, skipping enrichment');
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = EXPEDIA_API_KEY + EXPEDIA_API_SECRET + timestamp;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(EXPEDIA_API_SECRET);
    const messageData = encoder.encode(stringToSign);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const url = new URL("https://api.ean.com/v3/properties/availability");
    url.searchParams.append("location", cityName);
    url.searchParams.append("checkin", checkIn);
    url.searchParams.append("checkout", checkOut);
    url.searchParams.append("occupancy", "2");
    url.searchParams.append("sales_channel", "website");
    url.searchParams.append("sales_environment", "hotel_only");

    const response = await fetchWithTimeout(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `EAN apikey=${EXPEDIA_API_KEY},signature=${signature},timestamp=${timestamp}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }, 8000);

    if (!response.ok) return null;

    const data = await response.json();
    
    // Find matching hotel by name similarity
    const normalizedSearchName = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchingHotel = (data.properties || []).find((prop: any) => {
      const propName = (prop.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return propName.includes(normalizedSearchName) || normalizedSearchName.includes(propName);
    });

    if (matchingHotel) {
      return {
        images: matchingHotel.images?.map((img: any) => img.links?.['1000px']?.href).filter(Boolean) || [],
        reviews: {
          score: matchingHotel.guest_rating?.overall || 0,
          count: matchingHotel.guest_rating?.count || 0
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Error enriching with Expedia:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { cityCode, checkInDate, checkOutDate, adults = 1, cityName, max_total_price, currency: requestCurrency } = await req.json();
    
    // Rate limiting
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    let tier: SubscriptionTier = 'unauthenticated';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (user) {
          userId = user.id;
          tier = await getUserTier(userId);
        }
      } catch (error) {
        console.log('Failed to authenticate user');
      }
    }
    
    const clientId = getClientIdentifier(req, userId);
    const limits = getTieredRateLimit(tier, 'hybrid-hotel-search');
    
    const rateLimit = await checkRateLimit({
      ...limits,
      identifier: clientId,
      endpoint: 'hybrid-hotel-search',
      tier
    });
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, corsHeaders);
    }
    
    // Validate dates
    const dateValidation = validateHotelDates(checkInDate, checkOutDate);
    if (!dateValidation.valid) {
      return new Response(JSON.stringify({ 
        error: dateValidation.error,
        results: []
      }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const adultsValidation = validateNumericParam(adults, 'adults', 1, 10);
    if (!adultsValidation.valid) {
      return new Response(JSON.stringify({ 
        error: adultsValidation.error,
        results: []
      }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const currency = requestCurrency || (cityName ? getCurrencyFromLocation(cityName) : getCurrencyFromLocation(cityCode));
    
    console.log('Hybrid hotel search:', { cityCode, checkInDate, checkOutDate, adults, currency });

    const token = await getAmadeusToken();

    // Step 1: Get hotel IDs from Amadeus
    const hotelListParams = new URLSearchParams({ cityCode });
    const hotelListResponse = await fetchWithTimeout(
      `https://api.amadeus.com/v1/reference-data/locations/hotels/by-city?${hotelListParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } },
      12000
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
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get first 100 hotel IDs
    const hotelIds = hotelListData.data.slice(0, 100).map((hotel: any) => hotel.hotelId).join(',');

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
      `https://api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } },
      15000
    );

    if (!offersResponse.ok) {
      throw new Error(`Hotel offers fetch failed: ${offersResponse.statusText}`);
    }

    const offersData = await offersResponse.json();
    console.log('Hotel offers found:', offersData.data?.length || 0);

    const MARKUP_PERCENTAGE = 15;
    
    // Filter available hotels
    const availableHotels = (offersData.data || []).filter((hotel: any) => {
      const name = (hotel.hotel?.name || '').toLowerCase();
      const lat = hotel.hotel?.latitude || 0;
      const lon = hotel.hotel?.longitude || 0;
      
      const isTestHotel = /test|demo|do not use|sample|fake/i.test(name) || (lat === 0 && lon === 0);
      return hotel.available === true && hotel.offers && hotel.offers.length > 0 && !isTestHotel;
    });

    console.log('Available hotels after filtering:', availableHotels.length);

    // Step 3: Enrich with Expedia data (photos and reviews) in parallel
    const enrichedHotels = await Promise.all(
      availableHotels.slice(0, 30).map(async (hotel: any) => {
        const hotelName = hotel.hotel?.name || '';
        
        // Try to get Expedia data for photos and reviews
        const expediaData = await enrichWithExpedia(hotelName, cityName || cityCode, checkInDate, checkOutDate);
        
        // Apply markup
        const updatedOffers = hotel.offers.map((offer: any) => {
          const basePrice = parseFloat(offer.price?.total || 0);
          const markedUpPrice = basePrice * (1 + MARKUP_PERCENTAGE / 100);
          
          return {
            ...offer,
            price: {
              ...offer.price,
              total: markedUpPrice.toFixed(2),
              base: basePrice.toFixed(2),
            }
          };
        });
        
        return {
          ...hotel,
          offers: updatedOffers,
          // Add Expedia images if available
          images: expediaData?.images || [],
          image: expediaData?.images?.[0] || null,
          // Add Expedia reviews if available
          reviewScore: expediaData?.reviews?.score || 0,
          reviewCount: expediaData?.reviews?.count || 0,
          hasExpediaData: !!expediaData
        };
      })
    );

    // Filter by price
    const maxPrice = max_total_price ?? Infinity;
    const filteredByPrice = enrichedHotels.filter((hotel: any) => {
      const firstOffer = hotel.offers?.[0];
      if (!firstOffer) return false;
      const priceWithMarkup = parseFloat(firstOffer.price?.total || 0);
      const priceCurrency = firstOffer.price?.currency || currency;
      return priceCurrency === currency && priceWithMarkup <= maxPrice;
    });
    
    console.log(`Final results: ${filteredByPrice.length} hotels (${filteredByPrice.filter((h: any) => h.hasExpediaData).length} with Expedia photos/reviews)`);

    return new Response(JSON.stringify({ 
      results: filteredByPrice,
      meta: {
        ...offersData.meta,
        enrichedCount: filteredByPrice.filter((h: any) => h.hasExpediaData).length
      }
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in hybrid-hotel-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
