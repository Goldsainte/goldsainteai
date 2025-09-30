import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromCountry, toCountry } = await req.json();
    
    console.log('Visa requirement check:', { fromCountry, toCountry });

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    // Using the Visa Requirements API from RapidAPI
    // You can find this at: https://rapidapi.com/ptwebsolution/api/visa-requirements
    const response = await fetch(
      `https://visa-requirements.p.rapidapi.com/visa-requirements`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'visa-requirements.p.rapidapi.com'
        },
        body: JSON.stringify({
          from: fromCountry,
          to: toCountry
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      throw new Error(`Visa check failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Visa requirement result:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in check-visa-requirements:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
