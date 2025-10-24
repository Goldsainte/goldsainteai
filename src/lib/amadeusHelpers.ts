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
  tripType?: string;
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
    // Use HotelBeds activities API
    // First, get approximate destination code from coordinates
    const { getHotelBedsDestinationCode } = await import('./hotelbedsHelpers');
    
    console.log('[Activities] Fetching HotelBeds activities for coordinates:', latitude, longitude);
    
    // Use a simple approximation based on major cities' coordinates
    let destinationCode = 'NYC'; // Default
    if (latitude > 40 && latitude < 41 && longitude > -74 && longitude < -73) destinationCode = 'NYC';
    else if (latitude > 34 && latitude < 35 && longitude > -118 && longitude < -117) destinationCode = 'LAX';
    else if (latitude > 48 && latitude < 49 && longitude > 2 && longitude < 3) destinationCode = 'PAR';
    else if (latitude > 51 && latitude < 52 && longitude > -1 && longitude < 1) destinationCode = 'LON';
    else if (latitude > 35 && latitude < 36 && longitude > 139 && longitude < 140) destinationCode = 'TYO';
    
    // Get today's date for activity search
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase.functions.invoke('hotelbeds-search-activities', {
      body: {
        destination: destinationCode,
        date: today,
        category: categories?.[0]
      },
    });

    if (error) {
      console.error('Error fetching HotelBeds activities:', error);
      return [];
    }

    const activities = data?.activities || [];
    
    console.log(`[Activities] Found ${activities.length} activities from HotelBeds`);
    
    // Transform HotelBeds activities to match Amadeus format
    return activities.map((activity: any) => ({
      id: activity.code,
      name: activity.name,
      shortDescription: activity.description?.substring(0, 200),
      description: activity.description,
      price: {
        amount: activity.price?.toString() || '0',
        currencyCode: activity.currency || 'USD'
      },
      pictures: activity.images || [],
      rating: '0',
      numberOfRatings: 0,
      bookingLink: '',
      geoCode: {
        latitude: activity.location?.latitude || latitude,
        longitude: activity.location?.longitude || longitude
      },
      categories: [activity.category || 'Activity']
    }));
  } catch (error) {
    console.error('Failed to fetch HotelBeds activities:', error);
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

const inferTripType = (categories?: string[]): string | undefined => {
  if (!categories || categories.length === 0) return undefined;
  
  const categoryMap: Record<string, string> = {
    'ADVENTURE': 'adventure',
    'SPORTS': 'adventure',
    'NATURE': 'adventure',
    'LUXURY': 'luxury',
    'FAMILY': 'family',
    'ROMANTIC': 'romantic',
    'CULTURAL': 'cultural',
    'TOURS': 'cultural',
    'MUSEUMS': 'cultural',
  };
  
  const category = categories[0]?.toUpperCase();
  return categoryMap[category] || 'cultural';
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
    agencyName: 'Via HotelBeds',
    likelyToSellOut: !!activity.bookingLink,
    tripType: inferTripType(activity.categories),
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

  return Object.values(categoryMap).map(({ name, activities: acts }) => {
    // Find first activity with valid images
    const activityWithImage = acts.find(activity => 
      activity.pictures && 
      activity.pictures.length > 0 && 
      activity.pictures[0] !== '/placeholder.svg'
    );
    
    return {
      name,
      imageUrl: activityWithImage?.pictures?.[0] || '/placeholder.svg',
      packageCount: acts.length,
      startingPrice: Math.min(...acts.map(a => parseFloat(a.price.amount))),
    };
  });
};
