import { supabase } from "@/integrations/supabase/client";

export interface GooglePlacesRestaurant {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
  business_status?: string;
  formatted_phone_number?: string;
  website?: string;
  editorialSummary?: {
    text: string;
  };
  generativeSummary?: {
    overview?: { text: string };
    description?: { text: string };
  };
  primaryTypeDisplayName?: { text: string };
  // Service options
  servesBeer?: boolean;
  servesWine?: boolean;
  servesBreakfast?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesBrunch?: boolean;
  servesVegetarianFood?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  // Features
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  menuForChildren?: boolean;
  servesCocktails?: boolean;
  servesCoffee?: boolean;
  servesDessert?: boolean;
  // Amenities
  restroom?: boolean;
  goodForChildren?: boolean;
  goodForGroups?: boolean;
  allowsDogs?: boolean;
  // Accessibility
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  };
  // Parking
  parkingOptions?: {
    freeParking?: boolean;
    paidParking?: boolean;
    valetParking?: boolean;
  };
  // Payment
  paymentOptions?: {
    acceptsCashOnly?: boolean;
    acceptsCreditCards?: boolean;
    acceptsDebitCards?: boolean;
    acceptsNFC?: boolean;
  };
  // Reviews
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: string;
    relative_time_description: string;
  }>;
}

// For backward compatibility
export type AmadeusRestaurant = GooglePlacesRestaurant;

/**
 * Fetch restaurants in a given city using TripAdvisor API
 * 
 * @param cityName - Name of the city (e.g., "Paris", "Tokyo", "Dallas")
 * @param cuisine - Optional cuisine type (e.g., "french", "italian")
 * @param keyword - Optional keyword to search for
 * @returns Array of restaurants
 */
export const fetchAmadeusRestaurantsForLocation = async (
  cityName: string,
  cuisine?: string,
  keyword?: string
): Promise<GooglePlacesRestaurant[]> => {
  try {
    console.info(
      `Fetching restaurants in ${cityName}${cuisine ? ` [cuisine: ${cuisine}]` : ""}`
    );

    // Invoke TripAdvisor search
    const { data, error } = await supabase.functions.invoke('tripadvisor-search-restaurants', {
      body: {
        location: cityName,
        cuisine: cuisine || keyword,
        sortBy: 'best_value',
      },
    });

    if (error) {
      console.error('TripAdvisor edge function error:', error);
      const { toast } = await import('sonner');
      toast.error("Unable to search restaurants. Please try again.");
      return [];
    }

    if (data?.error) {
      console.error('TripAdvisor API error:', data.error);
      const { toast } = await import('sonner');
      
      if (data.error.includes('Rate limit')) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else if (data.error.includes('not configured')) {
        toast.error("Restaurant search is not configured. Please contact support.");
      } else {
        toast.error(`Unable to find restaurants in "${cityName}". Try a major city.`);
      }
      return [];
    }

    // Map TripAdvisor results to GooglePlacesRestaurant format
    const tripAdvisorResults = data?.results || [];
    const restaurants: GooglePlacesRestaurant[] = tripAdvisorResults.map((r: any) => ({
      place_id: String(r.id || r.location_id || ''),
      name: r.name || '',
      vicinity: r.city || r.address || '',
      formatted_address: r.address || `${r.city}, ${r.country}`,
      rating: Number(r.rating) || 0,
      user_ratings_total: Number(r.num_reviews || r.userRatingsTotal) || 0,
      price_level: r.priceLevel || (r.price_level ? r.price_level.length : 0),
      geometry: r.latitude && r.longitude ? {
        location: {
          lat: Number(r.latitude),
          lng: Number(r.longitude),
        },
      } : undefined,
      opening_hours: r.openNow !== undefined ? {
        open_now: r.openNow,
      } : undefined,
      photos: r.photoUrl ? [{
        photo_reference: r.photoUrl,
        height: 800,
        width: 1200,
      }] : (r.photos && r.photos.length > 0 ? r.photos.map((p: any) => ({
        photo_reference: p.url,
        height: 800,
        width: 1200,
      })) : []),
      types: ['restaurant'],
      business_status: 'OPERATIONAL',
      formatted_phone_number: r.phone || '',
      website: r.website || r.web_url || '',
      reviews: r.reviews ? r.reviews.map((rev: any) => ({
        author_name: rev.user || 'Anonymous',
        rating: Number(rev.rating) || 0,
        text: rev.text || '',
        time: rev.published_date || '',
        relative_time_description: rev.published_date || '',
      })) : [],
    }));

    console.info(`Found ${restaurants.length} TripAdvisor restaurants`);
    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    const { toast } = await import('sonner');
    toast.error("An unexpected error occurred. Please try again.");
    return [];
  }
};

export const fetchAmadeusRestaurantDetails = async (
  placeId: string
): Promise<GooglePlacesRestaurant | null> => {
  try {
    console.info(`Fetching details for restaurant: ${placeId}`);

    // For now, return null - photo backfill will use the initial data
    // Can implement a separate details endpoint if Worldwide Restaurants API provides one
    console.warn('Restaurant details endpoint not yet implemented for Worldwide Restaurants API');
    return null;
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return null;
  }
};

export const groupRestaurantsByCity = (restaurants: GooglePlacesRestaurant[], defaultCity: string) => {
  const grouped = restaurants.reduce((acc, restaurant) => {
    const city = defaultCity;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(restaurant);
    return acc;
  }, {} as Record<string, GooglePlacesRestaurant[]>);

  return Object.entries(grouped).map(([city, items]) => ({
    city,
    restaurantCount: items.length,
  }));
};

export const getPhotoUrl = (photoReference: string, maxWidth: number = 800): string => {
  if (!photoReference) return '';
  
  // Worldwide Restaurants API provides direct photo URLs
  return photoReference;
};
