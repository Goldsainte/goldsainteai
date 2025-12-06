// Curated destination images for consistent luxury aesthetic
const DESTINATION_IMAGES: Record<string, string> = {
  paris:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
  maldives:
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  "new york":
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
  london:
    "https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?auto=format&fit=crop&w=1600&q=80",
  tokyo:
    "https://images.unsplash.com/photo-1505067228394-439b67a8100f?auto=format&fit=crop&w=1600&q=80",
  "los angeles":
    "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1600&q=80",
  bali:
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
  santorini:
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80",
  dubai:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  miami:
    "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?auto=format&fit=crop&w=1600&q=80",
};

/**
 * Get a consistent hero image URL for a trip request.
 * 
 * @param destination - The destination name (e.g., "Paris", "Maldives")
 * @param override - Optional stored image URL that takes precedence
 * @returns Image URL for hero display
 */
export const getTripRequestImageUrl = (
  destination?: string | null,
  override?: string | null
): string => {
  // If the trip request has a curated cover image, use it
  if (override) return override;

  if (!destination) {
    // Generic luxury fallback
    return "https://picsum.photos/1600/900?random&luxury";
  }

  const key = destination.toLowerCase().trim();

  // Try curated matches first
  for (const city in DESTINATION_IMAGES) {
    if (key.includes(city)) {
      return DESTINATION_IMAGES[city];
    }
  }

  // Fallback: Picsum with destination seed for consistency
  const seed = destination.toLowerCase().replace(/\s+/g, '-');
  return `https://picsum.photos/seed/${seed}/1600/900`;
};
