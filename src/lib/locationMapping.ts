// Location mapping for common destinations
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export const POPULAR_DESTINATIONS: Record<string, LocationCoordinates> = {
  'paris': { latitude: 48.8566, longitude: 2.3522, name: 'Paris', country: 'France' },
  'rome': { latitude: 41.9028, longitude: 12.4964, name: 'Rome', country: 'Italy' },
  'london': { latitude: 51.5074, longitude: -0.1278, name: 'London', country: 'United Kingdom' },
  'new york': { latitude: 40.7128, longitude: -74.0060, name: 'New York', country: 'USA' },
  'tokyo': { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo', country: 'Japan' },
  'barcelona': { latitude: 41.3851, longitude: 2.1734, name: 'Barcelona', country: 'Spain' },
  'amsterdam': { latitude: 52.3676, longitude: 4.9041, name: 'Amsterdam', country: 'Netherlands' },
  'dubai': { latitude: 25.2048, longitude: 55.2708, name: 'Dubai', country: 'UAE' },
  'singapore': { latitude: 1.3521, longitude: 103.8198, name: 'Singapore', country: 'Singapore' },
  'sydney': { latitude: -33.8688, longitude: 151.2093, name: 'Sydney', country: 'Australia' },
  'lisbon': { latitude: 38.7223, longitude: -9.1393, name: 'Lisbon', country: 'Portugal' },
  'prague': { latitude: 50.0755, longitude: 14.4378, name: 'Prague', country: 'Czech Republic' },
  'vienna': { latitude: 48.2082, longitude: 16.3738, name: 'Vienna', country: 'Austria' },
  'berlin': { latitude: 52.5200, longitude: 13.4050, name: 'Berlin', country: 'Germany' },
  'istanbul': { latitude: 41.0082, longitude: 28.9784, name: 'Istanbul', country: 'Turkey' },
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
