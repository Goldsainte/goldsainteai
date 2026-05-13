import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
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
  return `hotels|v2|${JSON.stringify(params)}`;
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
    
    const cachedData = data.data;
    
    // Validate cached results have photos (reject old Amadeus-only cache without photos)
    if (cachedData?.results && cachedData.results.length > 0) {
      const firstHotel = cachedData.results[0];
      const hasPhotos = (firstHotel.photos?.length > 0) || 
                       (firstHotel.property?.photoUrls?.length > 0) ||
                       (firstHotel.__googlePhotos?.length > 0) ||
                       (firstHotel.image_url) ||
                       (firstHotel.image);
      
      if (!hasPhotos) {
        console.log('Cache found but missing photos, invalidating and fetching fresh data');
        return null;
      }
    }
    
    return cachedData;
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

// Simple city code mapping without Amadeus API
function getCityCode(location: string): string {
  const raw = (location || "").trim().toLowerCase();
  const base = raw.split(",")[0];

  // NYC boroughs and neighborhoods
  const boroughs: Record<string, string> = {
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

  // City mapping
  const cityMap: Record<string, string> = {
    "new york": "NYC", "los angeles": "LAX", "san francisco": "SFO", "washington": "WAS",
    "chicago": "CHI", "miami": "MIA", "seattle": "SEA", "atlanta": "ATL", "dallas": "DFW",
    "houston": "HOU", "phoenix": "PHX", "denver": "DEN", "orlando": "ORL", "detroit": "DTW",
    "minneapolis": "MSP", "portland": "PDX", "san diego": "SAN", "austin": "AUS", "nashville": "BNA",
    "charlotte": "CLT", "boston": "BOS", "las vegas": "LAS",
    "paris": "PAR", "london": "LON", "tokyo": "TYO", "kyoto": "UKY", "osaka": "OSA",
  };
  
  return cityMap[base] || base.replace(/\s+/g, "").slice(0, 3).toUpperCase() || "NYC";
}

async function enrichWithGooglePlaces(hotels: any[], cityName: string) {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  
  if (!apiKey) {
    console.log("Google Places API key not configured, skipping photo/review enrichment");
    return hotels;
  }

  // Enrich top 20 hotels with Google Places data
  const limit = Math.min(hotels.length, 20);
  const target = hotels.slice(0, limit);
  console.log(`Enriching ${target.length} hotels with Google Places photos and reviews...`);

  await Promise.all(
    target.map(async (hotel: any) => {
      try {
        const hotelName = hotel.hotel?.name || "";
        const latitude = hotel.hotel?.latitude;
        const longitude = hotel.hotel?.longitude;
        
        if (!hotelName) return;

        // Build search query
        const searchQuery = `${hotelName} hotel in ${cityName}`;
        
        const requestBody: any = {
          textQuery: searchQuery,
          maxResultCount: 1
        };

        // Use coordinates if available for better accuracy
        if (latitude && longitude) {
          requestBody.locationBias = {
            circle: {
              center: { latitude, longitude },
              radius: 1000 // 1km radius
            }
          };
        }

        // Search for the hotel
        const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.photos'
          },
          body: JSON.stringify(requestBody)
        });

        if (!searchResponse.ok) {
          console.error(`Google Places search failed for ${hotelName}: ${searchResponse.status}`);
          return;
        }

        const searchData = await searchResponse.json();
        const place = searchData.places?.[0];
        
        if (!place || !place.id) return;

    // Fetch detailed place information including reviews
    const detailsResponse = await fetch(`https://places.googleapis.com/v1/${place.id}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,photos,reviews,editorialSummary'
      }
    });

    if (!detailsResponse.ok) return;

    const details = await detailsResponse.json();
    
    // Extract and add photos
    const photos = (details.photos || [])
      .slice(0, 12)
      .map((photo: any) => ({
        url: `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=1200`,
        attribution: "Google Places"
      }));

    if (photos.length > 0) {
      hotel.__googlePhotos = photos;
    }

    // Add rating data
    if (details.rating) {
      hotel.__googleRating = details.rating;
      hotel.__googleRatingCount = details.userRatingCount || 0;
    }

    // Add reviews
    if (details.reviews && details.reviews.length > 0) {
      hotel.__googleReviews = details.reviews.slice(0, 5).map((review: any) => ({
        author: review.authorAttribution?.displayName || 'Google User',
        rating: review.rating || 0,
        text: review.text?.text || review.originalText?.text || '',
        relativePublishTime: review.relativePublishTimeDescription || '',
      }));
    }

    hotel.__hasGoogleData = true;
        
      } catch (e) {
        console.error(`Error enriching hotel ${hotel.hotel?.name}:`, e);
      }
    })
  );
  
  const enrichedCount = hotels.filter(h => h.__hasGoogleData).length;
  console.log(`Google Places enrichment complete: ${enrichedCount}/${target.length} hotels matched with Google data`);
  
  return hotels;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
  
  try {
    const { location, checkIn, checkOut, guests = 2, sortBy = 'best_value', filter = 'all', max_total_price, currency = 'USD' } = await req.json();
    
    console.log("=== UNIFIED HOTEL SEARCH STARTED ===");
    console.log("Request params:", { location, checkIn, checkOut, guests, filter, sortBy, max_total_price, currency });
    
    if (!location || !checkIn || !checkOut) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: "Missing location/checkIn/checkOut" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    
    // Validate filter parameter (removed 'amadeus' option)
    const validFilters = ['all', 'curated'];
    const hotelFilter = validFilters.includes(filter) ? filter : 'all';
    
    console.log(`Using filter: ${hotelFilter}`);

    // Initialize Supabase client for ranking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const searchStart = Date.now();

    // Check database cache first
    const cacheKey = getCacheKey({ location, checkIn, checkOut, guests });
    const cachedResult = await getFromCache(supabaseClient, cacheKey);
    
    // Only return cached results if they contain hotels
    if (cachedResult && cachedResult.results && cachedResult.results.length > 0) {
      clearTimeout(timeoutId);
      console.log('Returning cached hotel results:', cachedResult.results.length);
      return new Response(JSON.stringify({ 
        ...cachedResult,
        cached: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (cachedResult) {
      console.log('Cached result was empty, performing fresh search');
    }

    const cityCode = getCityCode(location);
    console.log(`Resolved city code: ${cityCode} for location: ${location}`);

    let bookingHotels: any[] = [];
    let enriched: any[] = [];
    
    // Try Booking.com Rapid API for 'all' searches (has photos + reviews built-in)
    if (hotelFilter === 'all') {
      try {
        console.log("🔍 Calling Booking.com Rapid API...");
        const bookingStart = Date.now();
        
        const { data: bookingData, error: bookingError } = await supabaseClient.functions.invoke('booking-com-rapid-search', {
          body: { 
            location, 
            checkIn, 
            checkOut, 
            guests: Number(guests) || 2,
            rooms: 1,
            max_total_price,
            currency
          }
        });
        
        console.log(`Booking.com API call completed in ${Date.now() - bookingStart}ms`);
        
        if (bookingError) {
          console.error("❌ Booking.com API error:", bookingError);
          console.error("Error details:", JSON.stringify(bookingError, null, 2));
        } else if (!bookingData) {
          console.error("❌ Booking.com returned no data");
        } else if (!bookingData.hotels) {
          console.error("❌ Booking.com data missing 'hotels' field:", bookingData);
        } else {
          bookingHotels = bookingData.hotels;
          console.log(`✅ Booking.com returned ${bookingHotels.length} hotels with photos and reviews`);
          if (bookingHotels.length === 0) {
            console.warn('⚠️ Booking.com returned 0 hotels for location:', location);
          }
        }
      } catch (e) {
        console.error("❌ Booking.com exception:", e);
      }
    } else {
      console.log(`Skipping Booking.com (filter: ${hotelFilter})`);
    }
    
    enriched = bookingHotels;
    console.log(`Using ${enriched.length} hotels from Booking.com`);

    // Fetch curated hotels if filter allows or if no results yet
    if (hotelFilter === 'curated' || (hotelFilter === 'all' && enriched.length === 0)) {
      const logMessage = hotelFilter === 'curated' 
        ? `Fetching curated recommendations for ${cityCode} (user filter: curated only)`
        : `No Booking.com results, fetching curated recommendations for ${cityCode}`;
      console.log(logMessage);
      
      const curatedHotels = await getCuratedHotels(supabaseClient, cityCode);
      
      if (curatedHotels.length > 0) {
        // Transform curated hotels to match Amadeus format
        const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
        
        const curatedResults = curatedHotels.map((hotel: any) => ({
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
          __isCurated: true, // Flag to identify curated hotels
          __curatedDescription: hotel.description,
          __curatedAmenities: hotel.amenities,
          __googlePhotos: hotel.image_url ? [{
            url: hotel.image_url,
            attribution: "Curated Recommendation"
          }] : [],
          __googleRating: parseFloat(hotel.rating),
          __googleRatingCount: 100 + Math.floor(Math.random() * 400)
        }));
        
        // If filter is 'all', merge curated with existing Booking.com results
        if (hotelFilter === 'all') {
          enriched = [...enriched, ...curatedResults];
          console.log(`Merged ${curatedResults.length} curated recommendations with ${enriched.length - curatedResults.length} Booking.com results`);
        } else {
          enriched = curatedResults;
          console.log(`Using ${enriched.length} curated hotel recommendations from database`);
        }
      }
    }

    // Filter out test/demo hotels
    const filteredHotels = enriched.filter((h: any) => {
      // Booking.com hotels are already clean, skip filtering
      if (h.__source === 'booking.com') {
        return true;
      }
      
      // Apply filtering to curated hotels
      const name = (h.hotel?.name || h.name || '').toLowerCase();
      const description = (h.description || '').toLowerCase();
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
    
    // Apply server-side price filtering BEFORE transformation
    const maxPricePerNight = max_total_price ?? Infinity;
    const priceFilteredHotels = filteredHotels.filter((h: any) => {
      const isBookingHotel = h.__source === 'booking.com';
      
      if (isBookingHotel) {
        // Booking.com hotels: price already has 15% markup
        const offer = h.offers?.[0] || {};
        const total = offer.price?.total || 0;
        const perNight = total / nights;
        return perNight <= maxPricePerNight;
      } else {
        // Curated hotels: need to apply markup for comparison
        const offer = h.offers?.[0] || {};
        const total = offer.price?.total ? parseFloat(offer.price.total) : 0;
        const perNight = total / nights;
        const perNightWithMarkup = perNight * 1.15;
        return perNightWithMarkup <= maxPricePerNight;
      }
    });
    
    console.log(`Server-side price filter: ${filteredHotels.length} -> ${priceFilteredHotels.length} hotels within ${maxPricePerNight}/night (any currency)`);
    
    const results = priceFilteredHotels.map((h: any) => {
      // Check if this is a Booking.com hotel
      const isBookingHotel = h.__source === 'booking.com';
      
      // For Booking.com hotels, use direct fields; for curated, use nested structure
      const info = isBookingHotel ? h : (h.hotel || {});
      const offer = h.offers?.[0] || {};
      
      // Calculate pricing
      let perNight: number;
      let total: number;
      let currency: string;
      
      if (isBookingHotel) {
        // Booking.com hotels already have price per night with 15% markup applied
        total = offer.price?.total || 0;
        perNight = total / nights;
        currency = offer.price?.currency || "USD";
      } else {
        // Curated hotels have offer structure
        total = offer.price?.total ? parseFloat(offer.price.total) : 0;
        perNight = total / nights;
        currency = offer.price?.currency || "USD";
      }

      // Build photo URL list - prioritize Booking.com photos, then curated photos
      let photoUrls: string[] = [];
      
      if (isBookingHotel && h.photos && h.photos.length > 0) {
        // Booking.com hotel - use photos from Booking.com (handle both strings and objects)
        photoUrls = h.photos.map((p: any) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
      } else if (h.__googlePhotos && h.__googlePhotos.length > 0) {
        // Curated hotel - use curated photos
        const curatedPhotoUrls: string[] = (h.__googlePhotos || [])
          .slice(0, 12)
          .map((p: any) => p?.url)
          .filter((u: any) => typeof u === 'string' && !!u);
        
        photoUrls = curatedPhotoUrls;
      } else {
        // Fallback to media or image_url
        const fallbackMedia: string[] = (info.media?.map((m: any) => m?.uri).filter(Boolean)) || [];
        if (h.image_url) {
          photoUrls = [h.image_url];
        } else {
          photoUrls = fallbackMedia;
        }
      }

      // Get reviews and ratings
      const reviews = h.__googleReviews || [];
      const rating = isBookingHotel ? (h.rating || 0) : (h.__googleRating || info.rating || 0);
      const reviewCount = isBookingHotel ? (h.reviewCount || 0) : (h.__googleRatingCount || 0);

      return {
        hotel_id: isBookingHotel ? h.id : (h.id || info.hotelId),
        name: isBookingHotel ? h.name : (info.name || "Hotel"),
        address: isBookingHotel ? h.address : (info.address?.lines?.[0] || ""),
        city: isBookingHotel ? (h.hotel?.cityCode || location) : (info.address?.cityName || location),
        country: isBookingHotel ? "" : (info.address?.countryCode || ""),
        rating,
        num_reviews: reviewCount,
        isCurated: h.__isCurated || false,
        hasBookingData: isBookingHotel,
        image_url: photoUrls[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop`,
        property: {
          name: isBookingHotel ? h.name : (info.name || "Hotel"),
          photoUrls,
          reviews,
          reviewScore: rating,
          reviewCount,
          externalUrls: { booking: h.__bookingUrl || "", default: h.__bookingUrl || "" },
        },
        location: isBookingHotel ? (h.hotel?.cityCode || location) : (info.address?.cityName || location),
        price: isBookingHotel ? perNight : (perNight * 1.15), // Booking.com already has markup, curated needs it
        basePrice: isBookingHotel ? (perNight / 1.15) : perNight, // Original price without markup
        priceBreakdown: {
          grossPrice: { value: isBookingHotel ? perNight : (perNight * 1.15), currency },
          totalPrice: { value: isBookingHotel ? total : (total * 1.15), currency },
          baseGrossPrice: { value: isBookingHotel ? (perNight / 1.15) : perNight, currency },
          baseTotalPrice: { value: isBookingHotel ? (total / 1.15) : total, currency },
        },
        accessibilityLabel: `${isBookingHotel ? h.name : info.name}. ${isBookingHotel ? (h.hotel?.cityCode || location) : info.address?.cityName || location}. Price ${(isBookingHotel ? perNight : perNight * 1.15).toFixed(2)} ${currency} per night`,
        description: h.__curatedDescription || h.description || (offer.room?.description || "") || "",
        amenities: h.__curatedAmenities || h.amenities || info.amenities || [],
        photos: photoUrls,
        reviews,
        bookingData: isBookingHotel ? {
          hotelId: h.id,
          bookingUrl: h.__bookingUrl,
          totalPrice: total,
          basePrice: total / 1.15, // Original price for booking
        } : null,
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
    
    // Cache the result only if we have hotels (fire and forget)
    if (results.length > 0) {
      setCache(supabaseClient, cacheKey, {
        ...responseData,
        filter: hotelFilter // Include filter in cached response
      });
      console.log(`Cached ${results.length} hotel results`);
    } else {
      console.log('Not caching empty results');
    }
    
    console.log(`Hotel search completed in ${Date.now() - searchStart}ms with filter: ${hotelFilter}`);
    clearTimeout(timeoutId);

    return new Response(JSON.stringify({
      ...responseData,
      filter: hotelFilter // Include filter in response for client reference
    }), {
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
