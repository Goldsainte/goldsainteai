// Helper to add sample 360 images for select hotels (for demo purposes)
// In production, this data would come from the hotel API

const SAMPLE_360_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop", // Hotel lobby
    title: "Lobby & Reception",
    description: "Explore our luxurious lobby with 24/7 concierge service and elegant seating areas.",
  },
  {
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=600&fit=crop", // Hotel room
    title: "Deluxe Suite",
    description: "Spacious suite with king-size bed, workspace, and stunning city views.",
  },
  {
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop", // Hotel pool
    title: "Rooftop Pool",
    description: "Infinity pool with panoramic views, open daily from 6 AM to 10 PM.",
  },
];

/**
 * Adds virtual tour data to select hotels for demonstration
 * In production, this would be included in the hotel API response
 */
export const enrichHotelWithVirtualTour = (hotel: any): any => {
  // Add 360 images to hotels with rating >= 8.5 (approximately 30% of hotels)
  const shouldHaveVirtualTour = hotel.rating >= 8.5 || hotel.reviewScore >= 8.5;
  
  if (shouldHaveVirtualTour) {
    return {
      ...hotel,
      images360: SAMPLE_360_IMAGES,
      hasVirtualTour: true,
    };
  }
  
  return hotel;
};

/**
 * Batch process hotels to add virtual tours where applicable
 */
export const enrichHotelsWithVirtualTours = (hotels: any[]): any[] => {
  return hotels.map(enrichHotelWithVirtualTour);
};
