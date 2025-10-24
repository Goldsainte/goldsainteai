import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = await req.json();

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

    console.log('HotelBeds hotel search request:', { destination, checkIn, checkOut, adults });

    const response = await fetch(`${baseUrl}/hotel-api/1.0/hotels`, {
      method: 'POST',
      headers: {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HotelBeds API error:', response.status, errorText);
      throw new Error(`HotelBeds API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to consistent format
    const hotels = (data.hotels?.hotels || []).map((hotel: any) => {
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

    console.log(`Found ${hotels.length} hotels from HotelBeds`);

    return new Response(
      JSON.stringify({ hotels, total: hotels.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in hotelbeds-search-hotels:', error);
    return new Response(
      JSON.stringify({ error: error.message, hotels: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
