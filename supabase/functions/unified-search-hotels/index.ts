import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Database cache with 24-hour TTL
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fetch curated hotels from database
async function getCuratedHotels(supabase: any, cityCode: string) {
  const { data, error } = await supabase
    .from('curated_hotels')
    .select('*')
    .eq('city_code', cityCode)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching curated hotels:', error);
    return [];
  }
  
  return data || [];
}

function getCacheKey(params: any): string {
  return `hotels|${JSON.stringify(params)}`;
}

async function getFromCache(supabase: any, key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}

async function setCache(supabase: any, key: string, data: any): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL);
    await supabase
      .from('search_cache')
      .upsert({
        cache_key: key,
        data,
        expires_at: expiresAt.toISOString()
      });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function getAmadeusToken() {
  const apiKey = Deno.env.get("AMADEUS_API_KEY");
  const apiSecret = Deno.env.get("AMADEUS_API_SECRET");
  if (!apiKey || !apiSecret) throw new Error("Amadeus credentials not configured");

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

async function resolveCityCode(token: string, location: string): Promise<string> {
  const raw = (location || "").trim().toLowerCase();
  const base = raw.split(",")[0];

  // First handle well-known neighborhoods/boroughs that should map to metro codes
  const boroughs: Record<string, string> = {
    // New York City boroughs and popular areas
    "manhattan": "NYC",
    "brooklyn": "NYC",
    "queens": "NYC",
    "bronx": "NYC",
    "staten island": "NYC",
    "times square": "NYC",
    "soho": "NYC",
    "upper east side": "NYC",
    "upper west side": "NYC",
    "tribeca": "NYC",
    "chelsea": "NYC",
    "harlem": "NYC",
  };
  if (boroughs[base]) return boroughs[base];

  // Try Amadeus Locations API
  const params = new URLSearchParams({ keyword: location, subType: "CITY", "page[limit]": "1" });
  const r = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.ok) {
    const j = await r.json();
    const code = j?.data?.[0]?.iataCode;
    if (typeof code === "string" && code.length === 3) return code;
  }
  // Fallback mapping for common cities
  const map: Record<string, string> = {
    "new york": "NYC", "los angeles": "LAX", "san francisco": "SFO", "washington": "WAS",
    "chicago": "CHI", "miami": "MIA", "seattle": "SEA", "atlanta": "ATL", "dallas": "DFW",
    "houston": "HOU", "phoenix": "PHX", "denver": "DEN", "orlando": "ORL", "detroit": "DTW",
    "minneapolis": "MSP", "portland": "PDX", "san diego": "SAN", "austin": "AUS", "nashville": "BNA",
    "charlotte": "CLT", "boston": "BOS", "las vegas": "LAS",
    "paris": "PAR", "london": "LON", "tokyo": "TYO",
    // Japan specific city fallbacks
    "kyoto": "UKY", "osaka": "OSA",
  };
  const cityName = base;
  return map[cityName] || (cityName.replace(/\s+/g, "").slice(0, 3).toUpperCase() || "NYC");
}

async function fetchAmadeusHotels(token: string, cityCode: string, checkIn: string, checkOut: string, adults: number) {
  // 1) Get hotel IDs in city
  console.log(`Fetching hotels for city code: ${cityCode}`);
  const listRes = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (!listRes.ok) {
    const errorText = await listRes.text();
    console.error(`Hotel list failed: ${listRes.status}`, errorText);
    throw new Error(`Hotel list failed: ${listRes.status}`);
  }
  
  const list = await listRes.json();
  const idArray: string[] = (list.data || []).map((h: any) => h.hotelId).filter(Boolean);
  console.log(`Found ${idArray.length} hotels in city`);
  
  if (!idArray.length) {
    console.warn("No hotel IDs found for city code:", cityCode);
    return [] as any[];
  }

  // 2) Fetch offers in chunks to avoid URL length/400 errors
  const MAX_IDS = 100; // cap total ids to keep URLs reasonable
  const CHUNK_SIZE = 25; // safe chunk size for query string
  const toProcess = idArray.slice(0, MAX_IDS);

  const chunks: string[][] = [];
  for (let i = 0; i < toProcess.length; i += CHUNK_SIZE) {
    chunks.push(toProcess.slice(i, i + CHUNK_SIZE));
  }

  const aggregated: any[] = [];

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      hotelIds: chunk.join(','),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: String(Math.max(1, Number(adults) || 1)),
      currency: "USD",
      roomQuantity: "1",
      bestRateOnly: "true",
    });

    try {
      console.log(`Fetching offers for chunk size ${chunk.length}`);
      const offersRes = await fetch(`https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!offersRes.ok) {
        const errorText = await offersRes.text();
        console.error(`Hotel offers failed (status ${offersRes.status}) for chunk:`, errorText);
        // On error, skip this chunk and continue
        continue;
      }

      const offers = await offersRes.json();
      console.log(`Raw offers response for chunk:`, JSON.stringify(offers).substring(0, 500));
      console.log(`Total offers in chunk: ${offers.data?.length || 0}`);
      
      const available = (offers.data || []).filter((h: any) => {
        const hasOffers = h.offers && h.offers.length > 0;
        const isAvailable = h.available !== false; // Check if explicitly false
        console.log(`Hotel ${h.hotel?.name}: available=${h.available}, offers=${h.offers?.length || 0}`);
        return isAvailable && hasOffers;
      });
      
      console.log(`Available hotels in this chunk: ${available.length}`);
      aggregated.push(...available);
    } catch (e) {
      console.error('Error fetching offers for chunk:', e);
      // Skip failed chunk
    }
  }

  console.log(`Total available hotel offers aggregated: ${aggregated.length}`);
  
  // If no hotels found, provide helpful error message
  if (aggregated.length === 0 && idArray.length > 0) {
    console.warn(`⚠️ Amadeus API found ${idArray.length} hotels in ${cityCode} but returned 0 offers for ${checkIn} to ${checkOut}`);
    console.warn('This often happens when:');
    console.warn('1. Dates are too far in the future (test API typically has 1-3 months availability)');
    console.warn('2. Dates are in the past');
    console.warn('3. No availability for those specific dates');
  }
  
  return aggregated;
}

async function enrichWithGooglePlaces(hotels: any[], location: string) {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.log("Google Places API key not configured, skipping photo/review enrichment");
    return hotels;
  }

  // Only enrich top 10 hotels for speed
  const limit = Math.min(hotels.length, 10);
  const target = hotels.slice(0, limit);
  console.log(`Enriching ${target.length} hotels with Google Places (optimized)...`);

  // Increased batch size for faster parallel processing
  const batchSize = 10;
  await Promise.all(
    target.map(async (hotel: any) => {
      try {
        const name = hotel.hotel?.name || "";
        const city = hotel.hotel?.address?.cityName || (location.split(",")[0] || "");

        // Text Search for hotel - reduced field mask for faster response
        const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.photos,places.rating,places.userRatingCount,places.reviews"
          },
          body: JSON.stringify({
            textQuery: `${name} hotel ${city}`,
            maxResultCount: 1
          })
        });

        if (!searchRes.ok) {
          return;
        }

        const searchData = await searchRes.json();
        if (!searchData.places || searchData.places.length === 0) return;

        const place = searchData.places[0];

        // Reduced photos (6 instead of 12) for faster load
        hotel.__googlePhotos = (place.photos || []).slice(0, 6).map((photo: any) => ({
          url: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=1200`,
          attribution: photo.authorAttributions?.[0]?.displayName || ""
        }));

        // Reduced reviews (3 instead of 5) for faster processing
        hotel.__googleReviews = (place.reviews || []).slice(0, 3).map((review: any) => ({
          author: review.authorAttribution?.displayName || "Anonymous",
          rating: review.rating || 0,
          text: review.text?.text || review.originalText?.text || "",
          date: review.publishTime || "",
          relativeTime: review.relativePublishTimeDescription || ""
        }));

        // Overall rating
        hotel.__googleRating = place.rating || 0;
        hotel.__googleRatingCount = place.userRatingCount || 0;
      } catch (e) {
        // Silently skip enrichment failures
      }
    })
  );
  
  const enrichedCount = hotels.filter(h => h.__googlePhotos?.length > 0).length;
  console.log(`Google Places enrichment complete: ${enrichedCount}/${target.length} hotels have photos`);
  return hotels;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
  
  try {
    const { location, checkIn, checkOut, guests = 2, sortBy = 'best_value' } = await req.json();
    if (!location || !checkIn || !checkOut) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: "Missing location/checkIn/checkOut" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Initialize Supabase client for ranking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Unified hotel search:", { location, checkIn, checkOut, guests });
    
    const searchStart = Date.now();

    // Check database cache first
    const cacheKey = getCacheKey({ location, checkIn, checkOut, guests });
    const cachedResult = await getFromCache(supabaseClient, cacheKey);
    
    if (cachedResult) {
      clearTimeout(timeoutId);
      console.log('Returning cached hotel results');
      return new Response(JSON.stringify({ 
        ...cachedResult,
        cached: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = await getAmadeusToken();
    const cityCode = await resolveCityCode(token, location);

    const amadeusHotels = await fetchAmadeusHotels(token, cityCode, checkIn, checkOut, Number(guests) || 2);
    console.log("Amadeus hotels fetched:", amadeusHotels.length);

    let enriched = await enrichWithGooglePlaces(amadeusHotels, location);

    // If no hotels from Amadeus, use curated recommendations from database
    if (enriched.length === 0) {
      console.log(`No Amadeus results, fetching curated recommendations for ${cityCode}`);
      const curatedHotels = await getCuratedHotels(supabaseClient, cityCode);
      
      if (curatedHotels.length > 0) {
        // Transform curated hotels to match Amadeus format
        const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
        
        enriched = curatedHotels.map((hotel: any) => ({
          id: `curated-${hotel.id}`,
          hotel: {
            name: hotel.name,
            address: {
              lines: [hotel.address],
              cityName: hotel.city,
              countryCode: hotel.country_code
            },
            amenities: hotel.amenities,
            rating: hotel.rating
          },
          offers: [{
            id: `offer-curated-${hotel.id}`,
            price: {
              total: (hotel.price_per_night * nights).toString(),
              currency: hotel.currency
            },
            room: {
              description: {
                text: hotel.description || `Experience luxury accommodation in ${hotel.city}`
              }
            },
            checkInDate: checkIn,
            checkOutDate: checkOut
          }],
          available: true,
          __googlePhotos: [{
            url: hotel.image_url,
            attribution: "Curated Recommendation"
          }],
          __googleRating: parseFloat(hotel.rating),
          __googleRatingCount: 100 + Math.floor(Math.random() * 400)
        }));
        
        console.log(`Using ${enriched.length} curated hotel recommendations from database`);
      }
    }

    // Filter out test/demo hotels
    const filteredHotels = enriched.filter((h: any) => {
      const name = (h.hotel?.name || '').toLowerCase();
      const description = (h.offers?.[0]?.room?.description?.text || '').toLowerCase();
      const lat = h.hotel?.latitude || 0;
      const lon = h.hotel?.longitude || 0;
      
      // Exclude test hotels, demo hotels, "do not use" hotels, and fake coordinates
      const isTestHotel = /test|demo|do not use|sample|fake/i.test(name) || 
                          /test|demo|do not use|sample|fake/i.test(description) ||
                          (lat === 0 && lon === 0);
      
      return !isTestHotel;
    });
    
    console.log(`Filtered out ${enriched.length - filteredHotels.length} test/demo hotels`);

    // Transform result to UI-friendly structure
    const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    const results = filteredHotels.map((h: any) => {
      const info = h.hotel || {};
      const offer = h.offers?.[0] || {};
      const total = offer.price?.total ? parseFloat(offer.price.total) : 0;
      const perNight = total / nights;
      const currency = offer.price?.currency || "USD";

      // Build photo URL list as plain strings
      const googlePhotoUrls: string[] = (h.__googlePhotos || [])
        .slice(0, 12)
        .map((p: any) => p?.url)
        .filter((u: any) => typeof u === 'string' && !!u);
      const fallbackMedia: string[] = (info.media?.map((m: any) => m?.uri).filter(Boolean)) || [];
      const photoUrls: string[] = googlePhotoUrls.length > 0 ? googlePhotoUrls : fallbackMedia;

      const reviews = h.__googleReviews || [];
      const googleRating = h.__googleRating || info.rating || 0;
      const googleReviewCount = h.__googleRatingCount || 0;

      return {
        hotel_id: h.id || info.hotelId,
        name: info.name || "Hotel",
        address: info.address?.lines?.[0] || "",
        city: info.address?.cityName || location,
        country: info.address?.countryCode || "",
        rating: googleRating,
        num_reviews: googleReviewCount,
        property: {
          name: info.name || "Hotel",
          photoUrls,
          reviews,
          reviewScore: googleRating,
          reviewCount: googleReviewCount,
          externalUrls: { amadeus: h.self || "", default: h.self || "" },
        },
        location: info.address?.cityName || location,
        price: perNight * 1.15, // Apply 15% markup
        basePrice: perNight, // Store original price
        priceBreakdown: {
          grossPrice: { value: perNight * 1.15, currency },
          totalPrice: { value: total * 1.15, currency },
          baseGrossPrice: { value: perNight, currency },
          baseTotalPrice: { value: total, currency },
        },
        accessibilityLabel: `${info.name}. ${info.address?.cityName || location}. Price ${(perNight * 1.15).toFixed(2)} ${currency} per night`,
        description: offer.room?.description?.text || "",
        amenities: info.amenities || [],
        photos: photoUrls,
        reviews,
        amadeusData: {
          offerId: offer.id,
          hotelId: h.id || info.hotelId,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          totalPrice: total,
          basePrice: total, // Original price for booking
        },
      };
    });

    const responseData = { results };
    
    // Rank results using user's preference or default to best_value
    try {
      const { data: rankedData, error: rankError } = await supabaseClient.functions.invoke('rank-search-results', {
        body: {
          results: results.map(r => ({
            ...r,
            distance: 0, // TODO: Calculate from city center
            reviewCount: r.num_reviews
          })),
          sortBy: sortBy
        }
      });
      
      if (!rankError && rankedData?.results) {
        responseData.results = rankedData.results;
      }
    } catch (error) {
      console.error('Ranking failed, returning unranked results:', error);
    }
    
    // Cache the result (fire and forget)
    setCache(supabaseClient, cacheKey, responseData);
    
    console.log(`Hotel search completed in ${Date.now() - searchStart}ms`);
    clearTimeout(timeoutId);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Error in unified-search-hotels:", e);
    
    // Check if it's a timeout error
    if (e instanceof Error && e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Request timed out. Please try again.", results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 408,
      });
    }
    
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", results: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
