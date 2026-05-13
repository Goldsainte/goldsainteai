import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const bookingData = await req.json();

    // Check for scheduling conflicts
    const { data: conflicts } = await supabaseClient
      .from('transportation_bookings')
      .select('id')
      .eq('vehicle_id', bookingData.vehicle_id)
      .eq('booking_status', 'confirmed')
      .gte('pickup_datetime', bookingData.pickup_datetime)
      .lte('pickup_datetime', bookingData.dropoff_datetime);

    if (conflicts && conflicts.length > 0) {
      throw new Error('Vehicle is not available for selected time slot');
    }

    const { data, error } = await supabaseClient
      .from('transportation_bookings')
      .insert({
        ...bookingData,
        customer_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});