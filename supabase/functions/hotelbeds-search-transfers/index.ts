import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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
    const { from, to, date, time = '12:00', passengers = 2, vehicleType } = await req.json();

    if (!from || !to || !date) {
      throw new Error('Missing required parameters: from, to, date');
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
      language: 'en',
      from: {
        type: from.type || 'IATA',
        code: from.code
      },
      to: {
        type: to.type || 'ATLAS',
        code: to.code
      },
      outbound: {
        date,
        time
      },
      occupancy: {
        adults: passengers,
        children: 0,
        infants: 0
      },
      ...(vehicleType && { vehicleType })
    };

    console.log('HotelBeds transfers search request:', { from, to, date, passengers });

    const response = await fetch(`${baseUrl}/transfer-api/1.0/availability/en/from/${from.type}/${from.code}/to/${to.type}/${to.code}/${date}/${time}/${passengers}/0/0`, {
      method: 'GET',
      headers: {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HotelBeds Transfers API error:', response.status, errorText);
      throw new Error(`HotelBeds Transfers API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to consistent format
    const transfers = (data.services || []).map((service: any) => {
      const minPrice = service.content?.rates?.[0];
      return {
        code: service.id,
        name: service.content?.name || 'Transfer Service',
        category: service.content?.category?.name || 'Private',
        vehicle: {
          type: service.content?.vehicleType || 'Sedan',
          maxPassengers: service.maxPaxCapacity || passengers,
          maxLuggage: service.content?.luggage || 0
        },
        price: {
          net: minPrice?.totalAmount?.amount || 0,
          total: (minPrice?.totalAmount?.amount || 0) * 1.15, // 15% markup
          currency: minPrice?.totalAmount?.currency || 'USD'
        },
        duration: service.content?.transferDetailInfo?.[0]?.transferDuration || 0,
        pickupInfo: service.content?.transferDetailInfo?.[0]?.pickupInformation || '',
        cancellationPolicy: {
          refundable: service.cancellationPolicies?.[0]?.refundable || false,
          policies: service.cancellationPolicies || []
        },
        source: 'hotelbeds',
        rateKey: service.rateKey
      };
    });

    console.log(`Found ${transfers.length} transfers from HotelBeds`);

    return new Response(
      JSON.stringify({ transfers, total: transfers.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in hotelbeds-search-transfers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, transfers: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
