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
    const { bookingId, reason } = await req.json();

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    console.log('Cancelling flight booking:', bookingId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check if this is a flight booking
    if (booking.booking_type !== 'flight') {
      throw new Error('Only flight bookings can be cancelled through this endpoint');
    }

    // Get Amadeus access token
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');

    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: amadeusKey!,
        client_secret: amadeusSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Amadeus access token');
    }

    const { access_token } = await tokenResponse.json();

    // Extract order ID from booking data
    const orderId = booking.booking_data?.orderId || booking.booking_reference;

    if (!orderId) {
      throw new Error('Flight order ID not found in booking');
    }

    console.log('Attempting to cancel Amadeus order:', orderId);

    // Delete the flight order (Amadeus cancellation)
    const cancelResponse = await fetch(
      `https://test.api.amadeus.com/v1/booking/flight-orders/${orderId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error('Amadeus cancellation failed:', errorText);
      throw new Error(`Failed to cancel flight with Amadeus: ${errorText}`);
    }

    console.log('Flight order cancelled successfully with Amadeus');

    // Create modification record
    const { data: modification, error: modError } = await supabaseClient
      .from('booking_modifications')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        modification_type: 'cancel',
        status: 'completed',
        original_booking_data: booking.booking_data,
        amadeus_order_id: orderId,
        reason: reason || 'User requested cancellation',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (modError) {
      console.error('Error creating modification record:', modError);
    }

    // Update booking status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking status:', updateError);
    }

    // In a real implementation, you would process refunds here
    // This would involve calling Stripe's refund API

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Flight cancelled successfully',
        modificationId: modification?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in amadeus-cancel-flight:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});