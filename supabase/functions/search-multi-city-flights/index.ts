import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

interface FlightSegment {
  origin: string;
  destination: string;
  date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { segments, adults = 1, travelClass = 'ECONOMY' } = await req.json();
    
    console.log('Multi-city flight search:', { segments: segments?.length, adults, travelClass });

    if (!segments || !Array.isArray(segments) || segments.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Multi-city search requires at least 2 flight segments' 
      }), {
        status: 400,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Validate all segments have required fields
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg.origin || !seg.destination || !seg.date) {
        return new Response(JSON.stringify({ 
          error: `Segment ${i + 1} missing required fields (origin, destination, date)` 
        }), {
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
    }

    const token = await getAmadeusToken();

    // Build multi-city search request body
    const searchBody = {
      currencyCode: 'USD',
      originDestinations: segments.map((seg: FlightSegment) => ({
        id: segments.indexOf(seg) + 1,
        originLocationCode: seg.origin,
        destinationLocationCode: seg.destination,
        departureDateTimeRange: {
          date: seg.date
        }
      })),
      travelers: [
        {
          id: '1',
          travelerType: 'ADULT'
        }
      ],
      sources: ['GDS'],
      searchCriteria: {
        maxFlightOffers: 50,
        flightFilters: {
          cabinRestrictions: [
            {
              cabin: travelClass,
              coverage: 'MOST_SEGMENTS',
              originDestinationIds: segments.map((_: any, i: number) => (i + 1).toString())
            }
          ]
        }
      }
    };

    console.log('Amadeus multi-city search request:', JSON.stringify(searchBody, null, 2));

    const response = await fetch(
      'https://api.amadeus.com/v2/shopping/flight-offers',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to search multi-city flights',
        details: errorText
      }), {
        status: response.status,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const flightOffers = data.data || [];

    console.log(`✅ Found ${flightOffers.length} multi-city options`);

    // Calculate total duration and add metadata
    const enrichedOffers = flightOffers.map((offer: any) => {
      let totalDuration = 0;
      let totalStops = 0;

      offer.itineraries?.forEach((itinerary: any) => {
        // Parse duration (PT8H30M format)
        const duration = itinerary.duration || 'PT0M';
        const hoursMatch = duration.match(/(\d+)H/);
        const minutesMatch = duration.match(/(\d+)M/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        totalDuration += hours * 60 + minutes;

        // Count stops
        totalStops += (itinerary.segments?.length || 1) - 1;
      });

      return {
        ...offer,
        metadata: {
          totalDurationMinutes: totalDuration,
          totalDurationFormatted: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
          totalStops,
          segmentCount: segments.length,
          pricePerSegment: parseFloat(offer.price?.total || '0') / segments.length
        }
      };
    });

    // Sort by total price
    enrichedOffers.sort((a: any, b: any) => {
      const priceA = parseFloat(a.price?.total || '999999');
      const priceB = parseFloat(b.price?.total || '999999');
      return priceA - priceB;
    });

    const result = {
      segments,
      totalOptions: enrichedOffers.length,
      flights: enrichedOffers,
      cheapest: enrichedOffers[0],
      summary: {
        priceRange: enrichedOffers.length > 0 ? {
          min: parseFloat(enrichedOffers[0]?.price?.total || '0'),
          max: parseFloat(enrichedOffers[enrichedOffers.length - 1]?.price?.total || '0'),
          currency: enrichedOffers[0]?.price?.currency || 'USD'
        } : null
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Multi-city search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
