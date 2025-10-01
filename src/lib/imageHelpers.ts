/**
 * STRICT RULE: Return only real images from API, never use fallback images
 * This maintains customer credibility by showing only authentic hotel photos
 */
export const getHotelImage = (imageUrl: string | undefined, hotelId?: string): string => {
  // Only return valid URLs, no fallbacks
  if (imageUrl && imageUrl !== '/placeholder.svg') {
    return imageUrl;
  }
  // Return empty string if no real image - component should handle this
  return '';
};

/**
 * Get room image - no fallbacks
 */
export const getRoomImage = (imageUrl: string | undefined, roomId?: string): string => {
  if (imageUrl && imageUrl !== '/placeholder.svg') {
    return imageUrl;
  }
  return '';
};

/**
 * Get multiple hotel images - ONLY real images, no fallbacks
 */
export const getHotelImages = (
  images: (string | undefined)[] | undefined, 
  hotelId?: string,
  count: number = 6
): string[] => {
  const validImages = images?.filter(img => img && img !== '/placeholder.svg') || [];
  // Return only real images, never fill with fallbacks
  return validImages.slice(0, count);
};

/**
 * Get multiple room images - ONLY real images, no fallbacks
 */
export const getRoomImages = (
  images: (string | undefined)[] | undefined,
  roomId?: string,
  count: number = 3
): string[] => {
  const validImages = images?.filter(img => img && img !== '/placeholder.svg') || [];
  // Return only real images, never fill with fallbacks
  return validImages.slice(0, count);
};

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
