import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatorData {
  display_name: string;
  username: string;
  tiktok_handle: string;
  followers: number;
  avg_views: number;
  home_base: string;
  country: string;
  niches: string[];
  style_tags: string[];
}

const CREATORS: CreatorData[] = [
  { display_name: 'Travel with Maya', username: 'travelwithmaya', tiktok_handle: '@travelwithmaya', followers: 210000, avg_views: 45000, home_base: 'Los Angeles, USA', country: 'USA', niches: ['Couples', 'Luxury Europe'], style_tags: ['Cinematic', 'Story-driven'] },
  { display_name: 'Backpack Ben', username: 'backpackben', tiktok_handle: '@backpackben', followers: 95000, avg_views: 18000, home_base: 'Chiang Mai, Thailand', country: 'Thailand', niches: ['Backpacking', 'Budget Asia'], style_tags: ['POV', 'Street food'] },
  { display_name: 'Island Luxe Studio', username: 'islandluxe', tiktok_handle: '@islandluxe', followers: 135000, avg_views: 52000, home_base: 'Mykonos, Greece', country: 'Greece', niches: ['Luxury', 'Beach clubs'], style_tags: ['Cinematic', 'Slow travel'] },
  { display_name: 'City Lights Leo', username: 'citylightsleo', tiktok_handle: '@citylightsleo', followers: 78000, avg_views: 26000, home_base: 'Paris, France', country: 'France', niches: ['City breaks', 'Food'], style_tags: ['POV', 'Coffee walks'] },
  { display_name: 'Desert Dunes Diaries', username: 'desertdunes', tiktok_handle: '@desertdunes', followers: 64000, avg_views: 24000, home_base: 'Dubai, UAE', country: 'UAE', niches: ['Luxury', 'Desert escapes'], style_tags: ['Cinematic', 'Drone'] },
  { display_name: 'Nordic Nights', username: 'nordicnights', tiktok_handle: '@nordicnights', followers: 56000, avg_views: 19000, home_base: 'Reykjavik, Iceland', country: 'Iceland', niches: ['Adventure', 'Wellness'], style_tags: ['Moody', 'Cinematic'] },
  { display_name: 'Honeymoon Harper', username: 'honeymoonharper', tiktok_handle: '@honeymoonharper', followers: 123000, avg_views: 41000, home_base: 'Florence, Italy', country: 'Italy', niches: ['Honeymoons', 'Europe'], style_tags: ['Soft glam', 'Couples'] },
  { display_name: 'Ski & Spritz', username: 'skiandspritz', tiktok_handle: '@skiandspritz', followers: 42000, avg_views: 15000, home_base: 'Zürich, Switzerland', country: 'Switzerland', niches: ['Ski', 'Luxury'], style_tags: ['POV', 'Resort tours'] },
  { display_name: 'Tokyo Night Trains', username: 'tokyonighttrains', tiktok_handle: '@tokyonighttrains', followers: 88000, avg_views: 33000, home_base: 'Tokyo, Japan', country: 'Japan', niches: ['City breaks', 'Food'], style_tags: ['Street', 'Train POV'] },
  { display_name: 'Bali Slow Days', username: 'balislowdays', tiktok_handle: '@balislowdays', followers: 150000, avg_views: 62000, home_base: 'Canggu, Indonesia', country: 'Indonesia', niches: ['Wellness', 'Surf'], style_tags: ['Slow travel', 'Retreats'] },
  { display_name: 'Morocco by Moonlight', username: 'moroccomoonlight', tiktok_handle: '@moroccomoonlight', followers: 67000, avg_views: 25000, home_base: 'Marrakesh, Morocco', country: 'Morocco', niches: ['Riads', 'Desert'], style_tags: ['Cinematic', 'Color-rich'] },
  { display_name: 'Coastal California Co.', username: 'coastalcalico', tiktok_handle: '@coastalcalico', followers: 54000, avg_views: 21000, home_base: 'Santa Barbara, USA', country: 'USA', niches: ['Road trips', 'US West'], style_tags: ['Drone', 'POV'] },
  { display_name: 'Safari & Sundowners', username: 'safarisundowners', tiktok_handle: '@safarisundowners', followers: 49000, avg_views: 18500, home_base: 'Nairobi, Kenya', country: 'Kenya', niches: ['Safari', 'Luxury'], style_tags: ['Wildlife', 'Cinematic'] },
  { display_name: 'Nordic Cabin Club', username: 'nordiccabinclub', tiktok_handle: '@nordiccabinclub', followers: 37000, avg_views: 14000, home_base: 'Oslo, Norway', country: 'Norway', niches: ['Cabins', 'Winter'], style_tags: ['Cozy', 'ASMR'] },
  { display_name: 'Hidden Ryokan', username: 'hiddenryokan', tiktok_handle: '@hiddenryokan', followers: 52000, avg_views: 20000, home_base: 'Kyoto, Japan', country: 'Japan', niches: ['Ryokan', 'Onsen'], style_tags: ['Slow travel', 'Ambient'] },
  { display_name: 'Amalfi Aperitivo', username: 'amalfiaperitivo', tiktok_handle: '@amalfiaperitivo', followers: 61000, avg_views: 23000, home_base: 'Positano, Italy', country: 'Italy', niches: ['Coastal', 'Luxury'], style_tags: ['Sunset', 'Cocktails'] },
  { display_name: 'Lisbon Lookbooks', username: 'lisbonlookbooks', tiktok_handle: '@lisbonlookbooks', followers: 43000, avg_views: 16000, home_base: 'Lisbon, Portugal', country: 'Portugal', niches: ['City breaks', 'Digital nomad'], style_tags: ['OOTD', 'Street'] },
  { display_name: 'Swiss Scenic Routes', username: 'swissscenicroutes', tiktok_handle: '@swissscenicroutes', followers: 38000, avg_views: 14500, home_base: 'Lucerne, Switzerland', country: 'Switzerland', niches: ['Train journeys', 'Alps'], style_tags: ['Drone', 'Cinematic'] },
  { display_name: 'Tulum Tapes', username: 'tulumtapes', tiktok_handle: '@tulumtapes', followers: 72000, avg_views: 28000, home_base: 'Tulum, Mexico', country: 'Mexico', niches: ['Wellness', 'Beach'], style_tags: ['Soft glam', 'Resorts'] },
  { display_name: 'Santorini Sunsets', username: 'santorinisunsets', tiktok_handle: '@santorinisunsets', followers: 98000, avg_views: 36000, home_base: 'Oia, Greece', country: 'Greece', niches: ['Honeymoons', 'Coastal'], style_tags: ['Golden hour', 'Cinematic'] },
  { display_name: 'Seoul Street Stories', username: 'seoulstreetstories', tiktok_handle: '@seoulstreetstories', followers: 66000, avg_views: 25000, home_base: 'Seoul, South Korea', country: 'South Korea', niches: ['City breaks', 'Food'], style_tags: ['Street', 'POV'] },
  { display_name: 'Cape Town Coastlines', username: 'capetowncoastlines', tiktok_handle: '@capetowncoastlines', followers: 50000, avg_views: 19000, home_base: 'Cape Town, South Africa', country: 'South Africa', niches: ['Adventure', 'Coastal'], style_tags: ['Drone', 'Sunset'] },
  { display_name: 'Vienna Vinyl & Views', username: 'viennavinylviews', tiktok_handle: '@viennavinylviews', followers: 31000, avg_views: 11000, home_base: 'Vienna, Austria', country: 'Austria', niches: ['City breaks', 'Culture'], style_tags: ['Vintage', 'Lo-fi'] },
  { display_name: 'Dubai Design District', username: 'dubaidesigndistrict', tiktok_handle: '@dubaidesigndistrict', followers: 84000, avg_views: 30000, home_base: 'Dubai, UAE', country: 'UAE', niches: ['Design hotels', 'Luxury'], style_tags: ['Cinematic', 'Architecture'] },
  { display_name: 'Sydney Sunrise Club', username: 'sydneysunriseclub', tiktok_handle: '@sydneysunriseclub', followers: 47000, avg_views: 17500, home_base: 'Sydney, Australia', country: 'Australia', niches: ['Surf', 'City breaks'], style_tags: ['POV', 'Morning routines'] },
  { display_name: 'New York Niche', username: 'newyorkniche', tiktok_handle: '@newyorkniche', followers: 125000, avg_views: 48000, home_base: 'New York, USA', country: 'USA', niches: ['Micro-stays', 'Hidden bars'], style_tags: ['Street', 'Story-driven'] },
  { display_name: 'Madrid Mezze & Markets', username: 'madridmezzemarkets', tiktok_handle: '@madridmezzemarkets', followers: 36000, avg_views: 13000, home_base: 'Madrid, Spain', country: 'Spain', niches: ['Food', 'City breaks'], style_tags: ['Street food', 'POV'] },
  { display_name: 'Copenhagen Cycle Stories', username: 'copenhagencyclestories', tiktok_handle: '@copenhagencyclestories', followers: 29000, avg_views: 10000, home_base: 'Copenhagen, Denmark', country: 'Denmark', niches: ['Cycling', 'Design'], style_tags: ['POV', 'Minimal'] },
  { display_name: 'Athens Alley Guides', username: 'athensalleyguides', tiktok_handle: '@athensalleyguides', followers: 34000, avg_views: 12000, home_base: 'Athens, Greece', country: 'Greece', niches: ['History', 'Food'], style_tags: ['Walking tours', 'Story-driven'] },
  { display_name: 'Quebec Quiet Stays', username: 'quebecquietstays', tiktok_handle: '@quebecquietstays', followers: 28000, avg_views: 9500, home_base: 'Quebec City, Canada', country: 'Canada', niches: ['Winter stays', 'Slow travel'], style_tags: ['Cozy', 'Cabin vibes'] },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = [];
    const errors = [];

    for (const creator of CREATORS) {
      try {
        const email = `${creator.username}@goldsainte-seed.com`;
        const password = 'SeedCreator2025!';

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: creator.display_name,
            username: creator.username,
          },
        });

        if (authError) {
          errors.push({ creator: creator.username, error: authError.message });
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            account_type: 'creator',
            display_name: creator.display_name,
            full_name: creator.display_name,
            username: creator.username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`,
            tiktok_handle: creator.tiktok_handle,
            tiktok_username: creator.username,
            creator_followers: creator.followers,
            creator_avg_views: creator.avg_views,
            home_base: creator.home_base,
            country: creator.country,
            creator_niches: creator.niches,
            content_style_tags: creator.style_tags,
            preferred_language: 'en',
            onboarding_completed: true,
            welcome_shown: true,
          });

        if (profileError) {
          errors.push({ creator: creator.username, error: profileError.message });
          continue;
        }

        results.push({
          username: creator.username,
          email,
          id: authData.user.id,
        });
      } catch (error) {
        errors.push({ creator: creator.username, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: results.length,
        total: CREATORS.length,
        results,
        errors,
        message: `Successfully created ${results.length} creator profiles`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Seed creators error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
