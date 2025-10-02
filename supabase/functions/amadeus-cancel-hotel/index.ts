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

    console.log('Cancelling hotel booking:', bookingId);

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

    // Check if this is a hotel booking
    if (booking.booking_type !== 'hotel') {
      throw new Error('Only hotel bookings can be cancelled through this endpoint');
    }

    console.log('Processing hotel cancellation for booking:', booking.booking_reference);

    // Create modification record
    const { data: modification, error: modError } = await supabaseClient
      .from('booking_modifications')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        modification_type: 'cancel',
        status: 'completed',
        original_booking_data: booking.booking_data,
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

    // Process refund if payment exists
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
      
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      const Stripe = (await import('https://esm.sh/stripe@18.5.0')).default;
      const stripe = new Stripe(stripeKey!, { apiVersion: '2025-08-27.basil' });

      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          reason: 'requested_by_customer',
        });

        refundAmount = refund.amount / 100;
        refundStatus = refund.status === 'succeeded' ? 'completed' : 'processing';
        
        console.log('Refund created:', refund.id, 'Status:', refund.status);

        await supabaseClient
          .from('payments')
          .update({ status: 'refunded' })
          .eq('id', payment.id);
      } catch (refundError: any) {
        console.error('Stripe refund error:', refundError);
        refundStatus = 'failed';
      }
    }

    // Update modification with refund info
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
          email: booking.booking_data?.email || booking.booking_data?.guestEmail,
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
        message: 'Hotel booking cancelled successfully',
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
    console.error('Error in amadeus-cancel-hotel:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});