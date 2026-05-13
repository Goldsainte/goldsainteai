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

    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Get vendor
    const { data: vendor } = await supabaseClient
      .from('transportation_vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) throw new Error('Vendor not found');

    // Get analytics data
    let query = supabaseClient
      .from('vendor_analytics_daily')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: analytics, error } = await query.limit(90);

    if (error) throw error;

    // Calculate summary metrics
    const summary = analytics.reduce((acc, day) => ({
      totalBookings: acc.totalBookings + day.total_bookings,
      totalRevenue: acc.totalRevenue + parseFloat(day.revenue),
      avgRating: (acc.avgRating + parseFloat(day.customer_rating_avg)) / 2,
    }), { totalBookings: 0, totalRevenue: 0, avgRating: 0 });

    return new Response(JSON.stringify({ analytics, summary }), {
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