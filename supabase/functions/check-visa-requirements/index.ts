import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromCountry, toCountry } = await req.json();
    
    console.log('Visa requirement check:', { fromCountry, toCountry });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Use OpenAI to get accurate, current visa information
    const prompt = `Check the current visa requirements for travelers from ${fromCountry} to ${toCountry}. 

Provide accurate, up-to-date information including:
1. Whether a visa is required (yes/no/visa on arrival/eVisa)
2. The specific visa type(s) available
3. Typical fees (in USD if possible)
4. Processing time
5. Any important notes or requirements

Be specific and accurate. For countries like Indonesia/Bali, note that US citizens typically need a visa on arrival or can get an eVisa.

Format your response as JSON with this structure:
{
  "required": boolean,
  "visaType": string (e.g., "Visa on Arrival", "eVisa", "Tourist Visa"),
  "fee": string (e.g., "$35 USD"),
  "processingTime": string,
  "notes": string,
  "officialSource": string (government website URL if available)
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'You are a visa requirements expert. Provide accurate, current information about visa requirements between countries. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`Visa check failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const visaInfo = JSON.parse(aiResponse.choices[0].message.content);
    
    console.log('Visa requirement result:', visaInfo);

    return new Response(JSON.stringify(visaInfo), {
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
