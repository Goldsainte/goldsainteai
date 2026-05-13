import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const {
      title,
      hook,
      caption,
      heroImageUrl,
      itineraryLines,
      postToTikTok,
    } = await req.json();

    console.log('Creating trip story for user:', user.id);

    // Create trip story in database
    const { data: story, error: insertError } = await supabase
      .from('trip_stories')
      .insert({
        user_id: user.id,
        title,
        hook: hook || null,
        caption,
        hero_image_url: heroImageUrl || null,
        itinerary_lines: itineraryLines || [],
        platforms: ['TikTok'],
        status: postToTikTok ? 'queued' : 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create trip story:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create trip story' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Trip story created:', story.id);

    // If user wants to post to TikTok, attempt to publish
    if (postToTikTok) {
      try {
        // Get user's TikTok tokens from tiktok_tokens table
        const { data: tokenData, error: tokenError } = await supabase
          .from('tiktok_tokens')
          .select('access_token, refresh_token, expires_at, tiktok_user_id')
          .eq('user_id', user.id)
          .single();

        if (tokenError || !tokenData?.access_token) {
          console.warn('User does not have TikTok connected');
          await supabase
            .from('trip_stories')
            .update({ status: 'failed' })
            .eq('id', story.id);

          return new Response(
            JSON.stringify({
              id: story.id,
              error: 'TikTok not connected. Please connect your TikTok account first.',
              status: 'failed',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        // Check if token is expired
        const tokenExpiry = new Date(tokenData.expires_at);
        const now = new Date();

        if (tokenExpiry <= now) {
          console.log('TikTok token expired, needs refresh');
          await supabase
            .from('trip_stories')
            .update({ status: 'failed' })
            .eq('id', story.id);

          return new Response(
            JSON.stringify({
              id: story.id,
              error: 'TikTok token expired. Please reconnect your TikTok account.',
              status: 'failed',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        // Prepare TikTok post content
        const tiktokCaption = `${hook ? hook + '\n\n' : ''}${caption}`;
        
        console.log('TikTok posting not yet fully implemented (video upload required)');
        console.log('Caption prepared:', tiktokCaption);

        // Note: TikTok's Content Posting API requires uploading a video first
        // This is a placeholder - full implementation would need:
        // 1. Video upload to TikTok
        // 2. Create post with video ID
        // For now, we'll mark it as queued
        
        await supabase
          .from('trip_stories')
          .update({ 
            status: 'queued',
            // When actual posting is implemented, update with:
            // tiktok_post_id: postId,
            // tiktok_published_at: new Date().toISOString(),
            // status: 'published',
          })
          .eq('id', story.id);

        return new Response(
          JSON.stringify({
            id: story.id,
            message: 'Story saved and queued for TikTok posting',
            status: 'queued',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (tiktokError: unknown) {
        const errorMessage = tiktokError instanceof Error ? tiktokError.message : 'Failed to post to TikTok';
        console.error('TikTok posting error:', tiktokError);
        await supabase
          .from('trip_stories')
          .update({ status: 'failed' })
          .eq('id', story.id);

        return new Response(
          JSON.stringify({
            id: story.id,
            error: errorMessage,
            status: 'failed',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Return success for draft
    return new Response(
      JSON.stringify({
        id: story.id,
        message: 'Trip story saved as draft',
        status: 'draft',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to publish trip story';
    console.error('Error in publish-trip-story:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
