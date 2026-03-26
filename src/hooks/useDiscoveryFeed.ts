import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnsplashImage {
  id: string;
  urls: { small: string; regular: string; thumb: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; username: string };
  width: number;
  height: number;
}

function buildQueryFromPath(path: string[]): string {
  if (path.length === 0) return "luxury travel inspiration";
  return [...path.map((p) => p.toLowerCase().replace(/&/g, "and")), "travel"].join(" ");
}

export function useDiscoveryFeed(
  refinementPath: string[],
  enabled: boolean = true
) {
  const query = buildQueryFromPath(refinementPath);

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
    enabled: enabled && refinementPath.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export { buildQueryFromPath };

