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

    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/availability/car-rental-offers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Amadeus car rental search error:', error);
      throw new Error(`Car rental search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Car rentals found:', data.data?.length || 0);

    return new Response(JSON.stringify({ 
      results: data.data || [],
      meta: data.meta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
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
