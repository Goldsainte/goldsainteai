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
    console.log('[Activities] Fetching Amadeus activities for coordinates:', latitude, longitude);
    
    const { data, error } = await supabase.functions.invoke('amadeus-search-tours', {
      body: {
        latitude,
        longitude,
        radius,
        categories
      },
    });

    if (error) {
      console.error('Error fetching Amadeus activities:', error);
      return [];
    }

    const activities = data?.data || [];
    
    console.log(`[Activities] Found ${activities.length} activities from Amadeus`);
    
    // Transform Amadeus activities to our format (already includes 15% markup from edge function)
    return activities.map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      shortDescription: activity.shortDescription,
      description: activity.description,
      price: {
        amount: activity.price?.amount || '0',
        currencyCode: activity.price?.currencyCode || 'USD'
      },
      pictures: activity.pictures || [],
      rating: activity.rating || '0',
      numberOfRatings: activity.bookingLink ? 1 : 0,
      bookingLink: activity.bookingLink || '',
      geoCode: activity.geoCode || {
        latitude,
        longitude
      },
      categories: activity.categories || ['Activity']
    }));
  } catch (error) {
    console.error('Failed to fetch Amadeus activities:', error);
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
    agencyName: 'Via Amadeus',
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

  // Fallback images for common categories
  const categoryFallbackImages: Record<string, string> = {
    'Museums and Galleries': 'https://images.unsplash.com/photo-1566127444979-b3d2b73053d5?w=800&q=80',
    'Museums & Galleries': 'https://images.unsplash.com/photo-1566127444979-b3d2b73053d5?w=800&q=80',
    'Historical Landmarks': 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80',
    'Food & Wine Tours': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'Day Trips': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'Water Sports & Cruises': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    'Cultural Experiences': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
    'Adventure Tours': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
    'Shopping': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    'Nightlife': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'Outdoor Activities': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    'Nature & Parks': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'Sports & Recreation': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
    'Theater & Performances': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    'Art & Culture': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
    'Walking Tours': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    'Bike Tours': 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
    'Classes & Workshops': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    'Spa & Wellness': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    'Shows & Entertainment': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'Photography Tours': 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
    'Beach & Pool': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'Theme Parks': 'https://images.unsplash.com/photo-1594138247273-7cfd0ce36b4e?w=800&q=80',
    'Zoos & Aquariums': 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&q=80',
    'Private Tours': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    'Luxury Tours': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'Family Friendly': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
    'Romantic Tours': 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&q=80',
    'City Tours': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    'Airport Transfers': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    'Multi-day Tours': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  };

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
    
    // Use activity image, or fallback to category-specific image, or placeholder
    const imageUrl = activityWithImage?.pictures?.[0] || categoryFallbackImages[name] || '/placeholder.svg';
    
    return {
      name,
      imageUrl,
      packageCount: acts.length,
      startingPrice: Math.min(...acts.map(a => parseFloat(a.price.amount))),
    };
  });
};
