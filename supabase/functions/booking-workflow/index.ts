import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createNotifications } from '../_shared/notificationHelpers.ts';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, newStatus } = await req.json();

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const oldStatus = booking.status;
    if (oldStatus === newStatus) {
      return new Response(
        JSON.stringify({ message: 'Status unchanged', booking }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: trip } = await supabaseClient
      .from('trip_requests')
      .select('id, title, destination, starts_on, user_id')
      .eq('id', booking.trip_id)
      .single();

    const travelerId = trip?.user_id;
    const creatorId = booking.creator_id;
    const agentId = booking.agent_id;

    const updates: any = { status: newStatus };
    const notifications: any[] = [];

    if (newStatus === 'proposal_accepted') {
      if (creatorId) {
        notifications.push({
          user_id: creatorId, type: 'proposal_accepted',
          title: 'Your proposal was accepted 🎉',
          message: trip?.title || 'A traveler has accepted your proposal for their trip.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId, type: 'proposal_accepted',
          title: 'Your proposal was accepted 🎉',
          message: trip?.title || 'A traveler has accepted your proposal for their trip.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (travelerId) {
        notifications.push({
          user_id: travelerId, type: 'proposal_accepted',
          title: "You've accepted a trip proposal",
          message: "We've saved this proposal and will guide you through secure payment next.",
          action_url: `/my-trip-requests/${trip?.id}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    if (newStatus === 'pending_payment') {
      updates.payout_status = 'not_eligible';
      if (travelerId) {
        notifications.push({
          user_id: travelerId, type: 'payment_received',
          title: 'Complete payment to secure your trip',
          message: 'Your proposal is ready. Make your payment to move your booking into our protected escrow.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    if (newStatus === 'deposit_paid' || newStatus === 'paid_in_full') {
      updates.payout_status = 'pending';
      if (trip?.starts_on) {
        const startDate = new Date(trip.starts_on);
        const payoutDate = new Date(startDate);
        payoutDate.setDate(payoutDate.getDate() + 7);
        updates.payout_expected_at = payoutDate.toISOString();
      }
      if (travelerId) {
        notifications.push({
          user_id: travelerId, type: 'payment_received',
          title: 'Payment received and protected',
          message: "Your payment is secured in Goldsainte's protected flow.",
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (creatorId) {
        notifications.push({
          user_id: creatorId, type: 'payment_received',
          title: 'Your traveler has paid',
          message: "Funds are secured for this trip. We'll update your earnings once the trip completes.",
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId, type: 'payment_received',
          title: 'Traveler payment confirmed',
          message: "Payment is now secured in Goldsainte's flow. You can proceed with confirmations.",
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    if (newStatus === 'completed') {
      if (creatorId) {
        notifications.push({
          user_id: creatorId, type: 'booking_confirmed',
          title: 'Trip completed',
          message: "Your traveler's trip has been marked as completed. We'll process your payout.",
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId, type: 'booking_confirmed',
          title: 'Trip completed',
          message: 'This trip has been marked as completed. Please upload any final documents if required.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (travelerId) {
        notifications.push({
          user_id: travelerId, type: 'booking_confirmed',
          title: 'We hope your trip was unforgettable',
          message: "Your trip has been marked as completed. If anything didn't go to plan, open a support case.",
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    if (newStatus === 'cancelled_refunded') {
      updates.payout_status = 'not_eligible';
      if (travelerId) {
        notifications.push({
          user_id: travelerId, type: 'system_announcement',
          title: 'Your booking was cancelled',
          message: 'This trip has been cancelled. Any eligible refunds will be processed.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (creatorId) {
        notifications.push({
          user_id: creatorId, type: 'system_announcement',
          title: 'Booking cancelled',
          message: 'This trip was cancelled. Open a support case if you have questions.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId, type: 'system_announcement',
          title: 'Booking cancelled',
          message: 'This trip was cancelled. Please confirm any supplier cancellations.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    if (newStatus === 'disputed') {
      updates.payout_status = 'on_hold';
      if (creatorId) {
        notifications.push({
          user_id: creatorId, type: 'system_announcement',
          title: 'Booking under review',
          message: 'This trip has been flagged for review. Payouts are temporarily on hold.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId, type: 'system_announcement',
          title: 'Booking under review',
          message: 'This trip has been flagged for review. Please have documentation ready.',
          action_url: `/bookings/${bookingId}`, entity_type: 'booking', entity_id: bookingId,
        });
      }
    }

    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (updateError) {
      throw new Error('Failed to update booking');
    }

    if (notifications.length > 0) {
      await createNotifications(supabaseClient, notifications);
    }

    console.log(`Booking ${bookingId} transitioned from ${oldStatus} to ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, oldStatus, newStatus }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in booking-workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
