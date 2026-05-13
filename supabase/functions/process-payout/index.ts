import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createNotifications } from '../_shared/notificationHelpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId } = await req.json();

    // Fetch booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    if (!['pending', 'partial'].includes(booking.payout_status)) {
      return new Response(
        JSON.stringify({ message: 'Booking not eligible for payout', booking }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update payout status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        payout_status: 'paid',
        payout_paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error('Failed to update payout status');
    }

    // Create notifications
    const notifications: any[] = [];

    if (booking.creator_id && booking.creator_earnings) {
      notifications.push({
        user_id: booking.creator_id,
        type: 'payout_completed',
        title: 'Your payout is on its way',
        message: `We've sent your payout for this trip. Amount: ${booking.creator_earnings} ${booking.currency || 'USD'}.`,
        action_url: `/bookings/${bookingId}`,
        entity_type: 'booking',
        entity_id: bookingId,
      });
    }

    if (booking.agent_id && booking.agent_earnings) {
      notifications.push({
        user_id: booking.agent_id,
        type: 'payout_completed',
        title: 'Your payout is on its way',
        message: `We've sent your payout for this trip. Amount: ${booking.agent_earnings} ${booking.currency || 'USD'}.`,
        action_url: `/bookings/${bookingId}`,
        entity_type: 'booking',
        entity_id: bookingId,
      });
    }

    if (notifications.length > 0) {
      await createNotifications(supabaseClient, notifications);
    }

    console.log(`Payout processed for booking ${bookingId}`);

    return new Response(
      JSON.stringify({ success: true, bookingId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in process-payout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
