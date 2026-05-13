const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RankingWeights {
  price?: number;
  rating?: number;
  distance?: number;
  duration?: number;
  reviews?: number;
  amenities?: number;
  stops?: number;
}

interface RankingCriteria {
  sortBy: 'best_value' | 'cheapest' | 'closest' | 'highest_rated' | 'fastest';
  weights: RankingWeights;
  userPreferences?: {
    maxPrice?: number;
    minRating?: number;
    maxDistance?: number;
    maxDuration?: number;
  };
}

const RANKING_PROFILES: Record<string, RankingWeights> = {
  best_value: {
    price: 0.35,
    rating: 0.35,
    reviews: 0.15,
    distance: 0.10,
    amenities: 0.05
  },
  cheapest: {
    price: 0.70,
    rating: 0.15,
    reviews: 0.10,
    distance: 0.05
  },
  closest: {
    distance: 0.60,
    rating: 0.20,
    price: 0.15,
    reviews: 0.05
  },
  highest_rated: {
    rating: 0.50,
    reviews: 0.25,
    price: 0.15,
    distance: 0.10
  },
  fastest: {
    duration: 0.60,
    price: 0.25,
    stops: 0.10,
    rating: 0.05
  }
};

function calculateScore(item: any, criteria: RankingCriteria, maxValues: any): number {
  let score = 0;
  const weights = criteria.weights;

  // Price score (lower is better) - support both numeric price and price objects
  const itemPrice = item.numericPrice ?? (typeof item.price === 'number' ? item.price : 0);
  if (weights.price && itemPrice && maxValues.price) {
    const priceScore = 1 - (itemPrice / maxValues.price);
    score += priceScore * weights.price;
  }

  // Rating score (higher is better)
  if (weights.rating && item.rating) {
    const ratingScore = item.rating / 5.0;
    score += ratingScore * weights.rating;
  }

  // Distance score (closer is better)
  if (weights.distance && item.distance !== undefined && maxValues.distance) {
    const distanceScore = 1 - (item.distance / maxValues.distance);
    score += distanceScore * weights.distance;
  }

  // Duration score (shorter is better)
  if (weights.duration && item.duration && maxValues.duration) {
    const durationScore = 1 - (item.duration / maxValues.duration);
    score += durationScore * weights.duration;
  }

  // Review count score (more reviews = more trustworthy)
  if (weights.reviews && item.reviewCount) {
    const reviewScore = Math.min(item.reviewCount / 500, 1);
    score += reviewScore * weights.reviews;
  }

  // Amenities score (for hotels)
  if (weights.amenities && item.amenities) {
    const amenityScore = Math.min(item.amenities.length / 10, 1);
    score += amenityScore * weights.amenities;
  }

  // Stops score (fewer stops better)
  if (weights.stops && item.stops !== undefined) {
    const stopsScore = item.stops === 0 ? 1 : 1 - (item.stops / 3);
    score += stopsScore * weights.stops;
  }

  return Math.max(0, Math.min(score, 1)); // Normalize to 0-1
}

function findMaxValues(results: any[]): any {
  return {
    price: Math.max(...results.map(r => r.numericPrice ?? (typeof r.price === 'number' ? r.price : 0))),
    distance: Math.max(...results.map(r => r.distance || 0)),
    duration: Math.max(...results.map(r => r.duration || 0)),
    reviewCount: Math.max(...results.map(r => r.reviewCount || 0))
  };
}

function assignBadges(results: any[], sortBy: string) {
  if (results.length === 0) return results;

  // Best overall (already sorted)
  results[0].badge = sortBy === 'best_value' ? '🏆 Best Value' : '🏆 Best Overall';
  results[0].recommended = true;

  // Cheapest
  const cheapest = results.reduce((min, item) => {
    const itemPrice = item.numericPrice ?? (typeof item.price === 'number' ? item.price : Infinity);
    const minPrice = min.numericPrice ?? (typeof min.price === 'number' ? min.price : Infinity);
    return itemPrice < minPrice ? item : min;
  }, results[0]);
  if (cheapest !== results[0]) {
    cheapest.badge = '💰 Cheapest Option';
  }

  // Highest rated
  const highestRated = results.reduce((max, item) => 
    (item.rating || 0) > (max.rating || 0) ? item : max
  , results[0]);
  if (highestRated !== results[0] && highestRated !== cheapest) {
    highestRated.badge = '⭐ Highest Rated';
  }

  // Closest (if distance exists)
  if (results[0].distance !== undefined) {
    const closest = results.reduce((min, item) => 
      (item.distance || Infinity) < (min.distance || Infinity) ? item : min
    , results[0]);
    if (closest !== results[0] && closest !== cheapest && closest !== highestRated) {
      closest.badge = '📍 Closest to Center';
    }
  }

  // Fastest (if duration exists)
  if (results[0].duration !== undefined) {
    const fastest = results.reduce((min, item) => 
      (item.duration || Infinity) < (min.duration || Infinity) ? item : min
    , results[0]);
    if (fastest !== results[0] && fastest !== cheapest) {
      fastest.badge = '⚡ Fastest';
    }
  }

  // Direct flights (if stops exist)
  if (results[0].stops !== undefined) {
    const direct = results.find(item => item.stops === 0);
    if (direct && direct !== results[0]) {
      direct.badge = '✈️ Non-Stop';
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { results, sortBy = 'best_value', customWeights, userPreferences } = await req.json();

    if (!results || !Array.isArray(results)) {
      throw new Error('Results array is required');
    }

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ results: [], meta: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get ranking profile
    const weights = customWeights || RANKING_PROFILES[sortBy] || RANKING_PROFILES.best_value;

    const criteria: RankingCriteria = {
      sortBy,
      weights,
      userPreferences
    };

    // Calculate max values for normalization
    const maxValues = findMaxValues(results);

    // Calculate scores
    const scored = results.map(item => ({
      ...item,
      rankingScore: calculateScore(item, criteria, maxValues)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.rankingScore - a.rankingScore);

    // Assign badges
    const withBadges = assignBadges(scored, sortBy);

    // Calculate meta statistics
    const prices = results.map(r => r.numericPrice ?? (typeof r.price === 'number' ? r.price : 0)).filter(Boolean);
    const ratings = results.map(r => r.rating).filter(Boolean);

    const meta = {
      rankedBy: sortBy,
      totalResults: results.length,
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length
      } : null,
      averageRating: ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null
    };

    return new Response(
      JSON.stringify({ results: withBadges, meta }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error ranking results:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
