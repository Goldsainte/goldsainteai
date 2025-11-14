import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Loading stats for creator: ${user.id}`);

    // Check TikTok connection status
    const { data: tiktokToken } = await supabaseClient
      .from('tiktok_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    const tiktokConnected = !!tiktokToken?.access_token;

    // Get trip stories count and recent stories
    const { data: tripStories, error: storiesError } = await supabaseClient
      .from('trip_stories')
      .select('id, title, created_at, tiktok_post_id, tiktok_published_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (storiesError) {
      console.error('Error fetching trip stories:', storiesError);
    }

    const totalTripStories = tripStories?.length || 0;

    // Count trips that have a TikTok story linked
    const totalTripsLinked = tripStories?.filter((story) => !!story.tiktok_post_id).length || 0;

    // Get recent stories (up to 10)
    const recentStories = (tripStories || []).slice(0, 10).map((story) => ({
      id: story.id,
      title: story.title || 'Untitled Story',
      createdAt: story.created_at,
      postedToTikTok: !!story.tiktok_published_at,
      tiktokVideoId: story.tiktok_post_id,
    }));

    // Calculate estimated earnings (placeholder logic - in a real app, you'd sum from bookings/commissions)
    // For now, we'll estimate $50 per published TikTok story as a placeholder
    const totalEstimatedEarnings = totalTripsLinked * 50;

    console.log(`Stats calculated - Stories: ${totalTripStories}, Linked: ${totalTripsLinked}, Earnings: $${totalEstimatedEarnings}`);

    return new Response(
      JSON.stringify({
        tiktokConnected,
        totalTripStories,
        totalTripsLinked,
        totalEstimatedEarnings,
        recentStories,
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
