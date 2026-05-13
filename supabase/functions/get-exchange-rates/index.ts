import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
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
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-exchange-rates function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
