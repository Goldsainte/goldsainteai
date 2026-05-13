import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// Get Amadeus access token
async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
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

// Helper to add/subtract days from date
function adjustDate(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { origin, destination, preferredDepartDate, preferredReturnDate, adults = 1, dayRange = 3 } = await req.json();
    
    console.log('Date flexibility search:', { origin, destination, preferredDepartDate, dayRange });

    if (!origin || !destination || !preferredDepartDate) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: origin, destination, preferredDepartDate' 
      }), {
        status: 400,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const token = await getAmadeusToken();
    
    // Generate date variations (±dayRange days)
    const dateVariations = [];
    for (let i = -dayRange; i <= dayRange; i++) {
      const departDate = adjustDate(preferredDepartDate, i);
      const returnDate = preferredReturnDate ? adjustDate(preferredReturnDate, i) : null;
      
      // Only include future dates
      if (new Date(departDate) >= new Date()) {
        dateVariations.push({ departDate, returnDate, dayOffset: i });
      }
    }

    console.log(`Searching ${dateVariations.length} date combinations...`);

    // Search all date variations in parallel
    const searchPromises = dateVariations.map(async ({ departDate, returnDate, dayOffset }) => {
      try {
        const params = new URLSearchParams({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departDate,
          adults: adults.toString(),
          max: '5', // Get top 5 results per date
          currencyCode: 'USD'
        });

        if (returnDate) {
          params.append('returnDate', returnDate);
        }

        const response = await fetch(
          `https://api.amadeus.com/v2/shopping/flight-offers?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          console.error(`Failed search for ${departDate}:`, response.status);
          return null;
        }

        const data = await response.json();
        const flights = data.data || [];
        
        // Get cheapest flight for this date
        if (flights.length > 0) {
          const cheapest = flights.reduce((min: any, flight: any) => {
            const price = parseFloat(flight.price?.total || '999999');
            const minPrice = parseFloat(min.price?.total || '999999');
            return price < minPrice ? flight : min;
          });

          return {
            departDate,
            returnDate,
            dayOffset,
            cheapestPrice: parseFloat(cheapest.price?.total || '0'),
            currency: cheapest.price?.currency || 'USD',
            flight: cheapest,
            totalFlights: flights.length
          };
        }

        return null;
      } catch (error) {
        console.error(`Error searching date ${departDate}:`, error);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    const validResults = results.filter(r => r !== null);

    if (validResults.length === 0) {
      return new Response(JSON.stringify({
        error: 'No flights found for any date variations',
        searchedDates: dateVariations.map(d => d.departDate)
      }), {
        status: 404,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Find cheapest option
    const cheapest = validResults.reduce((min, current) => 
      current.cheapestPrice < min.cheapestPrice ? current : min
    );

    // Calculate price deltas from preferred date
    const preferredResult = validResults.find(r => r.dayOffset === 0);
    const preferredPrice = preferredResult?.cheapestPrice || cheapest.cheapestPrice;

    const comparison = validResults.map(result => ({
      departDate: result.departDate,
      returnDate: result.returnDate,
      dayOffset: result.dayOffset,
      price: result.cheapestPrice,
      currency: result.currency,
      priceDelta: result.cheapestPrice - preferredPrice,
      savingsPercent: preferredPrice > 0 ? 
        ((preferredPrice - result.cheapestPrice) / preferredPrice * 100).toFixed(1) : '0',
      isPreferredDate: result.dayOffset === 0,
      isCheapest: result.cheapestPrice === cheapest.cheapestPrice,
      flight: result.flight
    }));

    // Sort by date
    comparison.sort((a, b) => a.dayOffset - b.dayOffset);

    const summary = {
      origin,
      destination,
      preferredDepartDate,
      preferredReturnDate,
      dayRange,
      totalOptionsFound: validResults.length,
      cheapestOption: {
        departDate: cheapest.departDate,
        returnDate: cheapest.returnDate,
        price: cheapest.cheapestPrice,
        dayOffset: cheapest.dayOffset,
        savings: preferredPrice - cheapest.cheapestPrice
      },
      preferredDatePrice: preferredPrice,
      comparison
    };

    console.log(`✅ Found ${validResults.length} date options. Cheapest: $${cheapest.cheapestPrice} on ${cheapest.departDate}`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Date flexibility comparison error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
