import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple faker-like utilities
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBoolean = (probability = 0.5): boolean => Math.random() < probability;

const THEMES = ["travel", "luxury", "adventure", "wellness", "urban"];
const LOCATIONS = [
  "Bali, Indonesia", "Paris, France", "Tokyo, Japan", "Santorini, Greece",
  "Dubai, UAE", "New York, USA", "Maldives", "Barcelona, Spain",
  "Iceland", "Thailand", "Morocco", "Switzerland", "Italy", "Portugal"
];
const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sage", "Quinn", "River", "Skylar"];
const LAST_NAMES = ["Chen", "Rodriguez", "Kim", "Patel", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson"];
const CATCHPHRASES = [
  "Living my best life", "Wanderlust & city dust", "Creating memories worldwide",
  "Luxury lifestyle curator", "Adventure seeker", "Travel content creator",
  "Exploring hidden gems", "Passport full of stories", "Making the world smaller",
  "Professional wanderer"
];
const CONTENT_TAGS = ["beach", "luxury", "spa", "cityscape", "adventure", "food", "sunset", "architecture"];

function generateUsername(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(10, 99)}`;
}

function generateUnsplashUrl(keywords: string[]): string {
  return `https://source.unsplash.com/800x800/?${keywords.join(',')}`;
}

function generateRecentDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString();
}

function generateCaption(theme: string, location: string): string {
  const captions = [
    `Can't get enough of ${location}! 🌍✨`,
    `Living for moments like this in ${location} 💫`,
    `${location} vibes hitting different 🔥`,
    `Found paradise in ${location} 🌴`,
    `This is what dreams are made of ✈️`,
    `Making memories in ${location} 📸`,
    `Travel more, worry less 🌊`,
    `Exploring ${location} one adventure at a time 🗺️`
  ];
  return randomElement(captions) + ` #travel #${theme} #wanderlust #explore`;
}

async function checkExistingData(supabase: any) {
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('account_type', 'creator');
  
  const { count: postCount } = await supabase
    .from('travel_posts')
    .select('*', { count: 'exact', head: true });
  
  const { count: collectionCount } = await supabase
    .from('post_collections')
    .select('*', { count: 'exact', head: true });

  return {
    hasData: (profileCount || 0) > 0 || (postCount || 0) > 0 || (collectionCount || 0) > 0,
    counts: {
      profiles: profileCount || 0,
      posts: postCount || 0,
      collections: collectionCount || 0
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { numCreators = 15, mode = 'new', skipCheck = false } = await req.json().catch(() => ({}));

    // Check existing data unless skipCheck is true
    if (!skipCheck) {
      const existingData = await checkExistingData(supabase);
      
      if (existingData.hasData && mode === 'new') {
        return new Response(
          JSON.stringify({
            warning: true,
            message: 'Database already contains seeded data',
            existing: existingData.counts,
            suggestion: 'Use mode="hybrid" to add to existing creators or clear data first'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Starting seed process: mode=${mode}, numCreators=${numCreators}...`);
    
    const createdProfiles = [];
    const createdPosts = [];
    const createdFollows = [];
    const createdCollections = [];

    // Hybrid mode: add content to existing + create new
    if (mode === 'hybrid') {
      const { data: existingCreators } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('account_type', 'creator')
        .limit(50);

      const numExistingToEnhance = Math.min(
        existingCreators?.length || 0,
        Math.floor(numCreators * 0.7)
      );

      console.log(`Enhancing ${numExistingToEnhance} existing creators with new posts...`);
      
      // Add 3-5 new posts to existing creators
      for (let i = 0; i < numExistingToEnhance && existingCreators; i++) {
        const creator = existingCreators[i];
        const theme = randomElement(THEMES);
        const numNewPosts = randomInt(3, 5);
        
        for (let j = 0; j < numNewPosts; j++) {
          const postTag = randomElement(CONTENT_TAGS);
          const postLocation = randomElement(LOCATIONS);
          
          const post = {
            user_id: creator.id,
            media_type: 'image',
            image_urls: [generateUnsplashUrl([postTag, theme, 'travel'])],
            caption: generateCaption(theme, postLocation),
            location: postLocation,
            like_count: randomInt(500, 75000),
            view_count: randomInt(2000, 500000),
            comment_count: randomInt(20, 3000),
            share_count: randomInt(10, 1500),
            is_original_content: true,
            visibility: 'public',
            status: 'active',
            created_at: generateRecentDate(180),
          };

          const { data: postData, error: postError } = await supabase
            .from('travel_posts')
            .insert(post)
            .select()
            .single();

          if (!postError && postData) {
            createdPosts.push(postData);
          }
        }
      }

      // Adjust numCreators to create fewer new ones (30%)
      const adjustedNumCreators = Math.ceil(numCreators * 0.3);
      console.log(`Creating ${adjustedNumCreators} new creators in hybrid mode...`);
      
      for (let i = 0; i < adjustedNumCreators; i++) {
        const theme = randomElement(THEMES);
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const username = generateUsername(firstName, lastName);
        const location = randomElement(LOCATIONS);
        const email = `${username}@seed.local`;
        const password = crypto.randomUUID();
        
        // Create auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: generateUnsplashUrl([theme, 'portrait', 'person']),
          }
        });

        if (authError || !authUser.user) {
          console.error(`Error creating auth user ${username}:`, authError);
          continue;
        }

        // Update or upsert the profile with rich seeded data (handles missing trigger timing)
        const updatePayload = {
          bio: `${randomElement(CATCHPHRASES)} | ${theme.charAt(0).toUpperCase() + theme.slice(1)} content | ${location}`,
          location,
          website: `https://${username}.com`,
          instagram_username: `@${username}`,
          tiktok_username: `@${username}`,
          account_type: 'creator',
          is_verified: randomBoolean(0.4),
          seed_metadata: { seeded_by: 'seed-content-creators', created_at: new Date().toISOString() }
        } as const;

        const { data: profileMaybe, error: profileUpdateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', authUser.user.id)
          .select()
          .maybeSingle();

        let profileData = profileMaybe;

        if (!profileData) {
          // If the profile row does not exist yet (trigger lag or missing), upsert it
          const upsertPayload = {
            id: authUser.user.id,
            username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: generateUnsplashUrl([theme, 'portrait', 'person']),
            ...updatePayload,
          };

          const { data: upserted, error: upsertError } = await supabase
            .from('profiles')
            .upsert(upsertPayload)
            .select()
            .single();

          if (upsertError) {
            console.error(`Error upserting profile ${username}:`, upsertError, profileUpdateError);
            continue;
          }

          profileData = upserted;
        }

        createdProfiles.push(profileData);
        console.log(`Created profile: ${username}`);

        // Create 6-10 travel posts for this creator
        const numPosts = randomInt(6, 10);
        for (let j = 0; j < numPosts; j++) {
          const postTag = randomElement(CONTENT_TAGS);
          const postLocation = randomElement(LOCATIONS);
          
          const post = {
            user_id: profileData.id,
            media_type: 'image',
            image_urls: [generateUnsplashUrl([postTag, theme, 'travel'])],
            caption: generateCaption(theme, postLocation),
            location: postLocation,
            like_count: randomInt(500, 75000),
            view_count: randomInt(2000, 500000),
            comment_count: randomInt(20, 3000),
            share_count: randomInt(10, 1500),
            is_original_content: true,
            visibility: 'public',
            status: 'active',
            created_at: generateRecentDate(180),
          };

          const { data: postData, error: postError } = await supabase
            .from('travel_posts')
            .insert(post)
            .select()
            .single();

          if (!postError && postData) {
            createdPosts.push(postData);
          }
        }

        // Create 2-3 collections for this creator
        const numCollections = randomInt(2, 3);
        const collectionThemes = ["Hidden Gems", "Luxury Stays", "Food Adventures", "City Guides", "Beach Escapes"];
        
        for (let k = 0; k < numCollections; k++) {
          const collectionName = randomElement(collectionThemes);
          
          const collection = {
            user_id: profileData.id,
            name: `${collectionName} ${randomInt(2023, 2024)}`,
            description: `My favorite ${collectionName.toLowerCase()} from around the world`,
            cover_image_url: generateUnsplashUrl([theme, 'travel', 'collection']),
            is_private: false,
          };

          const { data: collectionData, error: collectionError } = await supabase
            .from('post_collections')
            .insert(collection)
            .select()
            .single();

          if (!collectionError && collectionData) {
            createdCollections.push(collectionData);
          }
        }
      }
    } else {
      // Original "new" mode: create all new creators
      for (let i = 0; i < numCreators; i++) {
        const theme = randomElement(THEMES);
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const username = generateUsername(firstName, lastName);
        const location = randomElement(LOCATIONS);
        const email = `${username}@seed.local`;
        const password = crypto.randomUUID();
        
        // Create auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: generateUnsplashUrl([theme, 'portrait', 'person']),
          }
        });

        if (authError || !authUser.user) {
          console.error(`Error creating auth user ${username}:`, authError);
          continue;
        }

        // Update or upsert the profile with rich seeded data (handles missing trigger timing)
        const updatePayload = {
          bio: `${randomElement(CATCHPHRASES)} | ${theme.charAt(0).toUpperCase() + theme.slice(1)} content | ${location}`,
          location,
          website: `https://${username}.com`,
          instagram_username: `@${username}`,
          tiktok_username: `@${username}`,
          account_type: 'creator',
          is_verified: randomBoolean(0.4),
          seed_metadata: { seeded_by: 'seed-content-creators', created_at: new Date().toISOString() }
        } as const;

        const { data: profileMaybe, error: profileUpdateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', authUser.user.id)
          .select()
          .maybeSingle();

        let profileData = profileMaybe;

        if (!profileData) {
          // If the profile row does not exist yet (trigger lag or missing), upsert it
          const upsertPayload = {
            id: authUser.user.id,
            username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: generateUnsplashUrl([theme, 'portrait', 'person']),
            ...updatePayload,
          };

          const { data: upserted, error: upsertError } = await supabase
            .from('profiles')
            .upsert(upsertPayload)
            .select()
            .single();

          if (upsertError) {
            console.error(`Error upserting profile ${username}:`, upsertError, profileUpdateError);
            continue;
          }

          profileData = upserted;
        }

        createdProfiles.push(profileData);
        console.log(`Created profile: ${username}`);

        // Create 6-10 travel posts for this creator
        const numPosts = randomInt(6, 10);
        for (let j = 0; j < numPosts; j++) {
          const postTag = randomElement(CONTENT_TAGS);
          const postLocation = randomElement(LOCATIONS);
          
          const post = {
            user_id: profileData.id,
            media_type: 'image',
            image_urls: [generateUnsplashUrl([postTag, theme, 'travel'])],
            caption: generateCaption(theme, postLocation),
            location: postLocation,
            like_count: randomInt(500, 75000),
            view_count: randomInt(2000, 500000),
            comment_count: randomInt(20, 3000),
            share_count: randomInt(10, 1500),
            is_original_content: true,
            visibility: 'public',
            status: 'active',
            created_at: generateRecentDate(180),
          };

          const { data: postData, error: postError } = await supabase
            .from('travel_posts')
            .insert(post)
            .select()
            .single();

          if (!postError && postData) {
            createdPosts.push(postData);
          }
        }

        // Create 2-3 collections for this creator
        const numCollections = randomInt(2, 3);
        const collectionThemes = ["Hidden Gems", "Luxury Stays", "Food Adventures", "City Guides", "Beach Escapes"];
        
        for (let k = 0; k < numCollections; k++) {
          const collectionName = randomElement(collectionThemes);
          
          const collection = {
            user_id: profileData.id,
            name: `${collectionName} ${randomInt(2023, 2024)}`,
            description: `My favorite ${collectionName.toLowerCase()} from around the world`,
            cover_image_url: generateUnsplashUrl([theme, 'travel', 'collection']),
            is_private: false,
          };

          const { data: collectionData, error: collectionError } = await supabase
            .from('post_collections')
            .insert(collection)
            .select()
            .single();

          if (!collectionError && collectionData) {
            createdCollections.push(collectionData);
          }
        }
      }
    }

    // Create follower relationships between creators
    console.log('Creating follower relationships...');
    for (let i = 0; i < createdProfiles.length; i++) {
      const numFollows = randomInt(3, 8);
      const followersSet = new Set<number>();
      
      while (followersSet.size < numFollows && followersSet.size < createdProfiles.length - 1) {
        const randomIndex = randomInt(0, createdProfiles.length - 1);
        if (randomIndex !== i) {
          followersSet.add(randomIndex);
        }
      }

      for (const followerIndex of followersSet) {
        const follow = {
          follower_id: createdProfiles[followerIndex].id,
          following_id: createdProfiles[i].id,
        };

        const { error: followError } = await supabase
          .from('user_follows')
          .insert(follow);

        if (!followError) {
          createdFollows.push(follow);
        }
      }
    }

    console.log('Seeding completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        stats: {
          profiles: createdProfiles.length,
          posts: createdPosts.length,
          follows: createdFollows.length,
          collections: createdCollections.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in seed-content-creators:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
