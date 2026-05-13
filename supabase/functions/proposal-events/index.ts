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

    const { eventType, proposalId, tripRequestId } = await req.json();

    // Fetch trip request to get traveler
    const { data: trip, error: tripError } = await supabaseClient
      .from('trip_requests')
      .select('id, title, destination, user_id')
      .eq('id', tripRequestId)
      .single();

    if (tripError || !trip) {
      throw new Error('Trip request not found');
    }

    const travelerId = trip.user_id;
    const notifications: any[] = [];

    // Handle different proposal events
    if (eventType === 'proposal_created') {
      notifications.push({
        user_id: travelerId,
        type: 'new_proposal',
        title: 'You have a new trip proposal',
        message: 'A Goldsainte partner has sent a proposal for your trip. Review the details and accept if it feels right.',
        action_url: `/trip-requests/${tripRequestId}`,
        entity_type: 'trip_proposal',
        entity_id: proposalId,
      });
    }

    if (eventType === 'proposal_updated') {
      notifications.push({
        user_id: travelerId,
        type: 'new_proposal',
        title: 'A proposal was updated',
        message: 'One of your proposals has been updated with new details or pricing. Take a look before you decide.',
        action_url: `/trip-requests/${tripRequestId}`,
        entity_type: 'trip_proposal',
        entity_id: proposalId,
      });
    }

    if (eventType === 'proposal_withdrawn') {
      notifications.push({
        user_id: travelerId,
        type: 'proposal_declined',
        title: 'A proposal is no longer available',
        message: 'One of your proposals has been withdrawn. If you still want this trip, other partners may send options soon.',
        action_url: `/trip-requests/${tripRequestId}`,
        entity_type: 'trip_proposal',
        entity_id: proposalId,
      });
    }

    if (notifications.length > 0) {
      await createNotifications(supabaseClient, notifications);
    }

    console.log(`Proposal ${eventType} notification sent for trip ${tripRequestId}`);

    return new Response(
      JSON.stringify({ success: true, eventType }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in proposal-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
