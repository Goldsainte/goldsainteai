import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

async function generateSignature(apiKey: string, secret: string): Promise<{ signature: string; timestamp: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = apiKey + secret + timestamp;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { signature, timestamp };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1, max_total_price, currency = 'USD' } = await req.json();

    if (!destination || !checkIn || !checkOut) {
      throw new Error('Missing required parameters: destination, checkIn, checkOut');
    }

    const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
    const secret = Deno.env.get('HOTELBEDS_SECRET');
    const sandboxMode = Deno.env.get('HOTELBEDS_SANDBOX_MODE') === 'true';

    if (!apiKey || !secret) {
      throw new Error('HotelBeds API credentials not configured');
    }

    const { signature, timestamp } = await generateSignature(apiKey, secret);
    
    const baseUrl = sandboxMode 
      ? 'https://api.test.hotelbeds.com'
      : 'https://api.hotelbeds.com';

    const requestBody = {
      stay: {
        checkIn,
        checkOut
      },
      occupancies: [{
        rooms,
        adults,
        children
      }],
      destination: {
        code: destination
      }
    };

    const startTime = Date.now();
    console.log('HotelBeds API call started:', { destination, checkIn, checkOut, adults, rooms });

    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let response;
    try {
      response = await fetch(`${baseUrl}/hotel-api/1.0/hotels`, {
        method: 'POST',
        headers: {
          'Api-key': apiKey,
          'X-Signature': signature,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('HotelBeds API request timed out after 15 seconds');
        throw new Error('HotelBeds API request timed out');
      }
      console.error('HotelBeds API fetch error:', error);
      throw error;
    }

    const fetchDuration = Date.now() - startTime;
    console.log('HotelBeds API call completed:', {
      duration: `${fetchDuration}ms`,
      status: response.status
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HotelBeds API error:', response.status, errorText);
      throw new Error(`HotelBeds API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to consistent format - limit to first 100 hotels for performance
    const rawHotels = data.hotels?.hotels || [];
    console.log(`Processing ${rawHotels.length} hotels from HotelBeds (limiting to 100)`);
    
    const allHotels = rawHotels.slice(0, 100).map((hotel: any) => {
      const minRate = hotel.rooms?.[0]?.rates?.[0];
      return {
        hotelId: hotel.code,
        name: hotel.name,
        rating: parseFloat(hotel.categoryCode || '0'),
        location: {
          lat: hotel.latitude,
          lon: hotel.longitude,
          address: hotel.address?.content || '',
          city: hotel.destinationName,
          country: hotel.countryCode
        },
        price: minRate ? (minRate.net * 1.15) : 0, // 15% markup
        currency: minRate?.currency || 'USD',
        rooms: hotel.rooms || [],
        images: hotel.images?.map((img: any) => img.path) || [],
        amenities: hotel.facilities?.map((f: any) => f.description.content) || [],
        description: hotel.description?.content || '',
        source: 'hotelbeds',
        rateKey: minRate?.rateKey,
        boardCode: minRate?.boardCode
      };
    });

    // Apply server-side price filtering BEFORE returning results
    const maxPrice = max_total_price ?? Infinity;
    const hotels = allHotels.filter((h: any) => 
      h.currency === currency && h.price <= maxPrice
    );
    
    console.log(`Server-side filter: ${allHotels.length} -> ${hotels.length} hotels within ${maxPrice} ${currency}/night`);

    return new Response(
      JSON.stringify({ hotels, total: hotels.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in hotelbeds-search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, hotels: [] }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
