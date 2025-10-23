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
 * Fetch restaurants in a given city using Worldwide Restaurants API
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

    // Invoke the edge function with the search parameters
    const { data, error } = await supabase.functions.invoke('worldwide-restaurants', {
      body: {
        location: cityName,
        cuisine,
        keyword,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    const restaurants = data?.restaurants || [];
    console.info(`Found ${restaurants.length} restaurants`);

    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
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
