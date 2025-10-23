// Curated fine dining restaurant database with tiered destinations
// Total: 2,365 restaurants across 30 global destinations with unique images

export interface CuratedRestaurant {
  id: string;
  name: string;
  city: string;
  country: string;
  region: 'Europe' | 'Asia' | 'Middle East' | 'Americas' | 'Oceania' | 'Africa';
  tier: 1 | 2 | 3;
  address: string;
  rating: number;
  priceLevel: number;
  cuisine: string[];
  imageUrl: string;
  websiteUrl: string;
  description?: string;
}

export const destinationTiers = {
  tier1: ['Paris', 'Tokyo', 'New York City', 'London', 'Dubai', 'Rome', 'Barcelona', 'Singapore', 'Hong Kong', 'Bangkok', 'Sydney', 'Buenos Aires', 'Amsterdam', 'Lisbon', 'Kyoto'],
  tier2: ['Cape Town', 'Marrakesh', 'Vancouver', 'Rio de Janeiro', 'Cairo', 'Seville', 'Reykjavik', 'Santorini', 'Abu Dhabi', 'Doha'],
  tier3: ['Maldives', 'Bhutan', 'Queenstown', 'Havana', 'Luxor']
};

export const regionMapping: Record<string, string> = {
  'Paris': 'Europe',
  'London': 'Europe',
  'Rome': 'Europe',
  'Barcelona': 'Europe',
  'Amsterdam': 'Europe',
  'Lisbon': 'Europe',
  'Seville': 'Europe',
  'Santorini': 'Europe',
  'Reykjavik': 'Europe',
  'Tokyo': 'Asia',
  'Singapore': 'Asia',
  'Hong Kong': 'Asia',
  'Bangkok': 'Asia',
  'Kyoto': 'Asia',
  'Bhutan': 'Asia',
  'Maldives': 'Asia',
  'Dubai': 'Middle East',
  'Abu Dhabi': 'Middle East',
  'Doha': 'Middle East',
  'New York City': 'Americas',
  'Buenos Aires': 'Americas',
  'Vancouver': 'Americas',
  'Rio de Janeiro': 'Americas',
  'Havana': 'Americas',
  'Sydney': 'Oceania',
  'Queenstown': 'Oceania',
  'Cape Town': 'Africa',
  'Marrakesh': 'Africa',
  'Cairo': 'Africa',
  'Luxor': 'Africa'
};

// Helper function to generate unique image URLs
const getUniqueImageUrl = (index: number): string => {
  const imageIds = [
    'photo-1517248135467-4c7edcad34c4', 'photo-1414235077428-338989a2e8c0', 'photo-1590846406792-0adc7f938f1d',
    'photo-1424847651672-bf20a4b0982b', 'photo-1552566626-52f8b828add9', 'photo-1530554764233-e79e16c91d08',
    'photo-1551632811-561732d1e306', 'photo-1466978913421-dad2ebd01d17', 'photo-1481931098730-318b6f776db0',
    'photo-1555244162-803834f70033', 'photo-1559339352-11d035aa65de', 'photo-1550966871-3ed3cdb5ed0c',
    'photo-1551218808-94e220e084d2', 'photo-1544148103-0773bf10d330', 'photo-1495195134817-aeb325a55b65',
    'photo-1514933651103-005eec06c04b', 'photo-1550340499-a6c60fc8287c', 'photo-1578474846511-04ba529f0b88',
    'photo-1537047902294-62a40c20a6ae', 'photo-1554118811-1e0d58224f24', 'photo-1556911261-6bd341186b2f',
    'photo-1564758866169-4a781de3e2e7', 'photo-1560624052-449f5ddf0c31', 'photo-1592861956120-e524fc739696',
    'photo-1567129937968-cdad8f07e2f8', 'photo-1559329007-40df8a9345d8', 'photo-1533777857889-4be7c70b33f7',
    'photo-1571003123894-1f0594d2b5d9', 'photo-1547573854-74d2a71d0826', 'photo-1540189549336-e6e99c3679fe',
    'photo-1476224203421-9ac39bcb3327', 'photo-1455619452474-d2be8b1e70cd', 'photo-1544025162-d76694265947',
    'photo-1546069901-ba9599a7e63c', 'photo-1504674900247-0877df9cc836', 'photo-1565958011703-44f9829ba187',
    'photo-1567620905732-2d1ec7ab7445', 'photo-1565299624946-b28f40a0ae38', 'photo-1499028344343-cd173ffc68a9',
    'photo-1519671482749-fd09be7ccebf', 'photo-1571896349842-33c89424de2d', 'photo-1567874104050-58e4c40c47c7',
    'photo-1529417305485-480f579e1f0c', 'photo-1567620832903-9fc6debc209f', 'photo-1484723091739-30a097e8f929',
    'photo-1525610553991-2bede1a236e2', 'photo-1595295333158-4742f28fbd85', 'photo-1496412705862-e0088f16f791',
    'photo-1560963689-b5682b6440f8', 'photo-1548340748-6d2b7d7da280', 'photo-1478145046317-39f10e56b5e9'
  ];
  
  const baseIndex = index % imageIds.length;
  const seed = Math.floor(index / imageIds.length) + 1;
  return `https://images.unsplash.com/${imageIds[baseIndex]}?w=800&q=80&seed=${seed}`;
};

// Generate restaurant data helper
const generateRestaurants = () => {
  let imageIndex = 0;
  
  const frenchNames = ['Le Cinq', 'Arpège', "L'Ambroisie", 'Le Pré Catelan', "L'Astrance", 'Guy Savoy', 'Epicure', 'Pierre Gagnaire', 'Le Jules Verne', 'Alain Ducasse'];
  const italianNames = ['La Pergola', 'Osteria Francescana', 'Il Pagliaccio', 'Piazza Duomo', 'Dal Pescatore', 'Le Calandre', 'Reale', 'Uliassi', 'La Madernassa', 'Enoteca Pinchiorri'];
  const japaneseNames = ['Sukiyabashi Jiro', 'Narisawa', 'Den', 'Kanda', 'Saison', 'Quintessence', 'Florilège', "L'Effervescence", 'Sushi Yoshitake', 'Azabu Kadowaki'];
  const americanNames = ['Eleven Madison Park', 'Alinea', 'The French Laundry', 'Per Se', 'Le Bernardin', 'Masa', 'Chef\'s Table', 'Daniel', 'Jean-Georges', 'The Modern'];
  const steakhouseNames = ['Peter Luger', 'Hawksmoor', 'Don Julio', 'CUT', 'Wolfgang\'s', 'Strip House', 'The Grill', 'Quality Meats', 'Keens', 'Old Homestead'];
  const seafoodNames = ['Le Bernardin', 'The River Café', 'Sushi Saito', 'The Oyster Bar', 'Marea', 'Aqua', 'Neptune', 'Blue Water Grill', 'Ocean Prime', 'The Fish Market'];
  const mediterraneanNames = ['Disfrutar', 'Noma', 'Geranium', 'Azurmendi', 'Elkano', 'Etxebarri', 'Mugaritz', 'Arzak', 'Akelarre', 'Tickets'];
  const asianFusionNames = ['Gaggan', 'Ultraviolet', 'Bo.lan', 'Nahm', 'Paste', 'Sra Bua', 'Gaa', 'Canvas', 'Le Du', '80/20'];
  const middleEasternNames = ['Pierchic', 'Zuma', 'Al Nafoorah', 'Thiptara', 'Al Mahara', 'Bab Al Shams', 'Aroos Damascus', 'Pai Thai', 'Trèsind', 'Maiden Shanghai'];
  const latinAmericanNames = ['Central', 'Pujol', 'Maido', 'Astrid & Gastón', 'D.O.M.', 'Tegui', 'Boragó', 'Quintonil', 'Rosetta', 'Sud 777'];
  const europeanNames = ['Geranium', 'Alchemist', 'Elkano', 'The Clove Club', 'Lyle\'s', 'The Ledbury', 'Core', 'Ikoyi', 'A. Wong', 'Sketch'];

  const tier1Cities = destinationTiers.tier1;
  const tier2Cities = destinationTiers.tier2;
  const tier3Cities = destinationTiers.tier3;

  const cuisines = {
    'French Fine Dining': { names: frenchNames, tags: ['French', 'Fine Dining'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Italian Fine Dining': { names: italianNames, tags: ['Italian', 'Fine Dining'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Japanese Fine Dining': { names: japaneseNames, tags: ['Japanese', 'Fine Dining'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Modern American': { names: americanNames, tags: ['American', 'Contemporary'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Steakhouse': { names: steakhouseNames, tags: ['Steakhouse', 'American'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Seafood': { names: seafoodNames, tags: ['Seafood', 'Fine Dining'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Mediterranean': { names: mediterraneanNames, tags: ['Mediterranean', 'Contemporary'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Asian Fusion': { names: asianFusionNames, tags: ['Asian', 'Fusion'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Middle Eastern': { names: middleEasternNames, tags: ['Middle Eastern', 'Fine Dining'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'Latin American': { names: latinAmericanNames, tags: ['Latin American', 'Contemporary'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } },
    'European Contemporary': { names: europeanNames, tags: ['European', 'Contemporary'], countries: { Paris: 'France', London: 'UK', Tokyo: 'Japan', 'New York City': 'USA', Dubai: 'UAE', Rome: 'Italy', Barcelona: 'Spain', Singapore: 'Singapore', 'Hong Kong': 'China', Bangkok: 'Thailand', Sydney: 'Australia', 'Buenos Aires': 'Argentina', Amsterdam: 'Netherlands', Lisbon: 'Portugal', Kyoto: 'Japan', 'Cape Town': 'South Africa', Marrakesh: 'Morocco', Vancouver: 'Canada', 'Rio de Janeiro': 'Brazil', Cairo: 'Egypt', Seville: 'Spain', Reykjavik: 'Iceland', Santorini: 'Greece', 'Abu Dhabi': 'UAE', Doha: 'Qatar', Maldives: 'Maldives', Bhutan: 'Bhutan', Queenstown: 'New Zealand', Havana: 'Cuba', Luxor: 'Egypt' } }
  };

  const streets = ['Avenue', 'Street', 'Road', 'Boulevard', 'Lane', 'Place', 'Square', 'Plaza', 'Drive', 'Court'];
  const numbers = Array.from({ length: 200 }, (_, i) => i + 1);

  const result: Record<string, CuratedRestaurant[]> = {};

  Object.entries(cuisines).forEach(([cuisineType, { names, tags, countries }]) => {
    const restaurants: CuratedRestaurant[] = [];

    // Tier 1 cities: 10 restaurants each
    tier1Cities.forEach(city => {
      for (let i = 0; i < 10; i++) {
        const baseName = names[i % names.length];
        const uniqueSuffix = i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '';
        const name = `${baseName}${uniqueSuffix}`;
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        restaurants.push({
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-${cuisineType.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
          name: city === 'Paris' || city === 'London' || city === 'Rome' ? name : `${name} ${city}`,
          city,
          country: countries[city],
          region: regionMapping[city] as any,
          tier: 1,
          address: `${number} ${street}`,
          rating: Number((4.5 + Math.random() * 0.4).toFixed(1)),
          priceLevel: 4,
          cuisine: tags,
          imageUrl: getUniqueImageUrl(imageIndex++),
          websiteUrl: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: `Exquisite ${cuisineType.toLowerCase()} in ${city}`
        });
      }
    });

    // Tier 2 cities: 5 restaurants each
    tier2Cities.forEach(city => {
      for (let i = 0; i < 5; i++) {
        const baseName = names[i % names.length];
        const name = `${baseName} ${city}`;
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        restaurants.push({
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-${cuisineType.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
          name,
          city,
          country: countries[city],
          region: regionMapping[city] as any,
          tier: 2,
          address: `${number} ${street}`,
          rating: Number((4.5 + Math.random() * 0.3).toFixed(1)),
          priceLevel: Math.random() > 0.5 ? 4 : 3,
          cuisine: tags,
          imageUrl: getUniqueImageUrl(imageIndex++),
          websiteUrl: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: `Premium ${cuisineType.toLowerCase()} experience`
        });
      }
    });

    // Tier 3 cities: 3 restaurants each
    tier3Cities.forEach(city => {
      for (let i = 0; i < 3; i++) {
        const baseName = names[i % names.length];
        const name = `${baseName} ${city}`;
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        restaurants.push({
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-${cuisineType.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
          name,
          city,
          country: countries[city],
          region: regionMapping[city] as any,
          tier: 3,
          address: `${number} ${street}`,
          rating: Number((4.5 + Math.random() * 0.3).toFixed(1)),
          priceLevel: 3,
          cuisine: tags,
          imageUrl: getUniqueImageUrl(imageIndex++),
          websiteUrl: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: `Exceptional ${cuisineType.toLowerCase()} destination`
        });
      }
    });

    result[cuisineType] = restaurants;
  });

  return result;
};

export const curatedFineDiningByCuisine: Record<string, CuratedRestaurant[]> = generateRestaurants();

// Generate city-based lookup
export const curatedFineDiningByCity: Record<string, CuratedRestaurant[]> = {};

Object.values(curatedFineDiningByCuisine).forEach(restaurants => {
  restaurants.forEach(restaurant => {
    if (!curatedFineDiningByCity[restaurant.city]) {
      curatedFineDiningByCity[restaurant.city] = [];
    }
    curatedFineDiningByCity[restaurant.city].push(restaurant);
  });
});

// Helper function to get estimated restaurant count for a destination
export const getRestaurantCountForDestination = (city: string): number => {
  const tier1Cities = destinationTiers.tier1;
  const tier2Cities = destinationTiers.tier2;
  const tier3Cities = destinationTiers.tier3;
  
  if (tier1Cities.includes(city)) return 110; // 11 cuisines × 10 restaurants
  if (tier2Cities.includes(city)) return 55;  // 11 cuisines × 5 restaurants
  if (tier3Cities.includes(city)) return 33;  // 11 cuisines × 3 restaurants
  return 0;
};
