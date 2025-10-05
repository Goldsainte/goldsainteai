import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, currentBookingData, newFlightData } = await req.json();

    if (!bookingId || !newFlightData) {
      throw new Error('Booking ID and new flight data are required');
    }

    console.log('Modifying flight booking:', bookingId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Calculate fare difference and fees
    const oldPrice = parseFloat(currentBookingData.price || booking.total_price);
    const newPrice = parseFloat(newFlightData.price.total);
    const fareDifference = newPrice - oldPrice;
    const changeFee = 50; // Standard change fee
    const totalDifference = fareDifference + changeFee;

    console.log('Price comparison:', {
      oldPrice,
      newPrice,
      fareDifference,
      changeFee,
      totalDifference
    });

    // Create modification record
    const { data: modification, error: modError } = await supabaseClient
      .from('booking_modifications')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        modification_type: 'modify',
        status: 'completed',
        original_booking_data: currentBookingData,
        new_booking_data: newFlightData,
        fare_difference: fareDifference,
        change_fee: changeFee,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (modError) {
      console.error('Error creating modification record:', modError);
    }

    // Update booking with new flight data
    const updatedBookingData = {
      ...booking.booking_data,
      ...newFlightData,
      departureDate: newFlightData.itineraries[0].segments[0].departure.at.split('T')[0],
      departureTime: newFlightData.itineraries[0].segments[0].departure.at.split('T')[1].slice(0, 5),
      arrivalTime: newFlightData.itineraries[0].segments[newFlightData.itineraries[0].segments.length - 1].arrival.at.split('T')[1].slice(0, 5),
      flightNumber: `${newFlightData.validatingAirlineCodes[0]}${newFlightData.itineraries[0].segments[0].number}`,
    };

    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        booking_data: updatedBookingData,
        total_price: booking.total_price + totalDifference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    // Send modification confirmation email
    try {
      await supabaseClient.functions.invoke('send-confirmation-email', {
        body: {
          bookingId: bookingId,
          guestName: currentBookingData.passengers?.[0]?.name || 'Guest',
          guestEmail: currentBookingData.email || currentBookingData.passengers?.[0]?.email,
          bookingReference: booking.booking_reference,
          bookingType: 'flight',
          bookingData: updatedBookingData,
          totalPrice: booking.total_price + totalDifference,
          currency: booking.currency,
        },
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Flight modified successfully',
        modificationId: modification?.id,
        fareDifference,
        changeFee,
        totalDifference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in amadeus-modify-flight:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});