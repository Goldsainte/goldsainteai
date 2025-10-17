const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Amadeus access token');
  }

  const data = await tokenResponse.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityId } = await req.json();
    
    if (!activityId) {
      return new Response(
        JSON.stringify({ error: 'Activity ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching tour details for activity:', activityId);

    const accessToken = await getAmadeusToken();
    const url = `https://test.api.amadeus.com/v1/shopping/activities/${activityId}`;

    console.log('Calling Amadeus API:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus tour detail fetch failed:', response.status, errorText);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Tour not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Tours detail fetch failed: ${response.status} - ${errorText}`);
    }

    const tourData = await response.json();
    const tour = tourData.data;

    // Apply 15% markup to price
    if (tour.price?.amount) {
      const originalPrice = parseFloat(tour.price.amount);
      const markedUpPrice = (originalPrice * 1.15).toFixed(2);
      tour.price.amount = markedUpPrice;
    }

    console.log('Tour details fetched successfully');

    return new Response(
      JSON.stringify({ data: tour }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in amadeus-get-tour-details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
