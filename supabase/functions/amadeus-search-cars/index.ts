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
    const { pickupLocation, pickupDate, dropoffDate, dropoffLocation, currencyCode = 'USD' } = await req.json();
    
    console.log('Car rental search request:', { 
      pickupLocation, 
      pickupDate, 
      dropoffDate,
      dropoffLocation 
    });

    const token = await getAmadeusToken();

    // Normalize locations to IATA airport codes
    const getAirportCode = (location: string) => {
      if (/^[A-Z]{3}$/i.test((location || '').trim())) return location.toUpperCase();
      const map: Record<string, string> = {
        'new york': 'JFK','los angeles': 'LAX','san francisco': 'SFO','washington': 'IAD','chicago': 'ORD','miami': 'MIA',
        'boston': 'BOS','seattle': 'SEA','atlanta': 'ATL','denver': 'DEN','las vegas': 'LAS','phoenix': 'PHX',
        'dallas': 'DFW','houston': 'IAH','detroit': 'DTW','minneapolis': 'MSP','orlando': 'MCO','philadelphia': 'PHL',
        'nashville': 'BNA','salt lake city': 'SLC','charlotte': 'CLT','paris': 'CDG','london': 'LHR','tokyo': 'NRT',
        'dubai': 'DXB','singapore': 'SIN','hong kong': 'HKG'
      };
      const key = (location || '').toLowerCase().trim();
      return map[key] || key.slice(0,3).toUpperCase();
    };

    const pickupCode = getAirportCode(pickupLocation);
    const dropoffCode = dropoffLocation ? getAirportCode(dropoffLocation) : pickupCode;

    // Add default times (10:00) to satisfy Amadeus requirements
    const pickupDateTime = `${pickupDate}T10:00:00`;
    const returnDateTime = `${dropoffDate}T10:00:00`;

    // Build query parameters
    const params = new URLSearchParams({
      pickupLocation: pickupCode,
      pickupDateTime,
      returnDateTime,
      currencyCode
    });

    // Add dropoff location if different from pickup
    if (dropoffCode && dropoffCode !== pickupCode) {
      params.append('dropoffLocation', dropoffCode);
    }

    // Helper to perform the API call for a given pickup code
    const tryFetch = async (code: string) => {
      const p = new URLSearchParams({
        pickupLocation: code,
        pickupDateTime,
        returnDateTime,
        currencyCode
      });
      if (dropoffCode && dropoffCode !== code) {
        p.append('dropoffLocation', dropoffCode);
      }
      const res = await fetch(
        `https://test.api.amadeus.com/v1/shopping/availability/car-rental-offers?${p}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Amadeus car rental search error:', errorText);
        return { ok: false as const, data: null };
      }
      const json = await res.json();
      return { ok: true as const, data: json };
    };

    // Try the requested pickup first
    let attempt = await tryFetch(pickupCode);
    if (attempt.ok && attempt.data?.data?.length) {
      console.log('Car rentals found:', attempt.data.data.length);
      return new Response(JSON.stringify({
        results: attempt.data.data || [],
        meta: { ...(attempt.data.meta || {}), pickupUsed: pickupCode }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fallback: try popular airports known to have sandbox data
    const fallbackAirports = ['JFK', 'LAX', 'LHR', 'CDG', 'DXB', 'SFO', 'MIA'];
    for (const fb of fallbackAirports) {
      attempt = await tryFetch(fb);
      if (attempt.ok && attempt.data?.data?.length) {
        console.log('Car rentals fallback used:', fb, 'count:', attempt.data.data.length);
        return new Response(JSON.stringify({
          results: attempt.data.data || [],
          meta: { ...(attempt.data.meta || {}), pickupUsed: fb, fallbackUsed: true }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Nothing found anywhere
    return new Response(JSON.stringify({
      error: 'Car rental search failed for provided airport and common fallbacks.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Error in amadeus-search-cars:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
