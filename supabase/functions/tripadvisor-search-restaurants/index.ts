import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    .replace(/[^\x00-\x7F]/g, (char) => {
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
    const { location, cuisine, priceRange } = await req.json();
    
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

    const validRestaurants = restaurantDetails.filter((restaurant: any) => {
      if (!restaurant) return false;
      const hasPhoto = !!restaurant.photoUrl || (Array.isArray(restaurant.photos) && restaurant.photos.length > 0);
      const hasQuality = (Array.isArray(restaurant.reviews) && restaurant.reviews.length > 0) || (Number(restaurant.rating) > 0);
      return hasPhoto && hasQuality;
    });

    // Rank restaurants
    let rankedRestaurants = validRestaurants;
    try {
      const rankingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/rank-search-results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: validRestaurants.map(r => ({
            ...r,
            price: r.price_level ? r.price_level.length * 15 : 30,
            reviewCount: r.num_reviews || 0,
            distance: 0
          })),
          sortBy: 'best_value'
        }),
      });
      
      if (rankingResponse.ok) {
        const rankedData = await rankingResponse.json();
        rankedRestaurants = rankedData.results;
      }
    } catch (err) {
      console.warn('Restaurant ranking failed:', err);
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
