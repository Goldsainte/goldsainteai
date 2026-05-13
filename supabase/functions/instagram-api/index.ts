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
    const { endpoint, username, mediaId } = await req.json();
    const rapidApiKey = Deno.env.get('RAPIDAPI_INSTAGRAM_KEY');

    if (!rapidApiKey) {
      throw new Error('RapidAPI Instagram key not configured');
    }

    let url = '';
    
    // Build URL based on endpoint type
    switch (endpoint) {
      case 'user':
        url = `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`;
        break;
      case 'posts':
        url = `https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=${username}`;
        break;
      case 'followers':
        url = `https://instagram-scraper-api2.p.rapidapi.com/v1/followers?username_or_id_or_url=${username}`;
        break;
      case 'following':
        url = `https://instagram-scraper-api2.p.rapidapi.com/v1/following?username_or_id_or_url=${username}`;
        break;
      case 'media':
        url = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${mediaId}`;
        break;
      default:
        throw new Error('Invalid endpoint specified');
    }

    console.log('Fetching from Instagram API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram API error:', response.status, errorText);
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Instagram API response received');

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in instagram-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
