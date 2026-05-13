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
    const { hotelId, arrival_date, departure_date, currency, guests, locale } = await req.json();
    
    console.log('📦 [get-hotel-details] Request:', { 
      hotelId, 
      arrival_date, 
      departure_date, 
      currency,
      guests,
      locale
    });

    const apiKey = Deno.env.get('BOOKING_API_KEY') || Deno.env.get('BOOKING_COM_RAPID_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    const currencyCode = currency || 'USD';
    const localeCode = locale || 'en-us';
    const arrivalDate = arrival_date || '';
    const departureDate = departure_date || '';

    // Build query params
    const params = new URLSearchParams({
      hotel_id: String(hotelId),
      languagecode: localeCode,
      currency_code: currencyCode
    });

    if (arrivalDate && departureDate) {
      params.append('arrival_date', arrivalDate);
      params.append('departure_date', departureDate);
    }

    console.log('🔍 [get-hotel-details] Fetching from RAPID API...');

    const detailsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails?${params}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('❌ [get-hotel-details] API Error:', detailsResponse.status, errorText);
      throw new Error(`RAPID API error: ${detailsResponse.status}`);
    }

    const hotelDetails = await detailsResponse.json();
    const data = hotelDetails.data || {};
    
    console.log('✅ [get-hotel-details] Retrieved successfully');

    // Map facilities to amenities with icons
    const facilities = (data.facilities || data.hotel_facilities || []).map((f: any) => {
      const name = typeof f === 'string' ? f : f.name || f.facility_name;
      return {
        code: typeof f === 'object' ? f.facility_id : undefined,
        label: name,
        icon: mapFacilityIcon(name)
      };
    });

    // Build comprehensive response
    const responseData = {
      propertyId: String(data.hotel_id || hotelId),
      name: data.hotel_name || data.name,
      description: data.description || data.hotel_description || '',
      coordinates: {
        lat: data.latitude || 0,
        lng: data.longitude || 0
      },
      address: data.address || '',
      city: data.city || '',
      country: data.country_trans || data.country || '',
      zip: data.zip || '',
      starRating: data.class || data.hotel_class,
      reviewScore: data.review_score,
      reviewCount: data.review_nr || data.review_count || 0,
      reviewScoreWord: data.review_score_word,
      photos: (data.photos || data.photo_urls || []).map((p: any) => ({
        url: typeof p === 'string' ? p : (p.url_max1280 || p.url || p),
        caption: typeof p === 'object' ? p.caption : undefined
      })),
      facilities,
      policies: {
        checkInFrom: data.checkin || data.checkin_from,
        checkInTo: data.checkin_to,
        checkOutTo: data.checkout || data.checkout_to,
        importantNotes: data.important_info || []
      },
      nearbyPOIs: data.nearby_pois || [],
      neighborhood: data.district || data.neighborhood,
      // Booking URL for deep-link
      bookingUrl: buildBookingUrl({
        hotelId: data.hotel_id || hotelId,
        checkIn: arrivalDate,
        checkOut: departureDate,
        guests: guests || 2,
        currency: currencyCode
      })
    };

    return new Response(JSON.stringify({ 
      success: true,
      data: responseData
    }), {
      headers: { 
        ...corsHeaders(req), 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600' // Cache for 1 hour
      },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [get-hotel-details] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function mapFacilityIcon(name: string): string | undefined {
  const n = name.toLowerCase();
  if (n.includes('wifi') || n.includes('internet')) return 'wifi';
  if (n.includes('parking')) return 'parking';
  if (n.includes('breakfast')) return 'breakfast';
  if (n.includes('restaurant')) return 'restaurant';
  if (n.includes('gym') || n.includes('fitness')) return 'gym';
  if (n.includes('pool')) return 'pool';
  if (n.includes('spa')) return 'spa';
  if (n.includes('air conditioning') || n.includes('ac')) return 'air-conditioning';
  return undefined;
}

function buildBookingUrl({ hotelId, checkIn, checkOut, guests, currency }: any): string {
  const params = new URLSearchParams({
    checkin: checkIn || '',
    checkout: checkOut || '',
    group_adults: String(guests || 2),
    group_children: '0',
    no_rooms: '1',
    selected_currency: currency || 'USD',
    aid: '304142' // Affiliate ID
  });

  return `https://www.booking.com/hotel/us/xx-${hotelId}.html?${params}`;
}
