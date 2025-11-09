// Country to currency mapping
export const countryCurrencyMap: Record<string, string> = {
  // North America
  'US': 'USD', 'USA': 'USD', 'United States': 'USD',
  'CA': 'CAD', 'Canada': 'CAD',
  'MX': 'MXN', 'Mexico': 'MXN',
  
  // Europe (EUR zone)
  'FR': 'EUR', 'France': 'EUR',
  'DE': 'EUR', 'Germany': 'EUR',
  'IT': 'EUR', 'Italy': 'EUR',
  'ES': 'EUR', 'Spain': 'EUR',
  'PT': 'EUR', 'Portugal': 'EUR',
  'GR': 'EUR', 'Greece': 'EUR',
  'NL': 'EUR', 'Netherlands': 'EUR',
  'BE': 'EUR', 'Belgium': 'EUR',
  'AT': 'EUR', 'Austria': 'EUR',
  'IE': 'EUR', 'Ireland': 'EUR',
  
  // Europe (non-EUR)
  'GB': 'GBP', 'UK': 'GBP', 'United Kingdom': 'GBP',
  'CH': 'CHF', 'Switzerland': 'CHF',
  'SE': 'SEK', 'Sweden': 'SEK',
  'NO': 'NOK', 'Norway': 'NOK',
  'DK': 'DKK', 'Denmark': 'DKK',
  'PL': 'PLN', 'Poland': 'PLN',
  'CZ': 'CZK', 'Czech Republic': 'CZK',
  
  // Asia Pacific
  'JP': 'JPY', 'Japan': 'JPY',
  'CN': 'CNY', 'China': 'CNY',
  'KR': 'KRW', 'South Korea': 'KRW',
  'IN': 'INR', 'India': 'INR',
  'AU': 'AUD', 'Australia': 'AUD',
  'NZ': 'NZD', 'New Zealand': 'NZD',
  'SG': 'SGD', 'Singapore': 'SGD',
  'HK': 'HKD', 'Hong Kong': 'HKD',
  'TH': 'THB', 'Thailand': 'THB',
  'MY': 'MYR', 'Malaysia': 'MYR',
  'ID': 'IDR', 'Indonesia': 'IDR',
  'PH': 'PHP', 'Philippines': 'PHP',
  'VN': 'VND', 'Vietnam': 'VND',
  
  // Middle East
  'AE': 'AED', 'UAE': 'AED', 'Dubai': 'AED', 'United Arab Emirates': 'AED',
  'SA': 'SAR', 'Saudi Arabia': 'SAR',
  'IL': 'ILS', 'Israel': 'ILS',
  'TR': 'TRY', 'Turkey': 'TRY',
  
  // South America
  'BR': 'BRL', 'Brazil': 'BRL',
  'AR': 'ARS', 'Argentina': 'ARS',
  'CL': 'CLP', 'Chile': 'CLP',
  'CO': 'COP', 'Colombia': 'COP',
  
  // Africa
  'ZA': 'ZAR', 'South Africa': 'ZAR',
  'EG': 'EGP', 'Egypt': 'EGP',
  'MA': 'MAD', 'Morocco': 'MAD',
};

// City to country mapping
export const cityToCountryMap: Record<string, string> = {
  'New York': 'US', 'Los Angeles': 'US', 'Chicago': 'US', 'Miami': 'US',
  'San Francisco': 'US', 'Las Vegas': 'US', 'Seattle': 'US', 'Boston': 'US',
  'Atlanta': 'US', 'Washington': 'US',
  
  'London': 'GB', 'Paris': 'FR', 'Rome': 'IT', 'Barcelona': 'ES',
  'Madrid': 'ES', 'Berlin': 'DE', 'Amsterdam': 'NL', 'Vienna': 'AT',
  'Prague': 'CZ', 'Athens': 'GR', 'Lisbon': 'PT', 'Dublin': 'IE',
  'Brussels': 'BE', 'Zurich': 'CH', 'Geneva': 'CH', 'Stockholm': 'SE',
  'Copenhagen': 'DK', 'Oslo': 'NO',
  
  'Tokyo': 'JP', 'Osaka': 'JP', 'Beijing': 'CN', 'Shanghai': 'CN',
  'Hong Kong': 'HK', 'Singapore': 'SG', 'Seoul': 'KR', 'Bangkok': 'TH',
  'Kuala Lumpur': 'MY', 'Jakarta': 'ID', 'Manila': 'PH', 'Hanoi': 'VN',
  'Ho Chi Minh City': 'VN', 'Mumbai': 'IN', 'Delhi': 'IN', 'Bangalore': 'IN',
  
  'Dubai': 'AE', 'Abu Dhabi': 'AE', 'Riyadh': 'SA', 'Tel Aviv': 'IL',
  'Jerusalem': 'IL', 'Istanbul': 'TR',
  
  'Sydney': 'AU', 'Melbourne': 'AU', 'Brisbane': 'AU',
  'Auckland': 'NZ', 'Wellington': 'NZ',
  
  'Toronto': 'CA', 'Vancouver': 'CA', 'Montreal': 'CA',
  'Mexico City': 'MX', 'Cancun': 'MX',
  'São Paulo': 'BR', 'Rio de Janeiro': 'BR', 'Buenos Aires': 'AR',
  'Santiago': 'CL', 'Cape Town': 'ZA', 'Cairo': 'EG', 'Marrakech': 'MA',
};

/**
 * Get currency code based on location (city or country)
 */
export function getCurrencyFromLocation(location: string): string {
  if (!location) return 'USD';
  
  const normalized = location.trim();
  
  // Try direct country lookup
  if (countryCurrencyMap[normalized]) {
    return countryCurrencyMap[normalized];
  }
  
  // Try city to country lookup
  if (cityToCountryMap[normalized]) {
    const country = cityToCountryMap[normalized];
    return countryCurrencyMap[country] || 'USD';
  }
  
  // Try partial match - but only for longer strings to avoid false matches
  // (e.g., "CLT" should not match "CL" for Chile)
  if (normalized.length > 3) {
    const countryKey = Object.keys(countryCurrencyMap).find(key => 
      normalized.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(normalized.toLowerCase())
    );
    
    if (countryKey) {
      return countryCurrencyMap[countryKey];
    }
  }
  
  return 'USD';
}
