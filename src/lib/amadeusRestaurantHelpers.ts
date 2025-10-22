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

export const fetchAmadeusRestaurantsForLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 10,
  categories?: string[],
  keyword?: string
): Promise<GooglePlacesRestaurant[]> => {
  try {
    // Convert km to meters for Google Places API
    const radiusInMeters = radius * 1000;
    
    console.debug(`🔍 Fetching restaurants at (${latitude}, ${longitude}) with ${radius}km radius`);
    
    let { data, error } = await supabase.functions.invoke('google-places-restaurants', {
      body: {
        latitude,
        longitude,
        radius: radiusInMeters,
        type: 'restaurant',
      },
    });

    if (error) {
      console.error('Error fetching Google Places restaurants:', error);
    }

    let restaurants = data?.data || [];
    console.debug(`📍 Got ${restaurants.length} restaurants at ${radius}km`);

    // If no results, try expanding radius to 10km
    if (restaurants.length === 0 && radius < 10) {
      console.debug(`No results with ${radius}km radius, trying 10km...`);
      const result = await supabase.functions.invoke('google-places-restaurants', {
        body: { latitude, longitude, radius: 10000 },
      });
      restaurants = result.data?.data || [];
      console.debug(`📍 Got ${restaurants.length} restaurants at 10km`);
    }

    // If still no results, try 20km
    if (restaurants.length === 0 && radius < 20) {
      console.debug(`No results with 10km radius, trying 20km...`);
      const result = await supabase.functions.invoke('google-places-restaurants', {
        body: { latitude, longitude, radius: 20000 },
      });
      restaurants = result.data?.data || [];
      console.debug(`📍 Got ${restaurants.length} restaurants at 20km`);
    }

    if (restaurants.length > 0) {
      console.debug(`✅ Sample restaurants:`, restaurants.slice(0, 2).map(r => r.name));
    }

    return restaurants;
  } catch (error) {
    console.error('Failed to fetch Google Places restaurants:', error);
    return [];
  }
};

export const fetchAmadeusRestaurantDetails = async (placeId: string): Promise<GooglePlacesRestaurant | null> => {
  try {
    console.debug(`🔍 Fetching details for place_id: ${placeId}`);
    
    const { data, error } = await supabase.functions.invoke('google-places-details', {
      body: { placeId },
    });

    if (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }

    const result = data?.data;
    if (result) {
      console.debug(`✅ Got details for: ${result.name}`);
    }

    return result || null;
  } catch (error) {
    console.error('Failed to fetch restaurant details:', error);
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

export const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  // Photo URLs are now generated on the backend for security
  // photoReference already contains the full URL
  if (photoReference?.startsWith('http')) {
    return photoReference;
  }
  // Fallback for any legacy data
  return photoReference || '';
};
