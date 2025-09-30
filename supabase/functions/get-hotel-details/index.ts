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
    const { hotelId } = await req.json();
    
    console.log('Get hotel details request:', { hotelId });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Get hotel details from Booking.com API
    const detailsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails?hotel_id=${hotelId}&languagecode=en-us&currency_code=USD`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!detailsResponse.ok) {
      throw new Error(`Hotel details fetch failed: ${detailsResponse.statusText}`);
    }

    const hotelDetails = await detailsResponse.json();
    console.log('Hotel details retrieved successfully');

    return new Response(JSON.stringify({ 
      success: true,
      data: hotelDetails.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-hotel-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
