import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createNotifications } from '../_shared/notificationHelpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { bookingId, newStatus } = await req.json();

    // Fetch booking
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Fetch related trip
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

    // Status-specific logic
    if (newStatus === 'proposal_accepted') {
      if (creatorId) {
        notifications.push({
          user_id: creatorId,
          notification_type: 'proposal_accepted',
          title: 'Your proposal was accepted 🎉',
          message: trip?.title || 'A traveler has accepted your proposal for their trip.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId,
          notification_type: 'proposal_accepted',
          title: 'Your proposal was accepted 🎉',
          message: trip?.title || 'A traveler has accepted your proposal for their trip.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (travelerId) {
        notifications.push({
          user_id: travelerId,
          notification_type: 'proposal_accepted_traveler',
          title: "You've accepted a trip proposal",
          message: "We've saved this proposal and will guide you through secure payment next.",
          link: `/my-trip-requests/${trip?.id}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    if (newStatus === 'pending_payment') {
      updates.payout_status = 'not_eligible';

      if (travelerId) {
        notifications.push({
          user_id: travelerId,
          notification_type: 'payment_needed',
          title: 'Complete payment to secure your trip',
          message: 'Your proposal is ready. Make your payment to move your booking into our protected escrow.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    if (newStatus === 'deposit_paid' || newStatus === 'paid_in_full') {
      updates.payout_status = 'pending';

      // Schedule payout 7 days after trip start
      if (trip?.starts_on) {
        const startDate = new Date(trip.starts_on);
        const payoutDate = new Date(startDate);
        payoutDate.setDate(payoutDate.getDate() + 7);
        updates.payout_expected_at = payoutDate.toISOString();
      }

      if (travelerId) {
        notifications.push({
          user_id: travelerId,
          notification_type: 'payment_received',
          title: 'Payment received and protected',
          message: "Your payment is secured in Goldsainte's protected flow. Your creator and travel agent will now finalize the details.",
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (creatorId) {
        notifications.push({
          user_id: creatorId,
          notification_type: 'traveler_paid',
          title: 'Your traveler has paid',
          message: "Funds are secured for this trip. We'll update your earnings once the trip completes.",
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId,
          notification_type: 'traveler_paid_agent',
          title: 'Traveler payment confirmed',
          message: "Payment is now secured in Goldsainte's flow. You can proceed with confirmations.",
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    if (newStatus === 'completed') {
      if (creatorId) {
        notifications.push({
          user_id: creatorId,
          notification_type: 'trip_completed_creator',
          title: 'Trip completed',
          message: "Your traveler's trip has been marked as completed. We'll process your payout according to our schedule.",
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId,
          notification_type: 'trip_completed_agent',
          title: 'Trip completed',
          message: 'This trip has been marked as completed. Please upload any final invoices or documents if required.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (travelerId) {
        notifications.push({
          user_id: travelerId,
          notification_type: 'trip_completed_traveler',
          title: 'We hope your trip was unforgettable',
          message: "Your Goldsainte trip has been marked as completed. If anything didn't go to plan, you can open a support case from the booking page.",
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    if (newStatus === 'cancelled_refunded') {
      updates.payout_status = 'not_eligible';

      if (travelerId) {
        notifications.push({
          user_id: travelerId,
          notification_type: 'booking_cancelled',
          title: 'Your booking was cancelled',
          message: 'This trip has been cancelled. Any eligible refunds will be processed according to our terms.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (creatorId) {
        notifications.push({
          user_id: creatorId,
          notification_type: 'booking_cancelled_creator',
          title: 'Booking cancelled',
          message: 'This trip was cancelled. If you have questions about your earnings, open a support case on the booking.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId,
          notification_type: 'booking_cancelled_agent',
          title: 'Booking cancelled',
          message: 'This trip was cancelled. Please confirm any supplier cancellations on your side.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    if (newStatus === 'disputed') {
      updates.payout_status = 'on_hold';

      if (creatorId) {
        notifications.push({
          user_id: creatorId,
          notification_type: 'booking_disputed_creator',
          title: 'Booking under review',
          message: 'This trip has been flagged for review. Payouts are temporarily on hold while our team investigates.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
      if (agentId) {
        notifications.push({
          user_id: agentId,
          notification_type: 'booking_disputed_agent',
          title: 'Booking under review',
          message: 'This trip has been flagged for review. Please have documentation ready in case our team reaches out.',
          link: `/bookings/${bookingId}`,
          metadata: { bookingId, tripId: trip?.id },
        });
      }
    }

    // Update booking
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (updateError) {
      throw new Error('Failed to update booking');
    }

    // Create notifications
    if (notifications.length > 0) {
      await createNotifications(supabaseClient, notifications);
    }

    console.log(`Booking ${bookingId} transitioned from ${oldStatus} to ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, oldStatus, newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in booking-workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
