import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARKUP_PERCENTAGE = 0.15; // 15% markup

async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightOffer, passengers, contactInfo, baseCost, selectedSeats = [], selectedBaggage = [], additionalFees = { baggage: 0, seats: 0 } } = await req.json();
    
    console.log('Flight booking request:', { 
      flightOffer: flightOffer?.id,
      passengersCount: passengers?.length,
      baseCost,
      selectedSeats: selectedSeats.length,
      selectedBaggage: selectedBaggage.length,
      additionalFees
    });

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const token_amadeus = await getAmadeusToken();

    // Create flight order with Amadeus
    const bookingPayload = {
      data: {
        type: 'flight-order',
        flightOffers: [flightOffer],
        travelers: passengers.map((passenger: any, index: number) => ({
          id: String(index + 1),
          dateOfBirth: passenger.dateOfBirth,
          name: {
            firstName: passenger.firstName,
            lastName: passenger.lastName
          },
          gender: passenger.gender,
          contact: index === 0 ? {
            emailAddress: contactInfo.email,
            phones: [{
              deviceType: 'MOBILE',
              countryCallingCode: '1',
              number: contactInfo.phone
            }]
          } : undefined,
          documents: passenger.passportNumber ? [{
            documentType: 'PASSPORT',
            number: passenger.passportNumber,
            expiryDate: passenger.passportExpiry,
            issuanceCountry: passenger.passportCountry,
            nationality: passenger.nationality,
            holder: true
          }] : undefined
        }))
      }
    };

    console.log('Creating Amadeus flight order...');
    
    const bookingResponse = await fetch(
      'https://test.api.amadeus.com/v1/booking/flight-orders',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token_amadeus}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      }
    );

    if (!bookingResponse.ok) {
      const error = await bookingResponse.text();
      console.error('Amadeus booking error:', error);
      throw new Error(`Flight booking failed: ${bookingResponse.statusText}`);
    }

    const bookingData = await bookingResponse.json();
    console.log('Flight order created:', bookingData.data.id);

    // Calculate pricing with additional fees
    const basePrice = baseCost || parseFloat(flightOffer.price.total);
    const markupAmount = basePrice * MARKUP_PERCENTAGE;
    const baggageFees = additionalFees.baggage || 0;
    const seatFees = additionalFees.seats || 0;
    const totalPrice = basePrice + markupAmount + baggageFees + seatFees;

    // Store booking in database
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_type: 'flight',
        booking_reference: bookingData.data.id,
        status: 'confirmed',
        base_cost: basePrice,
        markup_amount: markupAmount,
        markup_percentage: MARKUP_PERCENTAGE * 100,
        total_price: totalPrice,
        currency: flightOffer.price.currency,
        booking_data: {
          amadeus_booking_id: bookingData.data.id,
          flight_offer: flightOffer,
          passengers: passengers,
          contact: contactInfo,
          booking_response: bookingData.data,
          selected_seats: selectedSeats,
          selected_baggage: selectedBaggage,
          fees: {
            baggage: baggageFees,
            seats: seatFees
          }
        }
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Database booking error:', bookingError);
      throw new Error('Failed to store booking in database');
    }

    console.log('Booking stored in database:', booking.id);

    return new Response(JSON.stringify({ 
      success: true,
      booking: {
        id: booking.id,
        reference: bookingData.data.id,
        status: 'confirmed',
        totalPrice: totalPrice,
        currency: flightOffer.price.currency,
        amadeus_data: bookingData.data
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in amadeus-book-flight:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
