import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const { query } = await req.json();
    
    console.log('Search destinations request:', { query });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      clearTimeout(timeoutId);
      throw new Error('BOOKING_API_KEY not configured');
    }

    const response = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", results: [] }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Destination search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Destinations found:', data.data?.length || 0);

    return new Response(JSON.stringify({ results: data.data || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in search-destinations:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Request timed out. Please try again.", results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 408,
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});