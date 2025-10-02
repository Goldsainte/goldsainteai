import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
        { headers: { 'Accept': 'application/json' } }
      );

      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error('TripAdvisor search error:', error);
        throw new Error(`Restaurant search failed: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const page = searchData.data || [];
      allSearchResults.push(...page);
      console.log(`Fetched page with ${page.length} restaurants (total: ${allSearchResults.length})`);

      if (page.length === 0) {
        console.log('No more pages available from TripAdvisor API');
        break;
      }
      offset += page.length;

      // Limit to 30 results for faster loading
      if (allSearchResults.length >= 30) {
        console.log('Reached maximum limit of 30 results');
        break;
      }
    }

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
          const reservationUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${restaurant.name} ${fallbackCity}`)}`;

          return {
            id: restaurant.location_id,
            name: restaurant.name,
            address: restaurant.address_obj?.address_string || '',
            city: fallbackCity,
            country: restaurant.address_obj?.country || '',
            rating: 0,
            num_reviews: 0,
            price_level: '',
            cuisine: '',
            description: '',
            photos: photos.map((photo: any) => ({
              url: photo.images?.large?.url || photo.images?.original?.url,
              caption: photo.caption || ''
            })),
            photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
            reviews: reviews.map((review: any) => ({
              rating: review.rating || 0,
              text: review.text || '',
              published_date: review.published_date || '',
              user: review.user?.username || 'Anonymous'
            })),
            web_url: '',
            phone: '',
            website: '',
            reservationUrl,
            hours: {},
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
        const reservationUrl = primaryUrl
          ? (primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`)
          : `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${details.name || restaurant.name} ${details.address_obj?.city || ''}`)}`;

        return {
          id: restaurant.location_id,
          name: details.name || restaurant.name,
          address: details.address_obj?.address_string || '',
          city: details.address_obj?.city || '',
          country: details.address_obj?.country || '',
          rating: details.rating || 0,
          num_reviews: details.num_reviews || 0,
          price_level: details.price_level || '',
          cuisine: details.cuisine?.map((c: any) => c.name).join(', ') || '',
          description: details.description || '',
          photos: photos.map((photo: any) => ({
            url: photo.images?.large?.url || photo.images?.original?.url,
            caption: photo.caption || ''
          })),
          photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
          reviews: reviews.map((review: any) => ({
            rating: review.rating || 0,
            text: review.text || '',
            published_date: review.published_date || '',
            user: review.user?.username || 'Anonymous'
          })),
          web_url: details.web_url || '',
          phone: details.phone || '',
          website: details.website || '',
          reservationUrl,
          hours: details.hours || {},
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
    for (let i = 0; i < allSearchResults.length; i += batchSize) {
      chunks.push(allSearchResults.slice(i, i + batchSize));
    }

    const restaurantDetails: any[] = [];
    for (const group of chunks) {
      const groupResults = await Promise.all(group.map(fetchDetailsFor));
      restaurantDetails.push(...groupResults);
      // brief delay to reduce rate limiting
      await new Promise((r) => setTimeout(r, 250));
    }

    const validRestaurants = restaurantDetails.filter((restaurant) => restaurant !== null);

    return new Response(JSON.stringify({ 
      results: validRestaurants
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in tripadvisor-search-restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
