import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
}

interface DestinationConfig {
  destination: string;
  region: string;
  queries: string[];
  moodTags: string[];
  imagesPerQuery: number;
}

const DESTINATIONS: DestinationConfig[] = [
  {
    destination: 'Paris',
    region: 'Europe',
    queries: ['eiffel tower sunset', 'paris cafe street', 'louvre museum', 'montmartre paris', 'seine river'],
    moodTags: ['romantic', 'urban', 'culture', 'luxury'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Maldives',
    region: 'Asia',
    queries: ['maldives resort', 'overwater bungalow', 'maldives beach', 'tropical island paradise'],
    moodTags: ['luxury', 'beach', 'honeymoon', 'relaxation'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Tokyo',
    region: 'Asia',
    queries: ['tokyo skyline', 'shibuya crossing', 'tokyo temple', 'cherry blossom japan', 'tokyo nightlife'],
    moodTags: ['urban', 'culture', 'adventure', 'technology'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Santorini',
    region: 'Europe',
    queries: ['santorini sunset', 'santorini white buildings', 'oia greece', 'santorini blue dome'],
    moodTags: ['romantic', 'mediterranean', 'architecture', 'sunset'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Dubai',
    region: 'Middle East',
    queries: ['burj khalifa', 'dubai marina', 'dubai desert', 'palm jumeirah', 'dubai skyline'],
    moodTags: ['luxury', 'modern', 'desert', 'architecture'],
    imagesPerQuery: 2,
  },
  {
    destination: 'New York',
    region: 'North America',
    queries: ['new york skyline', 'times square', 'central park', 'brooklyn bridge'],
    moodTags: ['urban', 'iconic', 'culture', 'nightlife'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Bali',
    region: 'Asia',
    queries: ['bali rice terraces', 'bali temple', 'ubud bali', 'bali beach resort'],
    moodTags: ['tropical', 'culture', 'nature', 'relaxation'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Iceland',
    region: 'Europe',
    queries: ['iceland waterfall', 'northern lights iceland', 'blue lagoon iceland', 'iceland glacier'],
    moodTags: ['nature', 'adventure', 'scenic', 'unique'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Barcelona',
    region: 'Europe',
    queries: ['sagrada familia barcelona', 'park guell', 'barcelona beach', 'gothic quarter barcelona'],
    moodTags: ['culture', 'architecture', 'beach', 'art'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Rome',
    region: 'Europe',
    queries: ['colosseum rome', 'trevi fountain', 'vatican city', 'roman forum', 'rome piazza'],
    moodTags: ['historic', 'culture', 'architecture', 'romantic'],
    imagesPerQuery: 2,
  },
  {
    destination: 'London',
    region: 'Europe',
    queries: ['london tower bridge', 'big ben', 'london eye', 'piccadilly circus'],
    moodTags: ['urban', 'historic', 'culture', 'iconic'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Singapore',
    region: 'Asia',
    queries: ['singapore marina bay', 'gardens by the bay', 'singapore skyline', 'sentosa island'],
    moodTags: ['modern', 'urban', 'luxury', 'futuristic'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Sydney',
    region: 'Oceania',
    queries: ['sydney opera house', 'bondi beach', 'sydney harbour bridge', 'sydney skyline'],
    moodTags: ['iconic', 'beach', 'urban', 'adventure'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Cape Town',
    region: 'Africa',
    queries: ['table mountain cape town', 'cape town waterfront', 'camps bay beach', 'cape point'],
    moodTags: ['nature', 'adventure', 'scenic', 'beach'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Machu Picchu',
    region: 'South America',
    queries: ['machu picchu sunrise', 'inca trail peru', 'machu picchu ruins', 'peru mountains'],
    moodTags: ['historic', 'adventure', 'nature', 'bucket-list'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Rio de Janeiro',
    region: 'South America',
    queries: ['christ the redeemer', 'copacabana beach', 'rio de janeiro sunset', 'sugarloaf mountain'],
    moodTags: ['beach', 'urban', 'culture', 'vibrant'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Amsterdam',
    region: 'Europe',
    queries: ['amsterdam canals', 'amsterdam tulips', 'amsterdam bike', 'rijksmuseum'],
    moodTags: ['culture', 'romantic', 'architecture', 'scenic'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Bangkok',
    region: 'Asia',
    queries: ['bangkok grand palace', 'bangkok floating market', 'wat arun temple', 'bangkok street food'],
    moodTags: ['culture', 'urban', 'adventure', 'food'],
    imagesPerQuery: 2,
  },
  {
    destination: 'Swiss Alps',
    region: 'Europe',
    queries: ['swiss alps mountains', 'matterhorn', 'swiss village', 'alps hiking'],
    moodTags: ['nature', 'adventure', 'scenic', 'winter'],
    imagesPerQuery: 3,
  },
  {
    destination: 'Morocco',
    region: 'Africa',
    queries: ['marrakech morocco', 'sahara desert morocco', 'chefchaouen blue city', 'morocco market'],
    moodTags: ['culture', 'desert', 'adventure', 'exotic'],
    imagesPerQuery: 2,
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashAccessKey) {
      throw new Error("UNSPLASH_ACCESS_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { destinations, limit } = await req.json();
    const targetDestinations = destinations || DESTINATIONS;
    const maxImages = limit || 200;

    console.log(`Starting storyboard media seeding for ${targetDestinations.length} destinations`);

    let totalInserted = 0;
    const errors: string[] = [];

    for (const config of targetDestinations) {
      if (totalInserted >= maxImages) break;

      console.log(`Fetching images for ${config.destination}...`);

      for (const query of config.queries) {
        if (totalInserted >= maxImages) break;

        try {
          // Fetch from Unsplash API
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${config.imagesPerQuery}&orientation=landscape`,
            {
              headers: {
                'Authorization': `Client-ID ${unsplashAccessKey}`,
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const photos: UnsplashPhoto[] = data.results;

          console.log(`Found ${photos.length} photos for query "${query}"`);

          for (const photo of photos) {
            if (totalInserted >= maxImages) break;

            // Check if image already exists
            const { data: existing } = await supabase
              .from('storyboard_media_library')
              .select('id')
              .eq('url', photo.urls.regular)
              .single();

            if (existing) {
              console.log(`Skipping duplicate image: ${photo.id}`);
              continue;
            }

            // Create label with photo description and photographer attribution
            const label = photo.alt_description || photo.description || `${config.destination} view`;
            const attribution = `Photo by ${photo.user.name} on Unsplash`;

            // Determine if this should be featured (30% chance for high-quality images)
            const isFeatured = Math.random() > 0.7;

            // Insert into database
            const { error } = await supabase
              .from('storyboard_media_library')
              .insert({
                url: photo.urls.regular,
                thumbnail_url: photo.urls.small,
                label: `${label} - ${attribution}`,
                destination_tags: [config.destination, config.region],
                mood_tags: config.moodTags,
                is_featured: isFeatured,
                created_by: null, // System-generated
              });

            if (error) {
              console.error(`Failed to insert image ${photo.id}:`, error);
              errors.push(`${photo.id}: ${error.message}`);
            } else {
              totalInserted++;
              console.log(`Inserted image ${totalInserted}/${maxImages}: ${label}`);
            }

            // Track download for Unsplash API guidelines
            try {
              await fetch(photo.user.links.html);
            } catch (e) {
              console.warn('Failed to track Unsplash download:', e);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing query "${query}":`, error);
          errors.push(`Query "${query}": ${errorMessage}`);
        }

        // Rate limiting: wait 1 second between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Seeding complete. Inserted ${totalInserted} images`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully seeded ${totalInserted} images into storyboard_media_library`,
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in seed-storyboard-media function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
