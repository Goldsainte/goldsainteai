export interface Restaurant {
  id: number;
  name: string;
  location: string;
  image: string;
  priceLevel: string;
  rating: number;
  cuisine: string;
  websiteUrl?: string;
  googlePlacesId?: string;
}

export const topUSRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "The French Laundry",
    location: "Yountville, California",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.9,
    cuisine: "Contemporary French",
    websiteUrl: "https://www.thomaskeller.com/tfl",
  },
  {
    id: 2,
    name: "Alinea",
    location: "Chicago, Illinois",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.8,
    cuisine: "Molecular Gastronomy",
    websiteUrl: "https://www.alinearestaurant.com",
  },
  {
    id: 3,
    name: "Le Bernardin",
    location: "New York, New York",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.8,
    cuisine: "French Seafood",
    websiteUrl: "https://www.le-bernardin.com",
  },
  {
    id: 4,
    name: "Eleven Madison Park",
    location: "New York, New York",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.7,
    cuisine: "Contemporary American",
    websiteUrl: "https://www.elevenmadisonpark.com",
  },
  {
    id: 5,
    name: "Per Se",
    location: "New York, New York",
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.8,
    cuisine: "Contemporary French",
    websiteUrl: "https://www.thomaskeller.com/perseny",
  },
  {
    id: 6,
    name: "SingleThread",
    location: "Healdsburg, California",
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.9,
    cuisine: "Japanese-Californian",
    websiteUrl: "https://www.singlethreadfarms.com",
  },
  {
    id: 7,
    name: "Atelier Crenn",
    location: "San Francisco, California",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.7,
    cuisine: "Modern French",
    websiteUrl: "https://www.ateliercrenn.com",
  },
  {
    id: 8,
    name: "Benu",
    location: "San Francisco, California",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.8,
    cuisine: "Asian Fusion",
    websiteUrl: "https://www.benusf.com",
  },
  {
    id: 9,
    name: "Canlis",
    location: "Seattle, Washington",
    image: "https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.7,
    cuisine: "Pacific Northwest",
    websiteUrl: "https://www.canlis.com",
  },
  {
    id: 10,
    name: "Addison",
    location: "San Diego, California",
    image: "https://images.unsplash.com/photo-1613743983303-b3e89f8a7146?w=800&q=80",
    priceLevel: "$$$$",
    rating: 4.9,
    cuisine: "Contemporary California",
    websiteUrl: "https://www.addisondelmar.com",
  },
];
