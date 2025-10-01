/**
 * Helper functions for handling images with fallbacks
 */

// Fallback hotel images
const FALLBACK_HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
];

// Fallback room images
const FALLBACK_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
];

/**
 * Get hotel image with fallback
 */
export const getHotelImage = (imageUrl: string | undefined, hotelId?: string): string => {
  if (imageUrl && imageUrl !== '/placeholder.svg') {
    return imageUrl;
  }
  
  // Use hotel ID to consistently get the same fallback image
  const index = hotelId ? Math.abs(hashCode(hotelId)) % FALLBACK_HOTEL_IMAGES.length : 0;
  return FALLBACK_HOTEL_IMAGES[index];
};

/**
 * Get room image with fallback
 */
export const getRoomImage = (imageUrl: string | undefined, roomId?: string): string => {
  if (imageUrl && imageUrl !== '/placeholder.svg') {
    return imageUrl;
  }
  
  // Use room ID to consistently get the same fallback image
  const index = roomId ? Math.abs(hashCode(roomId)) % FALLBACK_ROOM_IMAGES.length : 0;
  return FALLBACK_ROOM_IMAGES[index];
};

/**
 * Get multiple hotel images with fallbacks
 */
export const getHotelImages = (
  images: (string | undefined)[] | undefined, 
  hotelId?: string,
  count: number = 6
): string[] => {
  const validImages = images?.filter(img => img && img !== '/placeholder.svg') || [];
  
  if (validImages.length >= count) {
    return validImages.slice(0, count);
  }
  
  // Fill remaining slots with fallback images
  const result = [...validImages];
  while (result.length < count) {
    const index = (result.length + (hotelId ? hashCode(hotelId) : 0)) % FALLBACK_HOTEL_IMAGES.length;
    result.push(FALLBACK_HOTEL_IMAGES[index]);
  }
  
  return result;
};

/**
 * Get multiple room images with fallbacks
 */
export const getRoomImages = (
  images: (string | undefined)[] | undefined,
  roomId?: string,
  count: number = 3
): string[] => {
  const validImages = images?.filter(img => img && img !== '/placeholder.svg') || [];
  
  if (validImages.length >= count) {
    return validImages.slice(0, count);
  }
  
  // Fill remaining slots with fallback images
  const result = [...validImages];
  while (result.length < count) {
    const index = (result.length + (roomId ? hashCode(roomId) : 0)) % FALLBACK_ROOM_IMAGES.length;
    result.push(FALLBACK_ROOM_IMAGES[index]);
  }
  
  return result;
};

/**
 * Simple hash function for consistent fallback selection
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url || url === '/placeholder.svg') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
