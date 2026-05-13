import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

interface NormalizedFlight {
  id: string;
  price: {
    amount: number;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    fareOption: string;
    travelerType: string;
    price: {
      amount: number;
      currency: string;
    };
  }>;
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

async function searchFlightsAmadeus(
  token: string,
  params: FlightSearchParams,
  retryCount = 0
): Promise<NormalizedFlight[]> {
  const url = new URL('https://api.amadeus.com/v2/shopping/flight-offers');
  
  url.searchParams.append('originLocationCode', params.originLocationCode);
  url.searchParams.append('destinationLocationCode', params.destinationLocationCode);
  url.searchParams.append('departureDate', params.departureDate);
  url.searchParams.append('adults', String(params.adults || 1));
  
  if (params.returnDate) {
    url.searchParams.append('returnDate', params.returnDate);
  }
  
  if (params.children) {
    url.searchParams.append('children', String(params.children));
  }
  
  if (params.infants) {
    url.searchParams.append('infants', String(params.infants));
  }
  
  if (params.travelClass) {
    url.searchParams.append('travelClass', params.travelClass);
  }
  
  if (params.nonStop !== undefined) {
    url.searchParams.append('nonStop', String(params.nonStop));
  }
  
  if (params.currencyCode) {
    url.searchParams.append('currencyCode', params.currencyCode);
  }
  
  if (params.maxPrice) {
    url.searchParams.append('maxPrice', String(params.maxPrice));
  }
  
  url.searchParams.append('max', String(params.max || 50));

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

  if (!data.data || data.data.length === 0) {
    // Zero results: retry once with broader parameters
    if (retryCount === 0) {
      console.log('No results found, retrying with broader parameters...');
      const broaderParams = { ...params };
      broaderParams.nonStop = false;
      delete broaderParams.travelClass;
      delete broaderParams.maxPrice;
      return searchFlightsAmadeus(token, broaderParams, 1);
    }
    return [];
  }

  // Normalize and sort results
  const flights: NormalizedFlight[] = data.data.map((offer: any) => ({
    id: offer.id,
    price: {
      amount: parseFloat(offer.price.total),
      currency: offer.price.currency,
    },
    itineraries: offer.itineraries,
    validatingAirlineCodes: offer.validatingAirlineCodes,
    travelerPricings: offer.travelerPricings,
  }));

  // Sort by: price ascending, then duration ascending
  flights.sort((a, b) => {
    const priceDiff = a.price.amount - b.price.amount;
    if (priceDiff !== 0) return priceDiff;
    
    const durationA = a.itineraries.reduce((sum, it) => {
      const match = it.duration.match(/PT(\d+)H(\d+)M/);
      return sum + (match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0);
    }, 0);
    
    const durationB = b.itineraries.reduce((sum, it) => {
      const match = it.duration.match(/PT(\d+)H(\d+)M/);
      return sum + (match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0);
    }, 0);
    
    return durationA - durationB;
  });

  return flights;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const params: FlightSearchParams = await req.json();
    
    // Validate required fields
    if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate' 
        }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching flights with params:', params);
    
    const token = await getAmadeusToken();
    const flights = await searchFlightsAmadeus(token, params);

    if (flights.length === 0) {
      // Return top 3 alternative suggestions
      return new Response(
        JSON.stringify({
          results: [],
          suggestions: [
            'Try adjusting your travel dates by a few days',
            'Consider nearby airports for departure or arrival',
            'Remove travel class restrictions for more options',
          ],
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ results: flights }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-flights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
