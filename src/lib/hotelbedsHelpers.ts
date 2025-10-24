// HotelBeds destination code mapping
export const HOTELBEDS_DESTINATION_CODES: Record<string, string> = {
  // US Cities
  'new york': 'NYC',
  'los angeles': 'LAX',
  'chicago': 'CHI',
  'miami': 'MIA',
  'san francisco': 'SFO',
  'las vegas': 'LAS',
  'seattle': 'SEA',
  'boston': 'BOS',
  'washington': 'WAS',
  'atlanta': 'ATL',
  'dallas': 'DFW',
  'houston': 'HOU',
  'orlando': 'ORL',
  'charlotte': 'CLT',
  'phoenix': 'PHX',
  'denver': 'DEN',
  'san diego': 'SAN',
  'portland': 'PDX',
  'austin': 'AUS',
  'nashville': 'BNA',
  
  // European Cities
  'paris': 'PAR',
  'london': 'LON',
  'rome': 'ROM',
  'barcelona': 'BCN',
  'amsterdam': 'AMS',
  'madrid': 'MAD',
  'berlin': 'BER',
  'vienna': 'VIE',
  'prague': 'PRG',
  'lisbon': 'LIS',
  'dublin': 'DUB',
  'brussels': 'BRU',
  'athens': 'ATH',
  'venice': 'VCE',
  'florence': 'FLR',
  'milan': 'MIL',
  'munich': 'MUC',
  'copenhagen': 'CPH',
  'stockholm': 'STO',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'zurich': 'ZRH',
  'geneva': 'GVA',
  'budapest': 'BUD',
  'warsaw': 'WAW',
  'istanbul': 'IST',
  
  // Asian Cities
  'tokyo': 'TYO',
  'singapore': 'SIN',
  'hong kong': 'HKG',
  'bangkok': 'BKK',
  'dubai': 'DXB',
  'shanghai': 'SHA',
  'beijing': 'BJS',
  'seoul': 'SEL',
  'taipei': 'TPE',
  'kuala lumpur': 'KUL',
  'manila': 'MNL',
  'jakarta': 'JKT',
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'bangalore': 'BLR',
  
  // Other Major Cities
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'toronto': 'YTO',
  'vancouver': 'YVR',
  'montreal': 'YMQ',
  'mexico city': 'MEX',
  'buenos aires': 'BUE',
  'rio de janeiro': 'RIO',
  'sao paulo': 'SAO',
  'lima': 'LIM',
  'santiago': 'SCL',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'cairo': 'CAI',
  'marrakech': 'RAK',
};

/**
 * Get HotelBeds destination code from a location string
 * @param location - City name or location string (e.g., "New York, NY" or "Paris, France")
 * @returns HotelBeds destination code (e.g., "NYC", "PAR")
 */
export const getHotelBedsDestinationCode = (location: string): string => {
  if (!location) return 'NYC'; // Default fallback
  
  // Extract city name from location string (before comma)
  const cityName = location.split(',')[0].trim().toLowerCase();
  
  // Look up in mapping
  const code = HOTELBEDS_DESTINATION_CODES[cityName];
  
  if (code) {
    return code;
  }
  
  // If not found, try partial matches
  for (const [key, value] of Object.entries(HOTELBEDS_DESTINATION_CODES)) {
    if (cityName.includes(key) || key.includes(cityName)) {
      return value;
    }
  }
  
  // Default fallback to NYC
  console.warn(`No HotelBeds destination code found for "${location}", using NYC as fallback`);
  return 'NYC';
};

/**
 * Get destination code from IATA airport code
 * Common airport codes map to nearby city destinations
 */
export const getDestinationFromAirportCode = (airportCode: string): string => {
  const airportMap: Record<string, string> = {
    'JFK': 'NYC', 'LGA': 'NYC', 'EWR': 'NYC',
    'LAX': 'LAX', 'SFO': 'SFO',
    'ORD': 'CHI', 'MIA': 'MIA',
    'LHR': 'LON', 'LGW': 'LON', 'STN': 'LON',
    'CDG': 'PAR', 'ORY': 'PAR',
    'FCO': 'ROM', 'BCN': 'BCN',
    'AMS': 'AMS', 'MAD': 'MAD',
    'DXB': 'DXB', 'NRT': 'TYO', 'HND': 'TYO',
    'SIN': 'SIN', 'HKG': 'HKG',
    'BKK': 'BKK', 'SYD': 'SYD',
  };
  
  return airportMap[airportCode.toUpperCase()] || airportCode;
};
