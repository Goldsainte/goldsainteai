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
  {
    destination: 'Paris',
    packageCount: 2847,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  },
  {
    destination: 'Rome',
    packageCount: 1923,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  },
  {
    destination: 'London',
    packageCount: 2156,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  },
  {
    destination: 'Barcelona',
    packageCount: 1654,
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  },
  {
    destination: 'New York',
    packageCount: 2534,
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  },
  {
    destination: 'Tokyo',
    packageCount: 1876,
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  },
  {
    destination: 'Dubai',
    packageCount: 1432,
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  },
  {
    destination: 'Amsterdam',
    packageCount: 1287,
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
  },
  {
    destination: 'Singapore',
    packageCount: 1543,
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  },
  {
    destination: 'Lisbon',
    packageCount: 987,
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  },
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
