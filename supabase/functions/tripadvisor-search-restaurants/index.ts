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
    let searchQuery = location;
    if (cuisine) {
      searchQuery += ` ${cuisine}`;
    }

    // Paginate through TripAdvisor search results to avoid low limits
    const perPage = 50; // Fetch 50 per page to reduce requests
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

      if (page.length < perPage) {
        console.log('No more pages available from TripAdvisor API');
        break;
      }
      offset += perPage;

      // Increased limit for more comprehensive results
      if (allSearchResults.length >= 1000) {
        console.log('Reached maximum limit of 1000 results');
        break;
      }
    }

    // Fetch detailed information for each restaurant (batched to limit concurrency)
    const batchSize = 20;
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
          return null;
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
          reviews: reviews.map((review: any) => ({
            rating: review.rating || 0,
            text: review.text || '',
            published_date: review.published_date || '',
            user: review.user?.username || 'Anonymous'
          })),
          web_url: details.web_url || '',
          phone: details.phone || '',
          website: details.website || '',
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
