// Major airports with their IATA codes, names, cities, and coordinates
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const airports: Airport[] = [
  // New York Area
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA", lat: 40.6413, lon: -73.7781 },
  { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "USA", lat: 40.7769, lon: -73.8740 },
  { code: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "USA", lat: 40.6895, lon: -74.1745 },
  
  // Los Angeles Area
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA", lat: 33.9416, lon: -118.4085 },
  { code: "BUR", name: "Hollywood Burbank Airport", city: "Burbank", country: "USA", lat: 34.2007, lon: -118.3587 },
  { code: "SNA", name: "John Wayne Airport", city: "Orange County", country: "USA", lat: 33.6762, lon: -117.8682 },
  { code: "ONT", name: "Ontario International Airport", city: "Ontario", country: "USA", lat: 34.0560, lon: -117.6012 },
  { code: "LGB", name: "Long Beach Airport", city: "Long Beach", country: "USA", lat: 33.8177, lon: -118.1516 },
  
  // San Francisco Area
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA", lat: 37.6213, lon: -122.3790 },
  { code: "OAK", name: "Oakland International Airport", city: "Oakland", country: "USA", lat: 37.7214, lon: -122.2208 },
  { code: "SJC", name: "Norman Y. Mineta San Jose International Airport", city: "San Jose", country: "USA", lat: 37.3639, lon: -121.9289 },
  
  // Chicago Area
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "USA", lat: 41.9742, lon: -87.9073 },
  { code: "MDW", name: "Midway International Airport", city: "Chicago", country: "USA", lat: 41.7868, lon: -87.7522 },
  
  // Washington DC Area
  { code: "IAD", name: "Washington Dulles International Airport", city: "Washington", country: "USA", lat: 38.9531, lon: -77.4565 },
  { code: "DCA", name: "Ronald Reagan Washington National Airport", city: "Arlington", country: "USA", lat: 38.8521, lon: -77.0377 },
  { code: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", country: "USA", lat: 39.1774, lon: -76.6684 },
  
  // Other Major US Cities
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "USA", lat: 33.6407, lon: -84.4277 },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "USA", lat: 32.8998, lon: -97.0403 },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas", country: "USA", lat: 32.8470, lon: -96.8518 },
  { code: "DEN", name: "Denver International Airport", city: "Denver", country: "USA", lat: 39.8561, lon: -104.6737 },
  { code: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "USA", lat: 47.4502, lon: -122.3088 },
  { code: "BOS", name: "Logan International Airport", city: "Boston", country: "USA", lat: 42.3656, lon: -71.0096 },
  { code: "MIA", name: "Miami International Airport", city: "Miami", country: "USA", lat: 25.7959, lon: -80.2870 },
  { code: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lon: -80.1506 },
  { code: "MCO", name: "Orlando International Airport", city: "Orlando", country: "USA", lat: 28.4294, lon: -81.3089 },
  { code: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "USA", lat: 33.4352, lon: -112.0101 },
  { code: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "USA", lat: 36.0840, lon: -115.1537 },
  { code: "MSP", name: "Minneapolis-St Paul International Airport", city: "Minneapolis", country: "USA", lat: 44.8848, lon: -93.2223 },
  { code: "DTW", name: "Detroit Metropolitan Wayne County Airport", city: "Detroit", country: "USA", lat: 42.2124, lon: -83.3534 },
  { code: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "USA", lat: 39.8744, lon: -75.2424 },
  { code: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "USA", lat: 35.2144, lon: -80.9473 },
  { code: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "USA", lat: 29.9902, lon: -95.3368 },
  { code: "HOU", name: "William P. Hobby Airport", city: "Houston", country: "USA", lat: 29.6454, lon: -95.2789 },
  { code: "PDX", name: "Portland International Airport", city: "Portland", country: "USA", lat: 45.5898, lon: -122.5951 },
  { code: "SAN", name: "San Diego International Airport", city: "San Diego", country: "USA", lat: 32.7338, lon: -117.1933 },
  { code: "TPA", name: "Tampa International Airport", city: "Tampa", country: "USA", lat: 27.9755, lon: -82.5332 },
  { code: "STL", name: "St. Louis Lambert International Airport", city: "St. Louis", country: "USA", lat: 38.7499, lon: -90.3697 },
  { code: "BNA", name: "Nashville International Airport", city: "Nashville", country: "USA", lat: 36.1245, lon: -86.6782 },
  { code: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "USA", lat: 30.1945, lon: -97.6699 },
  { code: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", country: "USA", lat: 35.8776, lon: -78.7875 },
  { code: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", country: "USA", lat: 40.7899, lon: -111.9791 },
  
  // International
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "UK", lat: 51.4700, lon: -0.4543 },
  { code: "LGW", name: "London Gatwick Airport", city: "London", country: "UK", lat: 51.1537, lon: -0.1821 },
  { code: "STN", name: "London Stansted Airport", city: "London", country: "UK", lat: 51.8860, lon: 0.2389 },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lon: 2.5479 },
  { code: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", lat: 48.7233, lon: 2.3794 },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.0379, lon: 8.5622 },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lon: 4.7683 },
  { code: "MAD", name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", country: "Spain", lat: 40.4983, lon: -3.5676 },
  { code: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain", lat: 41.2974, lon: 2.0833 },
  { code: "FCO", name: "Leonardo da Vinci-Fiumicino Airport", city: "Rome", country: "Italy", lat: 41.8003, lon: 12.2389 },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE", lat: 25.2532, lon: 55.3657 },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lon: 139.7798 },
  { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", lat: 35.7720, lon: 140.3929 },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "China", lat: 22.3080, lon: 113.9185 },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lon: 103.9915 },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", lat: 37.4602, lon: 126.4407 },
  { code: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", lat: -33.9399, lon: 151.1753 },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", lat: -37.6690, lon: 144.8410 },
  { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", lat: 43.6777, lon: -79.6248 },
  { code: "YUL", name: "Montreal-Pierre Elliott Trudeau International Airport", city: "Montreal", country: "Canada", lat: 45.4657, lon: -73.7455 },
  { code: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", lat: 49.1967, lon: -123.1815 },
  { code: "GRU", name: "São Paulo-Guarulhos International Airport", city: "São Paulo", country: "Brazil", lat: -23.4356, lon: -46.4731 },
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", lat: 19.4363, lon: -99.0721 },
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Search airports by code, name, or city
export function searchAirports(query: string, maxResults: number = 10): Airport[] {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  // Direct matches first (by code)
  const directMatches = airports.filter(airport => 
    airport.code.toLowerCase() === searchTerm
  );
  
  // Code starts with query
  const codeMatches = airports.filter(airport => 
    airport.code.toLowerCase().startsWith(searchTerm) &&
    !directMatches.includes(airport)
  );
  
  // Name or city contains query
  const nameMatches = airports.filter(airport => 
    (airport.name.toLowerCase().includes(searchTerm) || 
     airport.city.toLowerCase().includes(searchTerm)) &&
    !directMatches.includes(airport) &&
    !codeMatches.includes(airport)
  );
  
  return [...directMatches, ...codeMatches, ...nameMatches].slice(0, maxResults);
}

// Get nearby airports within a certain radius (in miles)
export function getNearbyAirports(airportCode: string, radiusMiles: number = 75): Airport[] {
  const mainAirport = airports.find(a => a.code.toUpperCase() === airportCode.toUpperCase());
  if (!mainAirport) return [];
  
  const nearby = airports
    .filter(airport => airport.code !== mainAirport.code)
    .map(airport => ({
      ...airport,
      distance: calculateDistance(mainAirport.lat, mainAirport.lon, airport.lat, airport.lon)
    }))
    .filter(airport => airport.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
  
  return [mainAirport, ...nearby];
}

// Get airports with nearby alternatives
export function searchAirportsWithNearby(query: string, radiusMiles: number = 75): Airport[] {
  const matches = searchAirports(query, 5);
  if (matches.length === 0) return [];
  
  // For the top match, include nearby airports
  const topMatch = matches[0];
  const nearby = getNearbyAirports(topMatch.code, radiusMiles);
  
  // Combine: top match with its nearby airports, then other matches
  const otherMatches = matches.slice(1);
  return [...nearby, ...otherMatches];
}
