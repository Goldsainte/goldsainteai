import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Try Amadeus Locations API first
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
    "paris": "PAR", "london": "LON", "tokyo": "TYO", "dubai": "DXB", "singapore": "SIN",
  };
  const cityName = (location || "").split(",")[0].trim().toLowerCase();
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

async function enrichWithTripAdvisor(hotels: any[], location: string) {
  const tripKey = Deno.env.get("TRIPADVISOR_API_KEY");
  if (!tripKey) {
    console.log("TripAdvisor API key not configured, skipping photo/review enrichment");
    return hotels;
  }

  const limit = Math.min(hotels.length, 20);
  const target = hotels.slice(0, limit);
  console.log(`Enriching ${target.length} hotels with TripAdvisor photos and reviews...`);

  // Simple concurrency control
  const batchSize = 5;
  for (let i = 0; i < target.length; i += batchSize) {
    const slice = target.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (hotel: any) => {
        try {
          const name = hotel.hotel?.name || "";
          const city = hotel.hotel?.address?.cityName || (location.split(",")[0] || "");

          const searchParams = new URLSearchParams({ key: tripKey, searchQuery: `${name} ${city}`, category: "hotels", language: "en" });
          const sRes = await fetch(`https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`, { headers: { Accept: "application/json" } });
          if (!sRes.ok) return;
          const sData = await sRes.json();
          const locId = sData.data?.[0]?.location_id;
          if (!locId) return;

          const commonParams = new URLSearchParams({ key: tripKey, language: "en" });
          const [pRes, rRes] = await Promise.all([
            fetch(`https://api.content.tripadvisor.com/api/v1/location/${locId}/photos?${commonParams}`, { headers: { Accept: "application/json" } }),
            fetch(`https://api.content.tripadvisor.com/api/v1/location/${locId}/reviews?${commonParams}`, { headers: { Accept: "application/json" } }),
          ]);

          const photosData = pRes.ok ? await pRes.json() : { data: [] };
          const reviewsData = rRes.ok ? await rRes.json() : { data: [] };

          hotel.__tripPhotos = (photosData.data || []).map((ph: any) => ({
            url: ph.images?.large?.url || ph.images?.medium?.url || ph.images?.small?.url,
            caption: ph.caption || name,
          })).filter((p: any) => p.url);

          hotel.__tripReviews = (reviewsData.data || []).slice(0, 5).map((rev: any) => ({
            author: rev.user?.username || "Anonymous",
            rating: rev.rating || 0,
            text: rev.text || "",
            date: rev.published_date || "",
            title: rev.title || "",
          }));
          
          console.log(`Enriched ${name}: ${hotel.__tripPhotos?.length || 0} photos, ${hotel.__tripReviews?.length || 0} reviews`);
        } catch (e) {
          console.warn(`TripAdvisor enrichment failed for ${hotel.hotel?.name}:`, e);
        }
      })
    );
  }
  
  const enrichedCount = hotels.filter(h => h.__tripPhotos?.length > 0).length;
  console.log(`TripAdvisor enrichment complete: ${enrichedCount}/${target.length} hotels have photos`);
  return hotels;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { location, checkIn, checkOut, guests = 2 } = await req.json();
    if (!location || !checkIn || !checkOut) {
      return new Response(JSON.stringify({ error: "Missing location/checkIn/checkOut" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    console.log("Unified hotel search:", { location, checkIn, checkOut, guests });

    const token = await getAmadeusToken();
    const cityCode = await resolveCityCode(token, location);

    const amadeusHotels = await fetchAmadeusHotels(token, cityCode, checkIn, checkOut, Number(guests) || 2);
    console.log("Amadeus hotels fetched:", amadeusHotels.length);

    const enriched = await enrichWithTripAdvisor(amadeusHotels, location);

    // Transform result to UI-friendly structure
    const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    const results = enriched.map((h: any) => {
      const info = h.hotel || {};
      const offer = h.offers?.[0] || {};
      const total = offer.price?.total ? parseFloat(offer.price.total) : 0;
      const perNight = total / nights;
      const currency = offer.price?.currency || "USD";

      const photoUrls = (h.__tripPhotos || []).slice(0, 12);
      const reviews = h.__tripReviews || [];

      return {
        hotel_id: h.id || info.hotelId,
        name: info.name || "Hotel",
        address: info.address?.lines?.[0] || "",
        city: info.address?.cityName || location,
        country: info.address?.countryCode || "",
        rating: info.rating || 0,
        num_reviews: reviews.length,
        property: {
          name: info.name || "Hotel",
          photoUrls,
          reviews,
          reviewScore: info.rating || 0,
          reviewCount: reviews.length,
          externalUrls: { amadeus: h.self || "", default: h.self || "" },
        },
        location: info.address?.cityName || location,
        price: perNight,
        priceBreakdown: {
          grossPrice: { value: perNight, currency },
          totalPrice: { value: total, currency },
        },
        accessibilityLabel: `${info.name}. ${info.address?.cityName || location}. Price ${perNight.toFixed(2)} ${currency} per night`,
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
        },
      };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("Error in unified-search-hotels:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", results: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
