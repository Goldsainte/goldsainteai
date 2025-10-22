import { supabase } from "@/integrations/supabase/client";

export interface GooglePlacesRestaurant {
  place_id: string;
  name: string;
  vicinity?: string;
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
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
  business_status?: string;
}

// For backward compatibility
export type AmadeusRestaurant = GooglePlacesRestaurant;

export const fetchAmadeusRestaurantsForLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 5,
  categories?: string[]
): Promise<GooglePlacesRestaurant[]> => {
  try {
    // Convert km to meters for Google Places API
    const radiusInMeters = radius * 1000;
    
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

    // If no results, try expanding radius to 10km
    if (restaurants.length === 0 && radius < 10) {
      console.log(`No results with ${radius}km radius, trying 10km...`);
      const result = await supabase.functions.invoke('google-places-restaurants', {
        body: { latitude, longitude, radius: 10000 },
      });
      restaurants = result.data?.data || [];
    }

    // If still no results, try 20km
    if (restaurants.length === 0 && radius < 20) {
      console.log(`No results with 20km radius, trying 20km...`);
      const result = await supabase.functions.invoke('google-places-restaurants', {
        body: { latitude, longitude, radius: 20000 },
      });
      restaurants = result.data?.data || [];
    }

    return restaurants;
  } catch (error) {
    console.error('Failed to fetch Google Places restaurants:', error);
    return [];
  }
};

export const fetchAmadeusRestaurantDetails = async (placeId: string): Promise<GooglePlacesRestaurant | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('google-places-details', {
      body: { placeId },
    });

    if (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }

    return data?.data || null;
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
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
};
