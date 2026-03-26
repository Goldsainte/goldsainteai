import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUBCATEGORY_SEARCH_TERMS, CATEGORY_KEYWORDS } from "@/components/ui/CategoryChips";

export interface UnsplashImage {
  id: string;
  urls: { small: string; regular: string; thumb: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; username: string };
  width: number;
  height: number;
}

function buildQuery(
  category: string,
  subcategory: string | null,
  tags: string[]
): string {
  if (category === "All" && !subcategory && tags.length === 0) {
    return "luxury travel inspiration";
  }

  // If subcategory has a specific search term, use it
  if (subcategory && SUBCATEGORY_SEARCH_TERMS[subcategory]) {
    const extra = tags.length > 0 ? " " + tags.join(" ") : "";
    return SUBCATEGORY_SEARCH_TERMS[subcategory] + extra;
  }

  // Build from category keywords + subcategory + tags
  const parts: string[] = [];
  if (category !== "All") {
    // Use the category name itself as primary term
    parts.push(category.toLowerCase().replace(/&/g, "and"));
  }
  if (subcategory) {
    parts.push(subcategory.toLowerCase());
  }
  parts.push(...tags);
  parts.push("travel");

  return parts.join(" ");
}

export function useDiscoveryFeed(
  category: string,
  subcategory: string | null,
  tags: string[] = [],
  enabled: boolean = true
) {
  const query = buildQuery(category, subcategory, tags);

  return useInfiniteQuery({
    queryKey: ["discovery-feed", query],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await supabase.functions.invoke(
        "unsplash-search",
        {
          body: { q: query, page: pageParam },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        images: (data?.results || []) as UnsplashImage[],
        nextPage: pageParam + 1,
        hasMore: (data?.results || []).length >= 18,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    enabled: enabled && category !== "All",
    staleTime: 5 * 60 * 1000,
  });
}

export { buildQuery };
