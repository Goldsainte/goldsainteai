// supabase/functions/booking-actions/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'request_cancellation' | 'open_dispute' | 'admin_update_status';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const payload = await req.json();
    const action: Action = payload.action;
    const userId: string | undefined = payload.userId;
    const data = payload.data;

    console.log('booking-actions invoked:', { action, userId });

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing action or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request_cancellation') {
      const { bookingId, role, reasonShort, reasonDetails } = data || {};
      if (!bookingId || !role || !reasonShort) {
        return new Response(
          JSON.stringify({ error: 'Missing cancellation fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure this user is part of the booking
      const { data: booking, error: bookingError } = await supabase
        .from('trip_bookings')
        .select('id, traveler_id, partner_id, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        console.error('Booking not found:', bookingError);
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isTraveler = booking.traveler_id === userId;
      const isPartner = booking.partner_id === userId;
      if (!isTraveler && !isPartner) {
        return new Response(
          JSON.stringify({ error: 'Not authorized for this booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const requested_role = isTraveler ? 'traveler' : 'partner';

      const { data: cancellation, error: cancelError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: bookingId,
          requested_by: userId,
          requested_role,
          reason_short: reasonShort,
          reason_details: reasonDetails || null,
        })
        .select('*')
        .maybeSingle();

      if (cancelError || !cancellation) {
        console.error('Could not create cancellation:', cancelError);
        return new Response(
          JSON.stringify({ error: 'Could not create cancellation request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add status history entry
      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        old_status: booking.status,
        new_status: booking.status,
        changed_by: userId,
        reason: `Cancellation requested: ${reasonShort}`,
      });

      console.log('Cancellation created:', cancellation.id);

      return new Response(
        JSON.stringify({ cancellation }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'open_dispute') {
      const { bookingId, type, summary, details } = data || {};
      if (!bookingId || !type || !summary) {
        return new Response(
          JSON.stringify({ error: 'Missing dispute fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: booking, error: bookingError } = await supabase
        .from('trip_bookings')
        .select('id, traveler_id, partner_id, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        console.error('Booking not found:', bookingError);
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isTraveler = booking.traveler_id === userId;
      const isPartner = booking.partner_id === userId;

      if (!isTraveler && !isPartner) {
        return new Response(
          JSON.stringify({ error: 'Not authorized for this booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: dispute, error: disputeError } = await supabase
        .from('booking_disputes')
        .insert({
          booking_id: bookingId,
          opened_by: userId,
          type,
          summary,
          details: details || null,
        })
        .select('*')
        .maybeSingle();

      if (disputeError || !dispute) {
        console.error('Could not open dispute:', disputeError);
        return new Response(
          JSON.stringify({ error: 'Could not open dispute' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark booking as disputed
      await supabase
        .from('trip_bookings')
        .update({ status: 'disputed' })
        .eq('id', bookingId);

      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        old_status: booking.status,
        new_status: 'disputed',
        changed_by: userId,
        reason: `Dispute opened: ${summary}`,
      });

      console.log('Dispute created:', dispute.id);

      return new Response(
        JSON.stringify({ dispute }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'admin_update_status') {
      return new Response(
        JSON.stringify({ error: 'Not implemented in public edge function.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('booking-actions error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
