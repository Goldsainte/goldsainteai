// Location mapping for common destinations
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export const POPULAR_DESTINATIONS: Record<string, LocationCoordinates> = {
  // Europe
  'paris': { latitude: 48.8566, longitude: 2.3522, name: 'Paris', country: 'France' },
  'rome': { latitude: 41.9028, longitude: 12.4964, name: 'Rome', country: 'Italy' },
  'london': { latitude: 51.5074, longitude: -0.1278, name: 'London', country: 'United Kingdom' },
  'barcelona': { latitude: 41.3851, longitude: 2.1734, name: 'Barcelona', country: 'Spain' },
  'amsterdam': { latitude: 52.3676, longitude: 4.9041, name: 'Amsterdam', country: 'Netherlands' },
  'lisbon': { latitude: 38.7223, longitude: -9.1393, name: 'Lisbon', country: 'Portugal' },
  'prague': { latitude: 50.0755, longitude: 14.4378, name: 'Prague', country: 'Czech Republic' },
  'vienna': { latitude: 48.2082, longitude: 16.3738, name: 'Vienna', country: 'Austria' },
  'berlin': { latitude: 52.5200, longitude: 13.4050, name: 'Berlin', country: 'Germany' },
  'istanbul': { latitude: 41.0082, longitude: 28.9784, name: 'Istanbul', country: 'Turkey' },
  'munich': { latitude: 48.1351, longitude: 11.5820, name: 'Munich', country: 'Germany' },
  'madrid': { latitude: 40.4168, longitude: -3.7038, name: 'Madrid', country: 'Spain' },
  'copenhagen': { latitude: 55.6761, longitude: 12.5683, name: 'Copenhagen', country: 'Denmark' },
  'stockholm': { latitude: 59.3293, longitude: 18.0686, name: 'Stockholm', country: 'Sweden' },
  
  // USA
  'new york': { latitude: 40.7128, longitude: -74.0060, name: 'New York', country: 'USA' },
  'atlanta': { latitude: 33.7490, longitude: -84.3880, name: 'Atlanta', country: 'USA' },
  'chicago': { latitude: 41.8781, longitude: -87.6298, name: 'Chicago', country: 'USA' },
  'los angeles': { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles', country: 'USA' },
  'san francisco': { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco', country: 'USA' },
  'miami': { latitude: 25.7617, longitude: -80.1918, name: 'Miami', country: 'USA' },
  'boston': { latitude: 42.3601, longitude: -71.0589, name: 'Boston', country: 'USA' },
  'seattle': { latitude: 47.6062, longitude: -122.3321, name: 'Seattle', country: 'USA' },
  'las vegas': { latitude: 36.1699, longitude: -115.1398, name: 'Las Vegas', country: 'USA' },
  'new orleans': { latitude: 29.9511, longitude: -90.0715, name: 'New Orleans', country: 'USA' },
  'washington dc': { latitude: 38.9072, longitude: -77.0369, name: 'Washington DC', country: 'USA' },
  'philadelphia': { latitude: 39.9526, longitude: -75.1652, name: 'Philadelphia', country: 'USA' },
  'san diego': { latitude: 32.7157, longitude: -117.1611, name: 'San Diego', country: 'USA' },
  'austin': { latitude: 30.2672, longitude: -97.7431, name: 'Austin', country: 'USA' },
  'portland': { latitude: 45.5152, longitude: -122.6784, name: 'Portland', country: 'USA' },
  'nashville': { latitude: 36.1627, longitude: -86.7816, name: 'Nashville', country: 'USA' },
  'denver': { latitude: 39.7392, longitude: -104.9903, name: 'Denver', country: 'USA' },
  'phoenix': { latitude: 33.4484, longitude: -112.0740, name: 'Phoenix', country: 'USA' },
  'dallas': { latitude: 32.7767, longitude: -96.7970, name: 'Dallas', country: 'USA' },
  'houston': { latitude: 29.7604, longitude: -95.3698, name: 'Houston', country: 'USA' },
  
  // Asia
  'tokyo': { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo', country: 'Japan' },
  'singapore': { latitude: 1.3521, longitude: 103.8198, name: 'Singapore', country: 'Singapore' },
  'dubai': { latitude: 25.2048, longitude: 55.2708, name: 'Dubai', country: 'UAE' },
  'bangkok': { latitude: 13.7563, longitude: 100.5018, name: 'Bangkok', country: 'Thailand' },
  'hong kong': { latitude: 22.3193, longitude: 114.1694, name: 'Hong Kong', country: 'China' },
  'seoul': { latitude: 37.5665, longitude: 126.9780, name: 'Seoul', country: 'South Korea' },
  'shanghai': { latitude: 31.2304, longitude: 121.4737, name: 'Shanghai', country: 'China' },
  'kuala lumpur': { latitude: 3.1390, longitude: 101.6869, name: 'Kuala Lumpur', country: 'Malaysia' },
  
  // Oceania
  'sydney': { latitude: -33.8688, longitude: 151.2093, name: 'Sydney', country: 'Australia' },
  'melbourne': { latitude: -37.8136, longitude: 144.9631, name: 'Melbourne', country: 'Australia' },
  'auckland': { latitude: -36.8485, longitude: 174.7633, name: 'Auckland', country: 'New Zealand' },
  
  // Canada
  'vancouver': { latitude: 49.2827, longitude: -123.1207, name: 'Vancouver', country: 'Canada' },
  'toronto': { latitude: 43.6532, longitude: -79.3832, name: 'Toronto', country: 'Canada' },
  'montreal': { latitude: 45.5017, longitude: -73.5673, name: 'Montreal', country: 'Canada' },
};

export const findLocationCoordinates = (destination: string): LocationCoordinates | null => {
  const normalized = destination.toLowerCase().trim();
  return POPULAR_DESTINATIONS[normalized] || null;
};

export const getUserLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Default to Paris if geolocation not available
      resolve(POPULAR_DESTINATIONS['paris']);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location',
          country: '',
        });
      },
      () => {
        // Default to Paris if user denies location
        resolve(POPULAR_DESTINATIONS['paris']);
      }
    );
  });
};
