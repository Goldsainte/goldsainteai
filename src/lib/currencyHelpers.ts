// Country to currency mapping
export const countryCurrencyMap: Record<string, { code: string; symbol: string }> = {
  // North America
  'US': { code: 'USD', symbol: '$' },
  'USA': { code: 'USD', symbol: '$' },
  'United States': { code: 'USD', symbol: '$' },
  'CA': { code: 'CAD', symbol: 'C$' },
  'Canada': { code: 'CAD', symbol: 'C$' },
  'MX': { code: 'MXN', symbol: 'MX$' },
  'Mexico': { code: 'MXN', symbol: 'MX$' },
  
  // Europe
  'GB': { code: 'GBP', symbol: '£' },
  'UK': { code: 'GBP', symbol: '£' },
  'United Kingdom': { code: 'GBP', symbol: '£' },
  'FR': { code: 'EUR', symbol: '€' },
  'France': { code: 'EUR', symbol: '€' },
  'DE': { code: 'EUR', symbol: '€' },
  'Germany': { code: 'EUR', symbol: '€' },
  'IT': { code: 'EUR', symbol: '€' },
  'Italy': { code: 'EUR', symbol: '€' },
  'ES': { code: 'EUR', symbol: '€' },
  'Spain': { code: 'EUR', symbol: '€' },
  'PT': { code: 'EUR', symbol: '€' },
  'Portugal': { code: 'EUR', symbol: '€' },
  'GR': { code: 'EUR', symbol: '€' },
  'Greece': { code: 'EUR', symbol: '€' },
  'NL': { code: 'EUR', symbol: '€' },
  'Netherlands': { code: 'EUR', symbol: '€' },
  'BE': { code: 'EUR', symbol: '€' },
  'Belgium': { code: 'EUR', symbol: '€' },
  'AT': { code: 'EUR', symbol: '€' },
  'Austria': { code: 'EUR', symbol: '€' },
  'IE': { code: 'EUR', symbol: '€' },
  'Ireland': { code: 'EUR', symbol: '€' },
  'CH': { code: 'CHF', symbol: 'CHF' },
  'Switzerland': { code: 'CHF', symbol: 'CHF' },
  'SE': { code: 'SEK', symbol: 'kr' },
  'Sweden': { code: 'SEK', symbol: 'kr' },
  'NO': { code: 'NOK', symbol: 'kr' },
  'Norway': { code: 'NOK', symbol: 'kr' },
  'DK': { code: 'DKK', symbol: 'kr' },
  'Denmark': { code: 'DKK', symbol: 'kr' },
  'PL': { code: 'PLN', symbol: 'zł' },
  'Poland': { code: 'PLN', symbol: 'zł' },
  'CZ': { code: 'CZK', symbol: 'Kč' },
  'Czech Republic': { code: 'CZK', symbol: 'Kč' },
  
  // Asia Pacific
  'JP': { code: 'JPY', symbol: '¥' },
  'Japan': { code: 'JPY', symbol: '¥' },
  'CN': { code: 'CNY', symbol: '¥' },
  'China': { code: 'CNY', symbol: '¥' },
  'KR': { code: 'KRW', symbol: '₩' },
  'South Korea': { code: 'KRW', symbol: '₩' },
  'IN': { code: 'INR', symbol: '₹' },
  'India': { code: 'INR', symbol: '₹' },
  'AU': { code: 'AUD', symbol: 'A$' },
  'Australia': { code: 'AUD', symbol: 'A$' },
  'NZ': { code: 'NZD', symbol: 'NZ$' },
  'New Zealand': { code: 'NZD', symbol: 'NZ$' },
  'SG': { code: 'SGD', symbol: 'S$' },
  'Singapore': { code: 'SGD', symbol: 'S$' },
  'HK': { code: 'HKD', symbol: 'HK$' },
  'Hong Kong': { code: 'HKD', symbol: 'HK$' },
  'TH': { code: 'THB', symbol: '฿' },
  'Thailand': { code: 'THB', symbol: '฿' },
  'MY': { code: 'MYR', symbol: 'RM' },
  'Malaysia': { code: 'MYR', symbol: 'RM' },
  'ID': { code: 'IDR', symbol: 'Rp' },
  'Indonesia': { code: 'IDR', symbol: 'Rp' },
  'PH': { code: 'PHP', symbol: '₱' },
  'Philippines': { code: 'PHP', symbol: '₱' },
  'VN': { code: 'VND', symbol: '₫' },
  'Vietnam': { code: 'VND', symbol: '₫' },
  
  // Middle East
  'AE': { code: 'AED', symbol: 'د.إ' },
  'UAE': { code: 'AED', symbol: 'د.إ' },
  'Dubai': { code: 'AED', symbol: 'د.إ' },
  'United Arab Emirates': { code: 'AED', symbol: 'د.إ' },
  'SA': { code: 'SAR', symbol: 'ر.س' },
  'Saudi Arabia': { code: 'SAR', symbol: 'ر.س' },
  'IL': { code: 'ILS', symbol: '₪' },
  'Israel': { code: 'ILS', symbol: '₪' },
  'TR': { code: 'TRY', symbol: '₺' },
  'Turkey': { code: 'TRY', symbol: '₺' },
  
  // South America
  'BR': { code: 'BRL', symbol: 'R$' },
  'Brazil': { code: 'BRL', symbol: 'R$' },
  'AR': { code: 'ARS', symbol: 'AR$' },
  'Argentina': { code: 'ARS', symbol: 'AR$' },
  'CL': { code: 'CLP', symbol: 'CL$' },
  'Chile': { code: 'CLP', symbol: 'CL$' },
  'CO': { code: 'COP', symbol: 'CO$' },
  'Colombia': { code: 'COP', symbol: 'CO$' },
  
  // Africa
  'ZA': { code: 'ZAR', symbol: 'R' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
  'EG': { code: 'EGP', symbol: 'E£' },
  'Egypt': { code: 'EGP', symbol: 'E£' },
  'MA': { code: 'MAD', symbol: 'د.م.' },
  'Morocco': { code: 'MAD', symbol: 'د.م.' },
};

// City to country mapping for common destinations
export const cityToCountryMap: Record<string, string> = {
  // US Cities
  'New York': 'US',
  'Los Angeles': 'US',
  'Chicago': 'US',
  'Miami': 'US',
  'San Francisco': 'US',
  'Las Vegas': 'US',
  'Seattle': 'US',
  'Boston': 'US',
  'Atlanta': 'US',
  'Washington': 'US',
  
  // European Cities
  'London': 'GB',
  'Paris': 'FR',
  'Rome': 'IT',
  'Barcelona': 'ES',
  'Madrid': 'ES',
  'Berlin': 'DE',
  'Amsterdam': 'NL',
  'Vienna': 'AT',
  'Prague': 'CZ',
  'Athens': 'GR',
  'Lisbon': 'PT',
  'Dublin': 'IE',
  'Brussels': 'BE',
  'Zurich': 'CH',
  'Geneva': 'CH',
  'Stockholm': 'SE',
  'Copenhagen': 'DK',
  'Oslo': 'NO',
  
  // Asian Cities
  'Tokyo': 'JP',
  'Osaka': 'JP',
  'Beijing': 'CN',
  'Shanghai': 'CN',
  'Hong Kong': 'HK',
  'Singapore': 'SG',
  'Seoul': 'KR',
  'Bangkok': 'TH',
  'Kuala Lumpur': 'MY',
  'Jakarta': 'ID',
  'Manila': 'PH',
  'Hanoi': 'VN',
  'Ho Chi Minh City': 'VN',
  'Mumbai': 'IN',
  'Delhi': 'IN',
  'Bangalore': 'IN',
  
  // Middle East Cities
  'Dubai': 'AE',
  'Abu Dhabi': 'AE',
  'Riyadh': 'SA',
  'Tel Aviv': 'IL',
  'Jerusalem': 'IL',
  'Istanbul': 'TR',
  
  // Oceania Cities
  'Sydney': 'AU',
  'Melbourne': 'AU',
  'Brisbane': 'AU',
  'Auckland': 'NZ',
  'Wellington': 'NZ',
  
  // Other
  'Toronto': 'CA',
  'Vancouver': 'CA',
  'Montreal': 'CA',
  'Mexico City': 'MX',
  'Cancun': 'MX',
  'São Paulo': 'BR',
  'Rio de Janeiro': 'BR',
  'Buenos Aires': 'AR',
  'Santiago': 'CL',
  'Cape Town': 'ZA',
  'Cairo': 'EG',
  'Marrakech': 'MA',
};

/**
 * Get currency info based on location (city or country)
 */
export function getCurrencyFromLocation(location: string): { code: string; symbol: string } {
  if (!location) return { code: 'USD', symbol: '$' };
  
  const normalizedLocation = location.trim();
  
  // Try direct country lookup
  if (countryCurrencyMap[normalizedLocation]) {
    return countryCurrencyMap[normalizedLocation];
  }
  
  // Try city to country lookup
  if (cityToCountryMap[normalizedLocation]) {
    const country = cityToCountryMap[normalizedLocation];
    return countryCurrencyMap[country] || { code: 'USD', symbol: '$' };
  }
  
  // Try partial match for countries
  const countryKey = Object.keys(countryCurrencyMap).find(key => 
    normalizedLocation.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(normalizedLocation.toLowerCase())
  );
  
  if (countryKey) {
    return countryCurrencyMap[countryKey];
  }
  
  // Default to USD
  return { code: 'USD', symbol: '$' };
}

/**
 * Format price with appropriate currency symbol
 */
export function formatPrice(amount: number, location: string): string {
  const { symbol } = getCurrencyFromLocation(location);
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency code for API calls
 */
export function getCurrencyCode(location: string): string {
  return getCurrencyFromLocation(location).code;
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const entry = Object.values(countryCurrencyMap).find(c => c.code === currencyCode);
  return entry?.symbol || currencyCode;
}

/**
 * Format amount with currency symbol from currency code
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  // For codes that don't have a symbol, put code after amount
  if (symbol === currencyCode) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}
