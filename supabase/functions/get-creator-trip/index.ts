import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const tripStoryId = body?.tripStoryId as string | undefined;

    if (!tripStoryId) {
      return new Response(JSON.stringify({ error: 'Missing tripStoryId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Loading trip story:', tripStoryId);

    // 1) Load trip story
    const { data: story, error: storyError } = await supabase
      .from("trip_stories")
      .select("id, user_id, title, hook, caption, hero_image_url, itinerary_lines, tiktok_post_id, tiktok_published_at, journey_id, created_at")
      .eq("id", tripStoryId)
      .maybeSingle();

    if (storyError) {
      console.error("Error loading trip story:", storyError);
      return new Response(JSON.stringify({ error: 'Failed to load trip story' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!story) {
      return new Response(JSON.stringify({ error: 'Trip story not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Load creator profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, first_name, last_name, avatar_url")
      .eq("id", story.user_id)
      .maybeSingle();

    if (profileError) {
      console.error("Error loading profile:", profileError);
    }

    // Get TikTok username from tiktok_tokens table
    const { data: tiktokToken } = await supabase
      .from("tiktok_tokens")
      .select("tiktok_username")
      .eq("user_id", story.user_id)
      .maybeSingle();

    const creatorName = profile?.full_name || 
                       (profile?.first_name && profile?.last_name ? 
                         `${profile.first_name} ${profile.last_name}` : 
                         profile?.username || 'Creator');

    const creator = {
      id: story.user_id,
      name: creatorName,
      username: profile?.username || null,
      handle: tiktokToken?.tiktok_username ? `@${tiktokToken.tiktok_username}` : '@creator',
      avatarUrl: profile?.avatar_url || null,
    };

    // 3) Load packaged trip (if linked)
    let journey = null;

    if (story.journey_id) {
      console.log('Loading linked journey:', story.journey_id);
      
      const { data: journeyRow, error: journeyError } = await supabase
        .from("packaged_trips")
        .select("id, title, cover_image_url, description, price_per_person, currency, duration_days, duration_nights, tags, destination")
        .eq("id", story.journey_id)
        .maybeSingle();

      if (journeyError) {
        console.error("Error loading journey:", journeyError);
      }

      if (journeyRow) {
        journey = {
          id: journeyRow.id,
          title: journeyRow.title,
          coverImageUrl: journeyRow.cover_image_url,
          shortDescription: journeyRow.description,
          priceFrom: journeyRow.price_per_person && journeyRow.currency 
            ? `${journeyRow.currency} ${journeyRow.price_per_person.toLocaleString()}` 
            : null,
          duration: journeyRow.duration_days && journeyRow.duration_nights
            ? `${journeyRow.duration_nights} nights, ${journeyRow.duration_days} days`
            : null,
          tags: journeyRow.tags || [],
          destination: journeyRow.destination,
        };
      }
    }

    const responseBody = {
      tripStory: {
        id: story.id,
        title: story.title || 'Untitled Trip',
        hook: story.hook,
        caption: story.caption || '',
        heroImageUrl: story.hero_image_url,
        itinerary: story.itinerary_lines || [],
        postedToTikTok: !!story.tiktok_post_id,
        tiktokVideoId: story.tiktok_post_id,
        createdAt: story.created_at,
      },
      journey,
      creator,
    };

    console.log('Successfully loaded creator trip data');

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Unexpected error in get-creator-trip:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
