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
    const { hotelId, arrival_date, departure_date, currency, guests } = await req.json();
    
    console.log('📦 Get hotel details request:', { 
      hotelId, 
      arrival_date, 
      departure_date, 
      currency,
      guests 
    });

    const apiKey = Deno.env.get('BOOKING_API_KEY') || Deno.env.get('BOOKING_COM_RAPID_API_KEY');
    if (!apiKey) {
      throw new Error('Booking API key not configured. Set BOOKING_API_KEY or BOOKING_COM_RAPID_API_KEY.');
    }

    const currencyCode = currency || 'USD';
    const arrivalDate = arrival_date || '';
    const departureDate = departure_date || '';

    // Build query params for hotel details
    let queryParams = `hotel_id=${hotelId}&languagecode=en-us&currency_code=${currencyCode}`;
    if (arrivalDate && departureDate) {
      queryParams += `&arrival_date=${arrivalDate}&departure_date=${departureDate}`;
    }

    console.log('🔍 Fetching comprehensive hotel details with params:', queryParams);

    // Get hotel details from Booking.com API
    const detailsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails?${queryParams}`,
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
    
    console.log('✅ Hotel details retrieved successfully');
    console.log('📊 Available data fields:', Object.keys(hotelDetails.data || {}));

    // Extract comprehensive data
    const data = hotelDetails.data || {};
    
    // Build response with all available information
    const responseData = {
      hotelId: data.hotel_id || hotelId,
      name: data.hotel_name || data.name,
      description: data.description || data.hotel_description,
      address: data.address,
      city: data.city,
      country: data.country_trans,
      zip: data.zip,
      latitude: data.latitude,
      longitude: data.longitude,
      stars: data.class || data.hotel_class,
      rating: data.review_score,
      reviewCount: data.review_nr,
      reviewScoreWord: data.review_score_word,
      photos: data.photos || data.photo_urls || [],
      facilities: data.facilities || data.hotel_facilities || [],
      policies: {
        checkIn: data.checkin || data.checkin_from,
        checkOut: data.checkout || data.checkout_from,
        childrenPolicy: data.children_policy,
        petsPolicy: data.pets_policy,
        cancellationPolicy: data.cancellation_policy
      },
      rooms: data.rooms || [],
      nearbyPOIs: data.nearby_pois || [],
      url: data.url,
      deeplink_url: data.deeplink_url,
      // For booking deep-link construction
      bookingParams: {
        hotelId: data.hotel_id || hotelId,
        checkIn: arrivalDate,
        checkOut: departureDate,
        guests: guests || 2,
        currency: currencyCode
      }
    };

    return new Response(JSON.stringify({ 
      success: true,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in get-hotel-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
