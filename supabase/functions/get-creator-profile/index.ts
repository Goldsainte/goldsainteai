import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const creatorId = body?.creatorId as string | undefined;
  if (!creatorId) {
    return new Response("Missing creatorId", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  console.log(`Loading creator profile for: ${creatorId}`);

  // 1) Load creator profile
  const { data: profile, error: profileError } = await supabase
    .from("creator_profiles")
    .select(
      "user_id, display_name, handle, avatar_url, bio, primary_niches, primary_regions, tiktok_handle, tiktok_url"
    )
    .eq("user_id", creatorId)
    .maybeSingle();

  if (profileError) {
    console.error("Error loading creator_profile:", profileError);
  }

  // Fallbacks if profile missing
  const creator = {
    id: creatorId,
    name: profile?.display_name ?? "Travel Creator",
    handle: profile?.handle ?? profile?.tiktok_handle ?? "@creator",
    avatarUrl: profile?.avatar_url ?? null,
    bio:
      profile?.bio ??
      "This creator hasn't filled out their profile yet, but they're already building trips with Goldsainte.",
    primaryNiches: profile?.primary_niches ?? [],
    primaryRegions: profile?.primary_regions ?? [],
    tiktokHandle: profile?.tiktok_handle ?? null,
    tiktokUrl: profile?.tiktok_url ?? null,
  };

  // 2) Load trip stories for creator
  const { data: stories, error: storiesError } = await supabase
    .from("trip_stories")
    .select(
      "id, title, hook, caption, hero_image_url, journey_id, tiktok_post_id, tiktok_published_at, created_at, status"
    )
    .eq("user_id", creatorId)
    .order("created_at", { ascending: false });

  if (storiesError) {
    console.error("Error loading trip_stories:", storiesError);
  }

  console.log(`Found ${stories?.length ?? 0} trip stories`);

  // 3) Load linked packaged trips (journeys)
  const journeyIds = (stories ?? [])
    .map((s) => s.journey_id)
    .filter((id) => !!id);

  let journeysById: Record<string, any> = {};

  if (journeyIds.length > 0) {
    const { data: journeyRows, error: journeysError } = await supabase
      .from("packaged_trips")
      .select(
        "id, title, cover_image_url, description, price_per_person, duration_days, tags, currency"
      )
      .in("id", journeyIds as string[]);

    if (journeysError) {
      console.error("Error loading packaged_trips:", journeysError);
    } else if (journeyRows) {
      journeysById = journeyRows.reduce((acc: any, row: any) => {
        acc[row.id] = row;
        return acc;
      }, {});
      console.log(`Loaded ${journeyRows.length} linked packaged trips`);
    }
  }

  // 4) Combine stories with linked trips
  const trips = (stories ?? []).map((s) => {
    const journey = s.journey_id ? journeysById[s.journey_id] : null;

    return {
      tripStoryId: s.id,
      title: journey?.title ?? s.title,
      heroImageUrl: s.hero_image_url ?? journey?.cover_image_url ?? null,
      shortDescription: journey?.description ?? s.caption,
      priceFrom: journey?.price_per_person ?? null,
      currency: journey?.currency ?? 'USD',
      duration: journey?.duration_days ?? null,
      tags: journey?.tags ?? [],
      postedToTikTok: !!s.tiktok_post_id,
      tiktokPostId: s.tiktok_post_id,
      tiktokPublishedAt: s.tiktok_published_at,
      status: s.status ?? 'draft',
      createdAt: s.created_at,
    };
  });

  // 5) Calculate stats
  const stats = {
    totalTripStories: trips.length,
    featuredTripsCount: trips.filter((t) => t.postedToTikTok).length,
    draftCount: trips.filter((t) => t.status === 'draft').length,
    publishedCount: trips.filter((t) => t.status === 'published').length,
  };

  const responseBody = {
    creator,
    stats,
    trips,
  };

  console.log(`Returning profile for ${creator.name} with ${trips.length} trips`);

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { 
      "Content-Type": "application/json",
      ...corsHeaders 
    },
  });
});
