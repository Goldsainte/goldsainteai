// Fallback helper for car search when only location is provided
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import { getUserLocation } from "@/lib/locationMapping";

const geocodeLocation = async (location: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('[Geocode] Error geocoding location:', error);
    return null;
  }
};

export const fetchUberFallback = async (location: string) => {
  console.log('[Uber Fallback] Fetching Uber products for location:', location);
  
  try {
    // Try to geocode the location first
    let coords = await geocodeLocation(location);
    
    // Fallback to user location if geocoding fails
    if (!coords) {
      console.log('[Uber Fallback] Geocoding failed, using device location');
      const userLoc = await getUserLocation();
      coords = { latitude: userLoc.latitude, longitude: userLoc.longitude };
    }
    
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
