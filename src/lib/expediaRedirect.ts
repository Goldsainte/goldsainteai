/**
 * Expedia Redirect URL Generator
 * Creates pre-filled booking URLs for Expedia hotels and flights
 */

export interface ExpediaHotelParams {
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  rooms?: number;
  adults: number;
  children?: number;
  hotelName?: string;
}

export interface ExpediaFlightParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD for round trip
  adults: number;
  children?: number;
  tripType?: 'round-trip' | 'one-way';
}

/**
 * Generate Expedia hotel search URL with pre-filled details
 */
export function generateExpediaHotelUrl(params: ExpediaHotelParams): string {
  const baseUrl = 'https://www.expedia.com/Hotel-Search';
  const searchParams = new URLSearchParams({
    destination: params.destination,
    startDate: params.checkIn,
    endDate: params.checkOut,
    rooms: (params.rooms || 1).toString(),
    adults: params.adults.toString(),
  });

  if (params.children) {
    searchParams.set('children', params.children.toString());
  }

  if (params.hotelName) {
    searchParams.set('hotelName', params.hotelName);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Generate Expedia flight search URL with pre-filled details
 */
export function generateExpediaFlightUrl(params: ExpediaFlightParams): string {
  const baseUrl = 'https://www.expedia.com/Flights';
  const tripType = params.tripType || (params.returnDate ? 'round-trip' : 'one-way');
  
  const searchParams = new URLSearchParams({
    'flight-type': tripType === 'round-trip' ? 'roundtrip' : 'oneway',
    leg1: `from:${params.origin},to:${params.destination},departure:${params.departureDate}TANYT`,
    passengers: `adults:${params.adults}${params.children ? `,children:${params.children}` : ''}`,
  });

  if (params.returnDate && tripType === 'round-trip') {
    searchParams.set('leg2', `from:${params.destination},to:${params.origin},departure:${params.returnDate}TANYT`);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Open Expedia URL in new tab with proper security attributes
 */
export function openExpediaBooking(url: string): void {
  const bookingWindow = window.open(url, '_blank', 'noopener,noreferrer');
  
  if (!bookingWindow) {
    // Fallback if popup was blocked
    window.location.href = url;
  }
}
