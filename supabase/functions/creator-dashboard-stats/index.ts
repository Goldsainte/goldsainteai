import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Loading dashboard stats for creator: ${user.id}`);

    // --- Proposal stats ---
    const { data: proposals, error: proposalsError } = await supabaseClient
      .from('trip_proposals')
      .select('id, status, created_at, trip_request_id')
      .eq('proposer_id', user.id)
      .order('created_at', { ascending: false });

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
    }

    const allProposals = proposals || [];
    const activeStatuses = ['draft', 'sent', 'traveler_review'];
    const activeProposals = allProposals.filter(p => activeStatuses.includes(p.status)).length;
    const acceptedProposals = allProposals.filter(p => p.status === 'accepted').length;
    const totalProposalsSent = allProposals.length;
    const respondedCount = allProposals.filter(p => ['accepted', 'declined'].includes(p.status)).length;
    const responseRate = totalProposalsSent > 0 ? Math.round((respondedCount / totalProposalsSent) * 100) : 0;

    // --- Recent proposals with trip request info ---
    const recentRaw = allProposals.slice(0, 10);
    const tripRequestIds = [...new Set(recentRaw.map(p => p.trip_request_id).filter(Boolean))];

    let tripRequestMap: Record<string, { destination: string; title: string }> = {};
    if (tripRequestIds.length > 0) {
      const { data: tripRequests } = await supabaseClient
        .from('trip_requests')
        .select('id, destination, title')
        .in('id', tripRequestIds);

      (tripRequests || []).forEach(tr => {
        tripRequestMap[tr.id] = { destination: tr.destination || '', title: tr.title || '' };
      });
    }

    const recentProposals = recentRaw.map(p => ({
      id: p.id,
      tripRequestId: p.trip_request_id,
      status: p.status,
      createdAt: p.created_at,
      destination: tripRequestMap[p.trip_request_id]?.destination || 'Unknown',
      tripTitle: tripRequestMap[p.trip_request_id]?.title || 'Untitled Trip',
    }));

    // --- Earnings ---
    const { data: earningsData } = await supabaseClient
      .from('creator_earnings')
      .select('amount, status')
      .eq('user_id', user.id);

    const earnings = earningsData || [];
    const totalEarnings = earnings
      .filter(e => ['completed', 'paid'].includes(e.status))
      .reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);
    const pendingEarnings = earnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);

    // --- Open trip requests count ---
    const { count: openTripRequests } = await supabaseClient
      .from('trip_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');

    console.log(`Stats: active=${activeProposals}, accepted=${acceptedProposals}, total=${totalProposalsSent}, rate=${responseRate}%, earnings=$${totalEarnings}`);

    return new Response(
      JSON.stringify({
        activeProposals,
        acceptedProposals,
        totalProposalsSent,
        responseRate,
        totalEarnings,
        pendingEarnings,
        recentProposals,
        openTripRequests: openTripRequests || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in creator-dashboard-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
