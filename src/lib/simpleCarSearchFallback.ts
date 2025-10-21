// Fallback helper for car search when only location is provided
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import { getUserLocation } from "@/lib/locationMapping";

export const fetchUberFallback = async (location: string) => {
  console.log('[Uber Fallback] Fetching Uber products for location:', location);
  
  try {
    // Get coordinates for the location
    const coords = await getUserLocation();
    
    // Fetch Uber products (pickup = dropoff for local area)
    const { data: uberData, error: uberError } = await invokeEdgeFunction('uber-get-products', {
      body: {
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
        dropoffLatitude: coords.latitude,
        dropoffLongitude: coords.longitude,
      }
    });

    if (uberError) {
      console.error('[Uber Fallback] Error:', uberError);
      return { products: [], error: 'Unable to fetch transportation options' };
    }
    
    if (uberData?.products) {
      console.log('[Uber Fallback] Products loaded:', uberData.products.length);
      return { products: uberData.products, error: null };
    }
    
    return { products: [], error: null };
  } catch (error) {
    console.error('[Uber Fallback] Exception:', error);
    return { products: [], error: 'Unable to fetch transportation options' };
  }
};
