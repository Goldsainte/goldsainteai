import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize text to fix encoding issues and replace problematic characters
const sanitizeText = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã /g, 'à')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Â´/g, "'")
    .replace(/Â/g, '')
    .replace(/[^ -~]/g, (char) => {
      const replacements: {[key: string]: string} = {
        '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
        '\u2014': '-', '\u2013': '-', '\u2026': '...', '\u2022': '*',
        '\u2122': 'TM', '\u00A9': '(c)', '\u00AE': '(R)'
      };
      return replacements[char] || char;
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const { location, cuisine, priceRange, sortBy = 'best_value' } = await req.json();
    
    // Initialize Supabase client for ranking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('TripAdvisor restaurant search request:', {
      location, 
      cuisine,
      priceRange
    });

    const apiKey = Deno.env.get('TRIPADVISOR_API_KEY');
    
    if (!apiKey) {
      throw new Error('TripAdvisor API key not configured');
    }

    // Build search query
    let searchQuery = `${location} restaurants`;
    if (cuisine) {
      searchQuery += ` ${cuisine}`;
    }

    // Paginate through TripAdvisor search results to avoid low limits
    const perPage = 10; // TripAdvisor API returns up to 10 per page; paginate reliably
    let offset = 0;
    const allSearchResults: any[] = [];

    while (true) {
      const searchParams = new URLSearchParams({
        key: apiKey,
        searchQuery: searchQuery,
        category: 'restaurants',
        language: 'en',
        limit: String(perPage),
        offset: String(offset),
      });

      const searchResponse = await fetch(
        `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        }
      );

      if (!searchResponse.ok) {
        if (searchResponse.status === 429) {
          clearTimeout(timeoutId);
          return new Response(JSON.stringify({ 
            error: "Rate limit exceeded. Please try again later.",
            results: [] 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          });
        }
        const error = await searchResponse.text();
        console.error('TripAdvisor search error:', error);
        throw new Error(`Restaurant search failed: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const page = searchData.data || [];
      allSearchResults.push(...page);
      console.log(`Fetched page with ${page.length} restaurants (total: ${allSearchResults.length})`);

      // Continue fetching pages until we reach ~30 or no more results
      if (page.length < perPage || allSearchResults.length >= 30) {
        break;
      }
      offset += perPage;
    }

    // Limit results for speed and reliability
    const limitedResults = allSearchResults.slice(0, 20);

    // Fetch detailed information for each restaurant (batched to limit concurrency)
    const batchSize = 5;
    const fetchDetailsFor = async (restaurant: any) => {
      try {
        const detailsParams = new URLSearchParams({
          key: apiKey,
          language: 'en'
        });

        // Fetch details, photos, and reviews in parallel
        const [detailsResponse, photosResponse, reviewsResponse] = await Promise.all([
          fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/details?${detailsParams}`,
            { headers: { 'Accept': 'application/json' } }
          ),
          fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/photos?${detailsParams}`,
            { headers: { 'Accept': 'application/json' } }
          ),
          fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/reviews?${detailsParams}`,
            { headers: { 'Accept': 'application/json' } }
          )
        ]);

        if (!detailsResponse.ok) {
          console.error(`Failed to fetch details for ${restaurant.location_id}`);
          // Even if details fail, try to enrich with photos and reviews
          const photosData = photosResponse.ok ? await photosResponse.json() : { data: [] };
          const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : { data: [] };
          const photos = (photosData.data || []).slice(0, 5);
          const reviews = (reviewsData.data || []).slice(0, 3);
          const fallbackCity = restaurant.address_obj?.city || '';
          const googleReservationsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${fallbackCity}`)}`;

          return {
            id: restaurant.location_id,
            name: sanitizeText(restaurant.name),
            address: sanitizeText(restaurant.address_obj?.address_string || ''),
            city: sanitizeText(fallbackCity),
            country: sanitizeText(restaurant.address_obj?.country || ''),
            rating: 0,
            num_reviews: 0,
            userRatingsTotal: 0,
            price_level: '',
            priceLevel: 0,
            cuisine: '',
            description: '',
            photos: photos.map((photo: any) => ({
              url: photo.images?.large?.url || photo.images?.original?.url,
              caption: sanitizeText(photo.caption || '')
            })),
            photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
            reviews: reviews.map((review: any) => ({
              rating: review.rating || 0,
              text: sanitizeText(review.text || ''),
              published_date: review.published_date || '',
              user: sanitizeText(review.user?.username || 'Anonymous')
            })),
            web_url: '',
            phone: '',
            website: '',
            reservationUrl: googleReservationsUrl,
            hours: {},
            openNow: undefined,
            latitude: undefined,
            longitude: undefined
          };
        }

        const [details, photosData, reviewsData] = await Promise.all([
          detailsResponse.json(),
          photosResponse.ok ? photosResponse.json() : Promise.resolve({ data: [] }),
          reviewsResponse.ok ? reviewsResponse.json() : Promise.resolve({ data: [] })
        ]);

        // Filter by price range if specified
        if (priceRange && details.price_level && details.price_level !== priceRange) {
          return null;
        }

        const photos = (photosData.data || []).slice(0, 5);
        const reviews = (reviewsData.data || []).slice(0, 3);

        const primaryUrl = details.website || details.web_url || '';
        const googleReservationsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${details.name || restaurant.name} ${details.address_obj?.city || ''}`)}`;
        const reservationUrl = primaryUrl
          ? (primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`)
          : googleReservationsUrl;

        return {
          id: restaurant.location_id,
          name: sanitizeText(details.name || restaurant.name),
          address: sanitizeText(details.address_obj?.address_string || ''),
          city: sanitizeText(details.address_obj?.city || ''),
          country: sanitizeText(details.address_obj?.country || ''),
          rating: details.rating || 0,
          num_reviews: details.num_reviews || 0,
          userRatingsTotal: details.num_reviews || 0,
          price_level: details.price_level || '',
          priceLevel: details.price_level ? details.price_level.split('$').length - 1 : 0,
          cuisine: sanitizeText(details.cuisine?.map((c: any) => c.name).join(', ') || ''),
          description: sanitizeText(details.description || ''),
          photos: photos.map((photo: any) => ({
            url: photo.images?.large?.url || photo.images?.original?.url,
            caption: sanitizeText(photo.caption || '')
          })),
          photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
          reviews: reviews.map((review: any) => ({
            rating: review.rating || 0,
            text: sanitizeText(review.text || ''),
            published_date: review.published_date || '',
            user: sanitizeText(review.user?.username || 'Anonymous')
          })),
          web_url: details.web_url || '',
          phone: details.phone || '',
          website: details.website || '',
          reservationUrl,
          hours: details.hours || {},
          openNow: details.is_closed === false,
          latitude: details.latitude,
          longitude: details.longitude
        };
      } catch (error) {
        console.error(`Error fetching details for restaurant ${restaurant.location_id}:`, error);
        return null;
      }
    };

    // Batch processing to limit parallel requests
    const chunks: any[][] = [];
    for (let i = 0; i < limitedResults.length; i += batchSize) {
      chunks.push(limitedResults.slice(i, i + batchSize));
    }

    const restaurantDetails: any[] = [];
    for (const group of chunks) {
      const groupResults = await Promise.all(group.map(fetchDetailsFor));
      restaurantDetails.push(...groupResults);
      // brief delay to reduce rate limiting
      await new Promise((r) => setTimeout(r, 250));
    }

    // City center coordinates map for distance calculation
    const cityCenterCoords: { [key: string]: { lat: number; lng: number } } = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'singapore': { lat: 1.3521, lng: 103.8198 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'boston': { lat: 42.3601, lng: -71.0589 }
    };

    // Calculate distance from city center
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of Earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const locationKey = location.toLowerCase().split(',')[0].trim();
    const cityCenter = cityCenterCoords[locationKey] || { lat: 0, lng: 0 };

    const validRestaurants = restaurantDetails.filter((restaurant: any) => {
      if (!restaurant) return false;
      const hasPhoto = !!restaurant.photoUrl || (Array.isArray(restaurant.photos) && restaurant.photos.length > 0);
      const hasQuality = (Array.isArray(restaurant.reviews) && restaurant.reviews.length > 0) || (Number(restaurant.rating) > 0);
      return hasPhoto && hasQuality;
    }).map(r => {
      // Calculate distance if coordinates available
      const distance = (r.latitude && r.longitude && cityCenter.lat !== 0)
        ? calculateDistance(cityCenter.lat, cityCenter.lng, r.latitude, r.longitude)
        : 999; // Default high distance if coords unavailable
      
      return { ...r, distance };
    });

    // Rank restaurants using Supabase client
    let rankedRestaurants = validRestaurants;
    try {
      const { data: rankedData, error: rankError } = await supabaseClient.functions.invoke('rank-search-results', {
        body: {
          results: validRestaurants.map(r => ({
            ...r,
            price: r.price_level ? r.price_level.length * 15 : 30,
            reviewCount: r.num_reviews || 0,
            distance: r.distance
          })),
          sortBy: sortBy
        }
      });
      
      if (!rankError && rankedData?.results) {
        rankedRestaurants = rankedData.results;
      }
    } catch (error) {
      console.error('Restaurant ranking failed:', error);
    }

    clearTimeout(timeoutId);

    return new Response(JSON.stringify({ 
      results: rankedRestaurants
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in tripadvisor-search-restaurants:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: "Request timed out. Please try again.",
        results: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 408,
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
