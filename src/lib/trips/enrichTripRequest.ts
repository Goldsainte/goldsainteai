// Helper functions to enrich and format trip request data

import { Database } from "@/integrations/supabase/types";

type TripRequest = Database["public"]["Tables"]["trip_requests"]["Row"];

/**
 * Format date range from start_date and end_date
 */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null
): string | null {
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();

  if (!end) {
    return `${startMonth} ${startDay}`;
  }

  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();

  // Same month
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }

  // Different months
  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

/**
 * Format budget range from min and max
 */
export function formatBudgetRange(
  min: number | null,
  max: number | null
): string | null {
  if (!min && !max) return null;

  const formatK = (n: number) => {
    if (n >= 1000) {
      return `$${(n / 1000).toFixed(0)}k`;
    }
    return `$${n}`;
  };

  if (!max) return `From ${formatK(min!)}`;
  if (!min) return `Up to ${formatK(max)}`;
  return `${formatK(min)}–${formatK(max)}`;
}

/**
 * Calculate total travelers count
 */
export function getTravelersCount(
  adults: number,
  children: number | null
): number {
  return adults + (children || 0);
}

/**
 * Extract tags from source_metadata
 */
export function extractTags(
  sourceMetadata: Record<string, any> | null
): string[] {
  if (!sourceMetadata) return [];

  const tags: string[] = [];

  // Collection tags
  if (Array.isArray(sourceMetadata.collection_tags)) {
    tags.push(...sourceMetadata.collection_tags);
  }

  // Storyboard tags
  if (Array.isArray(sourceMetadata.storyboard_tags)) {
    tags.push(...sourceMetadata.storyboard_tags);
  }

  // Tags directly in metadata
  if (Array.isArray(sourceMetadata.tags)) {
    tags.push(...sourceMetadata.tags);
  }

  return [...new Set(tags)]; // Deduplicate
}

/**
 * Get brand/collection info from source_metadata
 */
export function getBrandInfo(sourceMetadata: Record<string, any> | null) {
  if (!sourceMetadata) {
    return {
      brandName: null,
      collectionTitle: null,
    };
  }

  return {
    brandName: sourceMetadata.brand_name || null,
    collectionTitle: sourceMetadata.collection_title || null,
  };
}
