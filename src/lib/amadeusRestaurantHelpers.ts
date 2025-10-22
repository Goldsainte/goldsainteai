import { supabase } from "@/integrations/supabase/client";

export interface AmadeusRestaurant {
  id: string;
  name: string;
  category?: string;
  rank?: number;
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
}

export const fetchAmadeusRestaurantsForLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 5,
  categories?: string[]
): Promise<AmadeusRestaurant[]> => {
  try {
    // Try with initial radius
    let { data, error } = await supabase.functions.invoke('amadeus-topplace-restaurants', {
      body: {
        latitude,
        longitude,
        radius,
        categories,
      },
    });

    if (error) {
      console.error('Error fetching Amadeus restaurants:', error);
    }

    let restaurants = data?.data || [];

    // If no results, try expanding radius to 10km
    if (restaurants.length === 0 && radius < 10) {
      console.log(`No results with ${radius}km radius, trying 10km...`);
      const result = await supabase.functions.invoke('amadeus-topplace-restaurants', {
        body: { latitude, longitude, radius: 10, categories },
      });
      restaurants = result.data?.data || [];
    }

    // If still no results, try 20km
    if (restaurants.length === 0 && radius < 20) {
      console.log(`No results with 10km radius, trying 20km...`);
      const result = await supabase.functions.invoke('amadeus-topplace-restaurants', {
        body: { latitude, longitude, radius: 20, categories },
      });
      restaurants = result.data?.data || [];
    }

    return restaurants;
  } catch (error) {
    console.error('Failed to fetch Amadeus restaurants:', error);
    return [];
  }
};

export const fetchAmadeusRestaurantDetails = async (poiId: string): Promise<AmadeusRestaurant | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('amadeus-get-poi-details', {
      body: { poiId },
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

export const groupRestaurantsByCity = (restaurants: AmadeusRestaurant[], defaultCity: string) => {
  const grouped = restaurants.reduce((acc, restaurant) => {
    const city = defaultCity;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(restaurant);
    return acc;
  }, {} as Record<string, AmadeusRestaurant[]>);

  return Object.entries(grouped).map(([city, items]) => ({
    city,
    restaurantCount: items.length,
  }));
};
