import { supabase } from "@/integrations/supabase/client";

export interface AmadeusActivity {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  pictures?: string[];
  rating?: string;
  numberOfRatings?: number;
  bookingLink?: string;
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  categories?: string[];
}

export interface TransformedPackage {
  id: string;
  packageName: string;
  destination: string;
  coverImage: string;
  retailPrice: number;
  currency: string;
  rating: number;
  totalReviews: number;
  agencyName: string;
  likelyToSellOut: boolean;
  description?: string;
  duration?: string;
}

export const fetchAmadeusToursForLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 20,
  categories?: string[]
): Promise<AmadeusActivity[]> => {
  try {
    // Try with initial radius
    let { data, error } = await supabase.functions.invoke('amadeus-search-tours', {
      body: {
        latitude,
        longitude,
        radius,
        categories,
      },
    });

    if (error) {
      console.error('Error fetching Amadeus tours:', error);
    }

    let activities = data?.data || [];

    // If no results, try expanding radius to 50km
    if (activities.length === 0 && radius < 50) {
      console.log(`No results with ${radius}km radius, trying 50km...`);
      const result = await supabase.functions.invoke('amadeus-search-tours', {
        body: { latitude, longitude, radius: 50, categories },
      });
      activities = result.data?.data || [];
    }

    // If still no results, try 100km
    if (activities.length === 0 && radius < 100) {
      console.log(`No results with 50km radius, trying 100km...`);
      const result = await supabase.functions.invoke('amadeus-search-tours', {
        body: { latitude, longitude, radius: 100, categories },
      });
      activities = result.data?.data || [];
    }

    return activities;
  } catch (error) {
    console.error('Failed to fetch Amadeus tours:', error);
    return [];
  }
};

export const fetchAmadeusTourDetails = async (activityId: string): Promise<AmadeusActivity | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('amadeus-get-tour-details', {
      body: { activityId },
    });

    if (error) {
      console.error('Error fetching tour details:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Failed to fetch tour details:', error);
    return null;
  }
};

export const transformAmadeusToPackage = (
  activity: AmadeusActivity,
  destinationName: string
): TransformedPackage => {
  return {
    id: activity.id,
    packageName: activity.name,
    destination: destinationName,
    coverImage: activity.pictures?.[0] || '/placeholder.svg',
    retailPrice: parseFloat(activity.price.amount),
    currency: activity.price.currencyCode,
    rating: activity.rating ? parseFloat(activity.rating) : 0,
    totalReviews: activity.numberOfRatings || 0,
    agencyName: 'Via Amadeus',
    likelyToSellOut: !!activity.bookingLink,
    description: activity.shortDescription || activity.description,
  };
};

export const groupByDestination = (activities: AmadeusActivity[], defaultDestination: string) => {
  const grouped = activities.reduce((acc, activity) => {
    const dest = defaultDestination;
    if (!acc[dest]) {
      acc[dest] = [];
    }
    acc[dest].push(activity);
    return acc;
  }, {} as Record<string, AmadeusActivity[]>);

  return Object.entries(grouped).map(([destination, tours]) => ({
    destination,
    imageUrl: tours[0]?.pictures?.[0] || '/placeholder.svg',
    packageCount: tours.length,
    startingPrice: Math.min(...tours.map(t => parseFloat(t.price.amount))),
  }));
};

export const groupByCategory = (activities: AmadeusActivity[]) => {
  const categoryMap: Record<string, { name: string; activities: AmadeusActivity[] }> = {};

  activities.forEach(activity => {
    if (activity.categories && activity.categories.length > 0) {
      const category = activity.categories[0];
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, activities: [] };
      }
      categoryMap[category].activities.push(activity);
    }
  });

  return Object.values(categoryMap).map(({ name, activities: acts }) => ({
    name,
    imageUrl: acts[0]?.pictures?.[0] || '/placeholder.svg',
    packageCount: acts.length,
    startingPrice: Math.min(...acts.map(a => parseFloat(a.price.amount))),
  }));
};
