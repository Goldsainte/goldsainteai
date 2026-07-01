import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// ─────────────────────────────────────────────────────────────────────────
// Goldsainte Concierge desks.
//
// These are NOT fabricated individual creators. Every profile is explicitly
// attributed to the Goldsainte team in its own bio — no fake name, no fake
// face, no fabricated follower/engagement numbers. Avatars are real,
// properly-licensed Unsplash destination photography (same API + attribution
// pattern already used by seed-storyboard-media), not stock photos of people.
//
// Each account's login email is a plus-addressed variant of a real staff
// inbox, so the existing dispatch-message-email cron (which emails whatever
// address is on the recipient's auth account) routes traveler messages there
// automatically — no new notification code needed.
// ─────────────────────────────────────────────────────────────────────────

const CONCIERGE_INBOX = "a.powell@cornellfacilities.com";

interface DeskConfig {
  slug: string;
  region: string;
  hub: string; // city, country — where the desk is based/focused
  country: string;
  niches: string[];
  bio: string;
  unsplashQuery: string;
}

const DESKS: DeskConfig[] = [
  {
    slug: "concierge.southeastasia",
    region: "Southeast Asia",
    hub: "Bangkok, Thailand",
    country: "Thailand",
    niches: ["Adventure", "Wellness", "Food"],
    bio: "Run by the Goldsainte team, our Southeast Asia desk designs trips across Thailand, Vietnam, and Indonesia — from quiet wellness retreats to street-food-driven city days. We work directly with vetted local guides and properties to build itineraries suited to how you actually want to travel.",
    unsplashQuery: "thailand temple tropical",
  },
  {
    slug: "concierge.mediterranean",
    region: "Mediterranean Europe",
    hub: "Santorini, Greece",
    country: "Greece",
    niches: ["Luxury", "Romantic", "Coastal"],
    bio: "Run by the Goldsainte team, our Mediterranean desk specializes in Greece, Italy, and the Amalfi and Adriatic coasts — coastal villas, island-hopping, and long, unhurried dinners. Every itinerary is built around real local knowledge, not a template.",
    unsplashQuery: "santorini mediterranean coast",
  },
  {
    slug: "concierge.eastafrica",
    region: "East Africa Safari",
    hub: "Nairobi, Kenya",
    country: "Kenya",
    niches: ["Safari", "Wildlife", "Adventure"],
    bio: "Run by the Goldsainte team, our East Africa desk focuses on safari experiences across Kenya and Tanzania — working with licensed guides and conservation-minded camps to build trips around the migration and genuine wildlife encounters.",
    unsplashQuery: "kenya safari savanna",
  },
  {
    slug: "concierge.andean",
    region: "Andean South America",
    hub: "Cusco, Peru",
    country: "Peru",
    niches: ["Culture", "Adventure", "Mountains"],
    bio: "Run by the Goldsainte team, our Andean desk designs journeys through Peru and Chile — from the Inca Trail to the Atacama Desert — built around proper acclimatization, local guides, and routes that go past the standard tourist circuit.",
    unsplashQuery: "machu picchu andes peru",
  },
  {
    slug: "concierge.japankorea",
    region: "Japan & Korea",
    hub: "Kyoto, Japan",
    country: "Japan",
    niches: ["Culture", "City", "Food"],
    bio: "Run by the Goldsainte team, our Japan & Korea desk plans trips across both countries — from Kyoto's temples to Seoul's neighborhoods — with a focus on seasonal timing, ryokan stays, and food-forward itineraries built around where locals actually eat.",
    unsplashQuery: "kyoto japan temple autumn",
  },
  {
    slug: "concierge.nordic",
    region: "Nordic & Iceland",
    hub: "Reykjavik, Iceland",
    country: "Iceland",
    niches: ["Nature", "Adventure", "Wellness"],
    bio: "Run by the Goldsainte team, our Nordic desk covers Iceland, Norway, and Finland — glacier hikes, the northern lights, and remote cabin stays — with itineraries timed around weather, daylight, and the right season for what you want to see.",
    unsplashQuery: "iceland glacier northern lights",
  },
  {
    slug: "concierge.mena",
    region: "Middle East & North Africa",
    hub: "Marrakech, Morocco",
    country: "Morocco",
    niches: ["Culture", "Luxury", "Desert"],
    bio: "Run by the Goldsainte team, our Middle East & North Africa desk designs trips through Morocco, Jordan, and the UAE — desert camps, riads, and old-city routes — built with local guides who know the difference between a tourist stop and the real thing.",
    unsplashQuery: "morocco desert marrakech",
  },
  {
    slug: "concierge.caribbean",
    region: "Caribbean",
    hub: "Nassau, Bahamas",
    country: "Bahamas",
    niches: ["Beach", "Luxury", "Romantic"],
    bio: "Run by the Goldsainte team, our Caribbean desk focuses on the islands beyond the standard resort loop — private villas, sailing charters, and quieter beaches — matched to how much, or how little, you want planned.",
    unsplashQuery: "caribbean beach turquoise",
  },
  {
    slug: "concierge.centralamerica",
    region: "Central America",
    hub: "San José, Costa Rica",
    country: "Costa Rica",
    niches: ["Adventure", "Nature", "Wellness"],
    bio: "Run by the Goldsainte team, our Central America desk plans trips through Costa Rica, Belize, and Panama — rainforest lodges, volcano hikes, and reef diving — with routes built around real logistics, not just highlight reels.",
    unsplashQuery: "costa rica rainforest jungle",
  },
  {
    slug: "concierge.oceania",
    region: "Oceania",
    hub: "Queenstown, New Zealand",
    country: "New Zealand",
    niches: ["Adventure", "Nature", "Luxury"],
    bio: "Run by the Goldsainte team, our Oceania desk covers New Zealand, Australia, and Fiji — from South Island road trips to reef diving — designed around drive times, seasons, and the pace you actually want.",
    unsplashQuery: "new zealand mountains lake",
  },
];

interface UnsplashPhoto {
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
  links: { download_location: string };
}

async function fetchDeskPhoto(query: string, accessKey: string): Promise<{ url: string; thumb: string } | null> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const photo: UnsplashPhoto | undefined = data.results?.[0];
    if (!photo) return null;

    // Track download per Unsplash API guidelines
    try {
      await fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${accessKey}` } });
    } catch {
      // non-fatal
    }

    return { url: photo.urls.regular, thumb: photo.urls.small };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 🔒 AUTH: admin only
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id);
    if (!roles?.some((r: { role: string }) => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashAccessKey) {
      return new Response(JSON.stringify({ error: 'UNSPLASH_ACCESS_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const results: unknown[] = [];
    const errors: unknown[] = [];

    for (const desk of DESKS) {
      try {
        // Idempotency: skip if this desk already exists, so re-running this
        // (e.g. an accidental double-click) never creates duplicates.
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('username', desk.slug)
          .maybeSingle();
        if (existing) {
          results.push({ region: desk.region, skipped: true, reason: 'already exists' });
          continue;
        }

        const email = `a.powell+${desk.slug}@cornellfacilities.com`;
        const displayName = `Goldsainte Concierge — ${desk.region}`;

        const photo = await fetchDeskPhoto(desk.unsplashQuery, unsplashAccessKey);

        const password = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            is_goldsainte_concierge_desk: true, // internal marker only — not shown publicly
            concierge_region: desk.region,
          },
        });

        if (authError) {
          errors.push({ desk: desk.slug, error: authError.message });
          continue;
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            account_type: 'creator',
            display_name: displayName,
            full_name: displayName,
            username: desk.slug,
            avatar_url: photo?.url ?? null,
            bio: desk.bio,
            home_base: desk.hub,
            country: desk.country,
            creator_niches: desk.niches,
            is_verified: true,
            preferred_language: 'en',
            onboarding_completed: true,
            welcome_shown: true,
          });

        if (profileError) {
          errors.push({ desk: desk.slug, error: profileError.message });
          continue;
        }

        results.push({ region: desk.region, email, id: authData.user.id, photoFound: !!photo });
      } catch (error) {
        errors.push({ desk: desk.slug, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: results.length,
        total: DESKS.length,
        results,
        errors,
        message: `Created ${results.length} of ${DESKS.length} Goldsainte Concierge desks. All messages route to ${CONCIERGE_INBOX} via plus-addressing.`,
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('seed-concierge-desks error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
