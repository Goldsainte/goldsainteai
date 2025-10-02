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

    // Check for US DOT 24-hour free cancellation policy
    // Applies to flights to/from/within the US if cancelled within 24 hours of booking
    const bookingTime = new Date(booking.created_at);
    const currentTime = new Date();
    const hoursSinceBooking = (currentTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
    
    const origin = booking.booking_data?.origin || '';
    const destination = booking.booking_data?.destination || '';
    const isUSFlight = ['US', 'USA'].some(code => 
      origin.includes(code) || destination.includes(code)
    ) || booking.booking_data?.segments?.some((seg: any) => 
      seg.departure?.iataCode?.match(/^[A-Z]{3}$/) || seg.arrival?.iataCode?.match(/^[A-Z]{3}$/)
    );
    
    const qualifiesForFreeCancellation = isUSFlight && hoursSinceBooking < 24;
    
    console.log('Cancellation eligibility:', {
      isUSFlight,
      hoursSinceBooking,
      qualifiesForFreeCancellation,
      bookingTime: bookingTime.toISOString(),
      currentTime: currentTime.toISOString()
    });

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

    // Determine cancellation fee based on 24-hour rule
    const cancellationFee = qualifiesForFreeCancellation ? 0 : 50;
    
    console.log('Cancellation fee:', {
      cancellationFee,
      reason: qualifiesForFreeCancellation 
        ? 'US DOT 24-hour free cancellation policy' 
        : 'Outside 24-hour window or non-US flight'
    });

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
        cancellation_fee: cancellationFee,
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
    
    // Get the payment record for this booking
    const { data: payment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'completed')
      .single();

    let refundAmount = null;
    let refundStatus = 'pending';

    if (payment && payment.stripe_payment_intent_id) {
      console.log('Processing refund for payment:', payment.stripe_payment_intent_id);
      
      // Get Stripe instance
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      const Stripe = (await import('https://esm.sh/stripe@18.5.0')).default;
      const stripe = new Stripe(stripeKey!, { apiVersion: '2025-08-27.basil' });

      try {
        // Calculate refund amount (total payment minus cancellation fee)
        const totalPaid = payment.amount;
        const refundAmountCents = qualifiesForFreeCancellation 
          ? totalPaid 
          : Math.max(0, totalPaid - (cancellationFee * 100)); // Convert fee to cents

        console.log('Refund calculation:', {
          totalPaid,
          cancellationFee,
          refundAmountCents,
          qualifiesForFreeCancellation
        });

        // Create refund in Stripe
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: 'requested_by_customer',
          metadata: {
            cancellation_fee: cancellationFee.toString(),
            us_dot_24hr_policy: qualifiesForFreeCancellation.toString(),
          }
        });

        refundAmount = refund.amount / 100; // Convert cents to dollars
        refundStatus = refund.status === 'succeeded' ? 'completed' : 'processing';
        
        console.log('Refund created:', refund.id, 'Status:', refund.status);

        // Update payment record
        await supabaseClient
          .from('payments')
          .update({ status: 'refunded' })
          .eq('id', payment.id);
      } catch (refundError: any) {
        console.error('Stripe refund error:', refundError);
        refundStatus = 'failed';
      }
    }

    // Update modification record with refund info
    if (modification) {
      await supabaseClient
        .from('booking_modifications')
        .update({
          refund_amount: refundAmount,
          refund_currency: booking.currency,
          refund_status: refundStatus,
        })
        .eq('id', modification.id);
    }

    // Send cancellation email
    try {
      await supabaseClient.functions.invoke('send-cancellation-email', {
        body: {
          email: booking.booking_data?.email || booking.booking_data?.passengers?.[0]?.email,
          bookingReference: booking.booking_reference,
          bookingData: booking.booking_data,
          refundAmount: refundAmount,
          refundCurrency: booking.currency,
        },
      });
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Flight cancelled successfully',
        modificationId: modification?.id,
        refundAmount: refundAmount,
        refundStatus: refundStatus,
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