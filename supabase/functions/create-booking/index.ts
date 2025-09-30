import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingType, bookingData, totalPrice, currency, guestInfo } = await req.json();
    
    console.log('Creating booking:', { bookingType, totalPrice, currency });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create guest record
    const { data: guest, error: guestError } = await supabaseClient
      .from('guests')
      .insert({
        email: guestInfo.email,
        first_name: guestInfo.firstName,
        last_name: guestInfo.lastName,
        phone: guestInfo.phone,
        country: guestInfo.country
      })
      .select()
      .single();

    if (guestError) {
      console.error('Guest creation error:', guestError);
      throw new Error('Failed to create guest record');
    }

    console.log('Guest created:', guest.id);

    // Generate booking reference
    const bookingReference = `GS${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        booking_type: bookingType,
        booking_reference: bookingReference,
        status: 'pending',
        total_price: totalPrice,
        currency: currency,
        booking_data: bookingData,
        guest_id: guest.id
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw new Error('Failed to create booking record');
    }

    console.log('Booking created:', booking.id, 'Reference:', bookingReference);

    return new Response(JSON.stringify({ 
      booking,
      bookingReference
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
