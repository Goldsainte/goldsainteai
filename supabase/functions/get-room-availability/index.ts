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
    const { hotelId, checkIn, checkOut, guests, rooms, currency } = await req.json();
    
    console.log('🛏️ Get room availability request:', { 
      hotelId, 
      checkIn, 
      checkOut, 
      guests,
      rooms,
      currency 
    });

    const apiKey = Deno.env.get('BOOKING_API_KEY') || Deno.env.get('BOOKING_COM_RAPID_API_KEY');
    if (!apiKey) {
      throw new Error('Booking API key not configured');
    }

    // Build query params for room availability
    const queryParams = new URLSearchParams({
      hotel_id: hotelId.toString(),
      arrival_date: checkIn,
      departure_date: checkOut,
      adults: guests?.toString() || '2',
      room_qty: rooms?.toString() || '1',
      currency_code: currency || 'USD',
      languagecode: 'en-us'
    });

    console.log('🔍 Fetching room availability:', queryParams.toString());

    // Attempt to get room availability from Booking.com API
    const availabilityResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelAvailability?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!availabilityResponse.ok) {
      console.warn('⚠️ Room availability endpoint returned:', availabilityResponse.status);
      
      // If availability endpoint doesn't exist, return booking link instead
      const bookingUrl = buildBookingUrl({
        hotelId,
        checkIn,
        checkOut,
        guests,
        rooms,
        currency
      });

      return new Response(JSON.stringify({ 
        success: true,
        availabilityNotSupported: true,
        bookingUrl,
        message: 'Direct availability not supported. Use booking link to view rooms and prices.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const availabilityData = await availabilityResponse.json();
    
    console.log('✅ Room availability retrieved');

    // Parse and structure room data
    const rooms = availabilityData.data?.rooms || availabilityData.rooms || [];
    const structuredRooms = rooms.map((room: any) => ({
      roomId: room.room_id || room.id,
      name: room.room_name || room.name,
      description: room.description,
      maxOccupancy: room.max_occupancy,
      photos: room.photos || room.room_photos || [],
      facilities: room.facilities || room.amenities || [],
      bedConfiguration: room.bed_configurations,
      price: {
        total: room.price?.total || room.min_total_price,
        currency: room.price?.currency || currency,
        taxesIncluded: room.price?.taxes_included,
        breakdown: room.price?.breakdown
      },
      cancellationPolicy: room.cancellation_policy,
      mealPlan: room.meal_plan,
      refundable: room.refundable,
      availableRooms: room.available_rooms || room.nr_rooms_left
    }));

    return new Response(JSON.stringify({ 
      success: true,
      rooms: structuredRooms,
      bookingUrl: buildBookingUrl({ hotelId, checkIn, checkOut, guests, rooms, currency })
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in get-room-availability:', error);
    
    // Fallback: return booking URL
    const { hotelId, checkIn, checkOut, guests, rooms, currency } = await req.json();
    const bookingUrl = buildBookingUrl({ hotelId, checkIn, checkOut, guests, rooms, currency });
    
    return new Response(JSON.stringify({ 
      success: true,
      error: error.message,
      fallbackMode: true,
      bookingUrl,
      message: 'Could not fetch availability. Use booking link to view rooms and complete booking.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

function buildBookingUrl({ hotelId, checkIn, checkOut, guests, rooms, currency }: any): string {
  const params = new URLSearchParams({
    hotel_id: hotelId.toString(),
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests?.toString() || '2',
    group_children: '0',
    no_rooms: rooms?.toString() || '1',
    selected_currency: currency || 'USD',
    aid: '304142' // Affiliate ID for tracking
  });

  return `https://www.booking.com/hotel/us/${hotelId}.html?${params.toString()}`;
}
