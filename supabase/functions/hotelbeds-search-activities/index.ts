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
    const { destination, date, category } = await req.json();

    if (!destination || !date) {
      throw new Error('Missing required parameters: destination, date');
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
      from: date,
      to: date,
      destination: {
        code: destination
      },
      ...(category && { filters: { searchFilterItems: [{ type: 'category', value: category }] } })
    };

    console.log('HotelBeds activities search request:', { destination, date, category });

    const response = await fetch(`${baseUrl}/activity-content-api/3.0/activities`, {
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
      console.error('HotelBeds Activities API error:', response.status, errorText);
      throw new Error(`HotelBeds Activities API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to consistent format
    const activities = (data.activities || []).map((activity: any) => {
      const minModality = activity.modalities?.[0];
      return {
        code: activity.code,
        name: activity.name,
        description: activity.content?.description || '',
        category: activity.segmentation?.segments?.[0]?.name || 'Activity',
        location: {
          latitude: activity.geoLocation?.latitude,
          longitude: activity.geoLocation?.longitude,
          address: activity.country?.destinations?.[0]?.name || ''
        },
        duration: {
          value: activity.content?.duration?.value || 0,
          metric: activity.content?.duration?.metric || 'hours'
        },
        images: activity.content?.media?.images?.map((img: any) => img.urls?.[0]?.resource) || [],
        price: minModality?.rates?.[0]?.retailPrice?.amount || 0,
        currency: minModality?.rates?.[0]?.retailPrice?.currency || 'USD',
        languages: minModality?.languages || ['en'],
        source: 'hotelbeds'
      };
    });

    console.log(`Found ${activities.length} activities from HotelBeds`);

    return new Response(
      JSON.stringify({ activities, total: activities.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in hotelbeds-search-activities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, activities: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
