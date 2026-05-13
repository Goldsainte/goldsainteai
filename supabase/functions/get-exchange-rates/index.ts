import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseCurrency, targetCurrency } = await req.json();

    console.log(`Fetching exchange rate from ${baseCurrency} to ${targetCurrency}`);

    // Using exchangerate-api.com free tier (no API key required for basic usage)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.statusText}`);
    }

    const data = await response.json();

    const rate = data.rates[targetCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${targetCurrency}`);
    }

    console.log(`Exchange rate: 1 ${baseCurrency} = ${rate} ${targetCurrency}`);

    return new Response(
      JSON.stringify({ 
        baseCurrency,
        targetCurrency,
        rate,
        timestamp: data.time_last_updated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-exchange-rates function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
