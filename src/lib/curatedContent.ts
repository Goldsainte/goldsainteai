// Curated content to ensure the page always looks rich and photo-filled
export interface CuratedDestination {
  destination: string;
  packageCount: number;
  imageUrl: string;
}

export interface CuratedAttraction {
  destination: string;
  packageCount: number;
  imageUrl: string;
}

export const curatedTopDestinations: CuratedDestination[] = [
  { destination: 'Paris', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
  { destination: 'Tokyo', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
  { destination: 'New York City', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' },
  { destination: 'London', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80' },
  { destination: 'Dubai', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80' },
  { destination: 'Rome', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80' },
  { destination: 'Barcelona', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80' },
  { destination: 'Singapore', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80' },
  { destination: 'Hong Kong', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80' },
  { destination: 'Bangkok', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80' },
  { destination: 'Sydney', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80' },
  { destination: 'Buenos Aires', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80' },
  { destination: 'Amsterdam', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80' },
  { destination: 'Lisbon', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80' },
  { destination: 'Kyoto', packageCount: 120, imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80' },
  { destination: 'Cape Town', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80' },
  { destination: 'Marrakesh', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80' },
  { destination: 'Vancouver', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1559511260-66a654ae982d?w=800&q=80' },
  { destination: 'Rio de Janeiro', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80' },
  { destination: 'Cairo', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80' },
  { destination: 'Seville', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80' },
  { destination: 'Reykjavik', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80' },
  { destination: 'Santorini', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80' },
  { destination: 'Abu Dhabi', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&q=80' },
  { destination: 'Doha', packageCount: 60, imageUrl: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800&q=80' },
  { destination: 'Maldives', packageCount: 24, imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80' },
  { destination: 'Bhutan', packageCount: 24, imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=80' },
  { destination: 'Queenstown', packageCount: 24, imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80' },
  { destination: 'Havana', packageCount: 24, imageUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80' },
  { destination: 'Luxor', packageCount: 24, imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80' },
];

export const curatedTopAttractions: CuratedAttraction[] = [
  {
    destination: 'Museums & Galleries',
    packageCount: 3421,
    imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b73053d5?w=800&q=80',
  },
  {
    destination: 'Historical Landmarks',
    packageCount: 2876,
    imageUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80',
  },
  {
    destination: 'Food & Wine Tours',
    packageCount: 1987,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  },
  {
    destination: 'Day Trips',
    packageCount: 2145,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    destination: 'Water Sports & Cruises',
    packageCount: 1654,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  {
    destination: 'Cultural Experiences',
    packageCount: 1876,
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  },
];

export const curatedDefaultCity = {
  name: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
};
