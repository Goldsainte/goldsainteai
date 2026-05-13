import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceRateLimit } from "../_utils/rate-limit.ts";
import { buildSafeErrorResponse } from "../_shared/httpError.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAmadeusToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  const AMADEUS_API_KEY = Deno.env.get('AMADEUS_API_KEY');
  const AMADEUS_API_SECRET = Deno.env.get('AMADEUS_API_SECRET');

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    throw new Error('Amadeus credentials not configured');
  }

  const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get Amadeus token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = now + (tokenData.expires_in * 1000) - 60000; // Refresh 1 min early
  
  console.log('✅ Amadeus token obtained');
  return cachedToken || '';
}

async function searchFlights(params: any, token: string) {
  const { origin, destination, depart_date, return_date, adults = 1, cabin = 'ECONOMY' } = params;

  const url = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers');
  url.searchParams.set('originLocationCode', origin);
  url.searchParams.set('destinationLocationCode', destination);
  url.searchParams.set('departureDate', depart_date);
  if (return_date) url.searchParams.set('returnDate', return_date);
  url.searchParams.set('adults', adults.toString());
  url.searchParams.set('travelClass', cabin);
  url.searchParams.set('max', '5');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Amadeus flights API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    type: 'cards',
    section: 'Flights',
    cards: (data.data || []).slice(0, 5).map((offer: any) => {
      const outbound = offer.itineraries[0].segments[0];
      const carrier = outbound.carrierCode;
      const departure = new Date(outbound.departure.at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      const arrival = new Date(outbound.arrival.at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      const stops = offer.itineraries[0].segments.length - 1;
      
      return {
        id: offer.id,
        title: `${carrier} • ${origin} → ${destination}`,
        subtitle: `${stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`} • ${departure} → ${arrival}`,
        price: `$${offer.price.total}`,
        cta: {
          label: 'View Details',
          url: `https://www.google.com/travel/flights?q=${origin}%20to%20${destination}`
        }
      };
    })
  };
}

async function searchHotels(params: any, token: string) {
  const { city, check_in, check_out, guests = 1 } = params;

  // First, get hotels by city
  const cityUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city');
  cityUrl.searchParams.set('cityCode', city);

  const cityResponse = await fetch(cityUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!cityResponse.ok) {
    throw new Error(`Amadeus hotels API error: ${cityResponse.status}`);
  }

  const cityData = await cityResponse.json();
  const hotelIds = (cityData.data || []).slice(0, 5).map((h: any) => h.hotelId).join(',');

  if (!hotelIds) {
    return { type: 'cards', section: 'Hotels', cards: [] };
  }

  // Get hotel offers
  const offersUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers');
  offersUrl.searchParams.set('hotelIds', hotelIds);
  offersUrl.searchParams.set('checkInDate', check_in);
  offersUrl.searchParams.set('checkOutDate', check_out);
  offersUrl.searchParams.set('adults', guests.toString());

  const offersResponse = await fetch(offersUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!offersResponse.ok) {
    throw new Error(`Amadeus hotel offers API error: ${offersResponse.status}`);
  }

  const offersData = await offersResponse.json();

  return {
    type: 'cards',
    section: 'Hotels',
    cards: (offersData.data || []).slice(0, 5).map((hotel: any) => {
      const offer = hotel.offers?.[0];
      const price = offer?.price?.total || 'N/A';
      
      return {
        id: hotel.hotel.hotelId,
        title: hotel.hotel.name,
        subtitle: `${hotel.hotel.cityName || city} • ${check_in} to ${check_out}`,
        price: price !== 'N/A' ? `$${price}` : price,
        cta: {
          label: 'View Hotel',
          url: `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotel.hotel.name)}`
        }
      };
    })
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // 🔒 Rate limiting
  const limited = await enforceRateLimit({
    keyType: "api",
    req,
    corsHeaders: corsHeaders(req),
  });
  if (limited) return limited;

  try {
    const { type, ...params } = await req.json();
    
    console.log(`🔍 Amadeus proxy: ${type}`, params);

    const token = await getAmadeusToken();

    let result;
    if (type === 'flights') {
      result = await searchFlights(params, token);
    } else if (type === 'hotels') {
      result = await searchHotels(params, token);
    } else {
      throw new Error(`Unknown type: ${type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return buildSafeErrorResponse("amadeus-proxy", error, corsHeaders(req));
  }
});
