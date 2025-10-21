import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCurrencyFromLocation } from "../_shared/currencyHelpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Get Amadeus access token with retry
async function getAmadeusToken(retries = 3): Promise<string> {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error(`Token attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
  
  throw new Error('Failed to get Amadeus token after retries');
}

// Search flights with Amadeus with retry logic
async function searchAmadeusFlights(params: any, token: string, retries = 2): Promise<any> {
  const queryParams = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
    travelClass: params.cabinClass || params.travelClass || 'ECONOMY',
    nonStop: params.nonStop || 'false',
    currencyCode: params.currencyCode || 'USD',
    max: (params.max || 250).toString()
  });

  if (params.returnDate) {
    queryParams.append('returnDate', params.returnDate);
  }

  if (params.includedAirlineCodes) {
    queryParams.append('includedAirlineCodes', params.includedAirlineCodes);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Amadeus search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        results: data.data || [],
        dictionaries: data.dictionaries,
        meta: data.meta
      };
    } catch (error) {
      console.error(`Amadeus search attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to search Amadeus flights after retries');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json();
    console.log('Unified flight search request:', params);
    
    const sortBy = params.sortBy || 'best_value'; // Extract sortBy parameter
    
    // Determine currency from destination
    const currencyCode = params.destinationCity 
      ? getCurrencyFromLocation(params.destinationCity) 
      : (params.currencyCode || 'USD');
    
    const searchParams = {
      ...params,
      currencyCode
    };

    // Check cache first
    const cacheKey = getCacheKey(searchParams);
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('Returning cached flight results');
      return new Response(JSON.stringify({ 
        ...cachedResult,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get token and search
    const token = await getAmadeusToken();
    const flightData = await searchAmadeusFlights(searchParams, token);
    
    console.log('Flights found:', flightData.results.length);

    // Apply 15% markup to all flight prices
    const MARKUP_PERCENTAGE = 15;
    const markedUpResults = flightData.results.map((flight: any) => {
      const basePrice = parseFloat(flight.price?.total || 0);
      const markedUpPrice = basePrice * (1 + MARKUP_PERCENTAGE / 100);
      
      // Calculate duration in minutes for ranking
      const segments = flight.itineraries?.[0]?.segments || [];
      const duration = segments.reduce((total: number, seg: any) => {
        const dur = seg.duration || '';
        const hours = parseInt(dur.match(/(\d+)H/)?.[1] || '0');
        const minutes = parseInt(dur.match(/(\d+)M/)?.[1] || '0');
        return total + (hours * 60) + minutes;
      }, 0);
      
      return {
        ...flight,
        price: {
          ...flight.price,
          total: markedUpPrice.toFixed(2),
          base: basePrice.toFixed(2), // Store original price
          grandTotal: markedUpPrice.toFixed(2)
        },
        duration,
        stops: Math.max(segments.length - 1, 0)
      };
    });

    // Rank flights using Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let rankedResults = markedUpResults;
    try {
      const { data: rankedData, error: rankError } = await supabaseClient.functions.invoke('rank-search-results', {
        body: {
          results: markedUpResults.map(f => ({
            ...f,
            price: parseFloat(f.price.total),
            rating: 4.0 // Default for flights
          })),
          sortBy: sortBy
        }
      });

      if (!rankError && rankedData?.results) {
        rankedResults = rankedData.results;
        console.log('Flights ranked successfully');
      } else if (rankError) {
        console.warn('Ranking error (non-blocking):', rankError);
      }
    } catch (rankErr) {
      console.warn('Failed to rank flights (non-blocking):', rankErr);
    }

    const responseData = {
      ...flightData,
      results: rankedResults
    };

    // Cache the result with markup
    setCache(cacheKey, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in unified-search-flights:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      results: [],
      dictionaries: {},
      meta: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
