const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getAmadeusToken = async () => {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });
  
  const data = await response.json();
  return data.access_token;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5, categories } = await req.json();
    
    console.log(`Searching restaurants near (${latitude}, ${longitude}) with radius ${radius}km`);
    
    const token = await getAmadeusToken();
    
    // Construct Amadeus POI search URL
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
      'categories': 'RESTAURANT',
    });
    
    // Add additional categories if provided
    if (categories && categories.length > 0) {
      categories.forEach((cat: string) => params.append('categories', cat));
    }
    
    const amadeusUrl = `https://test.api.amadeus.com/v1/reference-data/locations/pois?${params}`;
    console.log('Calling Amadeus:', amadeusUrl);
    
    const response = await fetch(amadeusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus API error:', errorText);
      throw new Error(`Amadeus API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} restaurants`);
    
    return new Response(
      JSON.stringify({ data: data.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in amadeus-topplace-restaurants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
