import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveAllowedOrigin } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = resolveAllowedOrigin(req);
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uid = user.id;

    const [
      profile, tripRequests, tripBookings, itineraryPurchases,
      bundlePurchases, messages, proposals, emergencyContacts,
      travelPreferences, packagedTrips, itineraryProducts, productBundles,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('trip_requests').select('*').eq('traveler_id', uid),
      supabase.from('trip_bookings').select('*').or(`traveler_id.eq.${uid},agent_id.eq.${uid}`),
      supabase.from('itinerary_purchases').select('*').eq('buyer_id', uid),
      supabase.from('bundle_purchases').select('*').eq('buyer_id', uid),
      supabase.from('messages').select('*').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),
      supabase.from('trip_proposals').select('*').or(`agent_id.eq.${uid},creator_id.eq.${uid}`),
      supabase.from('emergency_contacts').select('*').eq('user_id', uid),
      supabase.from('user_travel_preferences').select('*').eq('user_id', uid),
      supabase.from('packaged_trips').select('*').or(`creator_id.eq.${uid},agent_id.eq.${uid}`),
      supabase.from('itinerary_products').select('*').eq('creator_id', uid),
      supabase.from('product_bundles').select('*').eq('creator_id', uid),
    ]);

    const userData = {
      export_date: new Date().toISOString(),
      user_id: uid,
      email: user.email,
      profile: profile.data ?? null,
      trip_requests: tripRequests.data || [],
      trip_bookings: tripBookings.data || [],
      itinerary_purchases: itineraryPurchases.data || [],
      bundle_purchases: bundlePurchases.data || [],
      messages: messages.data || [],
      trip_proposals: proposals.data || [],
      emergency_contacts: emergencyContacts.data || [],
      travel_preferences: travelPreferences.data || [],
      packaged_trips: packagedTrips.data || [],
      itinerary_products: itineraryProducts.data || [],
      product_bundles: productBundles.data || [],
    };

    const filename = `goldsainte-data-${new Date().toISOString().split('T')[0]}.json`;
    return new Response(JSON.stringify(userData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('export-user-data error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});