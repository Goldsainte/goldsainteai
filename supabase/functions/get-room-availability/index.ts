import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { hotelId, checkIn, checkOut, guests, rooms, currency, locale } = await req.json();
    
    console.log('🛏️ [get-room-availability] Request:', { 
      hotelId, 
      checkIn, 
      checkOut, 
      guests,
      rooms,
      currency,
      locale
    });

    if (!checkIn || !checkOut) {
      throw new Error('checkIn and checkOut dates are required');
    }

    const apiKey = Deno.env.get('BOOKING_API_KEY') || Deno.env.get('BOOKING_COM_RAPID_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    const params = new URLSearchParams({
      hotel_id: String(hotelId),
      arrival_date: checkIn,
      departure_date: checkOut,
      adults: String(guests || 2),
      room_qty: String(rooms || 1),
      currency_code: currency || 'USD',
      languagecode: locale || 'en-us'
    });

    console.log('🔍 [get-room-availability] Fetching from RAPID API...');

    const availabilityResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelAvailability?${params}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    const bookingUrl = buildBookingUrl({ hotelId, checkIn, checkOut, guests, rooms, currency });

    if (!availabilityResponse.ok) {
      console.warn('⚠️ [get-room-availability] API returned:', availabilityResponse.status);
      
      return new Response(JSON.stringify({ 
        success: true,
        availabilityNotSupported: true,
        bookingUrl,
        message: 'Room availability not available through API. Use booking link to view rooms.'
      }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const availabilityData = await availabilityResponse.json();
    console.log('✅ [get-room-availability] Retrieved successfully');

    // Structure room offers
    const rawRooms = availabilityData.data?.rooms || availabilityData.rooms || [];
    const offers = rawRooms.map((room: any) => {
      const nightlyPrices = room.nightly_prices || [];
      const total = room.price?.total || room.min_total_price || 0;
      
      return {
        roomTypeId: String(room.room_id || room.id),
        ratePlanId: String(room.rate_plan_id || room.id),
        name: room.room_name || room.name,
        description: room.description || '',
        maxOccupancy: room.max_occupancy || guests,
        photos: (room.photos || room.room_photos || []).map((p: any) => ({
          url: typeof p === 'string' ? p : (p.url || p.url_max300)
        })),
        amenities: (room.facilities || room.amenities || []).map((a: any) => ({
          label: typeof a === 'string' ? a : a.name
        })),
        bedTypes: room.bed_configurations || room.bed_types || [],
        mealPlan: room.meal_plan || room.board_type,
        refundable: room.refundable || false,
        cancellationPolicy: room.cancellation_policy || 'Standard cancellation policy applies',
        nightlyPrices: nightlyPrices.map((np: any) => ({
          date: np.date,
          amount: np.price || np.amount
        })),
        total: {
          currency: room.price?.currency || currency || 'USD',
          amount: total,
          taxesAndFees: room.price?.taxes_and_fees || 0,
          displayText: `${currency || 'USD'} ${total.toFixed(2)}`
        },
        remaining: room.available_rooms || room.nr_rooms_left
      };
    });

    return new Response(JSON.stringify({ 
      success: true,
      offers,
      bookingUrl
    }), {
      headers: { 
        ...corsHeaders(req), 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300' // Cache for 5 min
      },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [get-room-availability] Error:', error);
    
    try {
      const body = await req.json();
      const bookingUrl = buildBookingUrl(body);
      
      return new Response(JSON.stringify({ 
        success: true,
        fallbackMode: true,
        bookingUrl,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch {
      return new Response(JSON.stringify({ 
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      });
    }
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
