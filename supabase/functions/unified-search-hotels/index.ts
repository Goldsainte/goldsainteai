import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
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

    let attempt = 1;
    const maxAttempts = 3;
    while (attempt <= maxAttempts) {
      try {
        console.log(`Fetching offers for chunk size ${chunk.length}, attempt ${attempt}/${maxAttempts}`);
        const offersRes = await fetch(`https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!offersRes.ok) {
          const errorText = await offersRes.text();
          console.error(`Hotel offers failed (status ${offersRes.status}) for chunk:`, errorText);
          // On 4xx other than 429, don't retry this chunk; continue to next chunk
          if (offersRes.status >= 400 && offersRes.status < 500 && offersRes.status !== 429) {
            break;
          }
          if (attempt === maxAttempts) {
            break;
          }
          await new Promise(r => setTimeout(r, 500 * attempt));
          attempt++;
          continue;
        }

        const offers = await offersRes.json();
        const available = (offers.data || []).filter((h: any) => h.available && h.offers && h.offers.length > 0);
        aggregated.push(...available);
        break; // success, move to next chunk
      } catch (e) {
        console.error('Error fetching offers for chunk:', e);
        if (attempt === maxAttempts) break;
        await new Promise(r => setTimeout(r, 500 * attempt));
        attempt++;
      }
    }
  }

  console.log(`Total available hotel offers aggregated: ${aggregated.length}`);
  return aggregated;
}

async function enrichWithGooglePlaces(hotels: any[], location: string) {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.log("Google Places API key not configured, skipping photo/review enrichment");
    return hotels;
  }

  const limit = Math.min(hotels.length, 20);
  const target = hotels.slice(0, limit);
  console.log(`Enriching ${target.length} hotels with Google Places photos and reviews...`);

  // Simple concurrency control
  const batchSize = 5;
  for (let i = 0; i < target.length; i += batchSize) {
    const slice = target.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (hotel: any) => {
        try {
          const name = hotel.hotel?.name || "";
          const city = hotel.hotel?.address?.cityName || (location.split(",")[0] || "");

          // Text Search for hotel
          const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "places.id,places.displayName,places.photos,places.rating,places.userRatingCount,places.reviews"
            },
            body: JSON.stringify({
              textQuery: `${name} hotel ${city}`,
              maxResultCount: 1
            })
          });

          if (!searchRes.ok) {
            console.log(`Google Places search failed for ${name}: ${searchRes.status}`);
            return;
          }

          const searchData = await searchRes.json();
          if (!searchData.places || searchData.places.length === 0) return;

          const place = searchData.places[0];

          // Extract photos
          hotel.__googlePhotos = (place.photos || []).slice(0, 12).map((photo: any) => ({
            url: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=1200&maxWidthPx=1600`,
            attribution: photo.authorAttributions?.[0]?.displayName || ""
          }));

          // Extract reviews
          hotel.__googleReviews = (place.reviews || []).slice(0, 5).map((review: any) => ({
            author: review.authorAttribution?.displayName || "Anonymous",
            rating: review.rating || 0,
            text: review.text?.text || review.originalText?.text || "",
            date: review.publishTime || "",
            relativeTime: review.relativePublishTimeDescription || ""
          }));

          // Overall rating
          hotel.__googleRating = place.rating || 0;
          hotel.__googleRatingCount = place.userRatingCount || 0;

          console.log(`Enriched ${name}: ${hotel.__googlePhotos?.length || 0} photos, ${hotel.__googleReviews?.length || 0} reviews, rating: ${hotel.__googleRating}`);
        } catch (e) {
          console.warn(`Google Places enrichment failed for ${hotel.hotel?.name}:`, e);
        }
      })
    );
    
    // Small delay between batches
    if (i + batchSize < target.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  const enrichedCount = hotels.filter(h => h.__googlePhotos?.length > 0).length;
  console.log(`Google Places enrichment complete: ${enrichedCount}/${target.length} hotels have photos`);
  return hotels;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
  
  try {
    const { location, checkIn, checkOut, guests = 2 } = await req.json();
    if (!location || !checkIn || !checkOut) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: "Missing location/checkIn/checkOut" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    console.log("Unified hotel search:", { location, checkIn, checkOut, guests });

    // Check cache first
    const cacheKey = getCacheKey({ location, checkIn, checkOut, guests });
    const cachedResult = getFromCache(cacheKey);
    
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

    const enriched = await enrichWithGooglePlaces(amadeusHotels, location);

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
    
    // Cache the result
    setCache(cacheKey, responseData);
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
