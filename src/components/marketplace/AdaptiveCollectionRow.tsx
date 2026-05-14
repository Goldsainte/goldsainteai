import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LiveTripCard } from "./LiveTripCard";

interface AdaptiveCollectionRowProps {
  title: string;
  kicker?: string;
  tags: string[];
}

/**
 * Editorial dynamic collection — pulls trips matching a tag cluster.
 * Used to surface intelligent groupings like "Slow Luxury" or "Hidden Cities".
 */
export function AdaptiveCollectionRow({ title, kicker = "Collection", tags }: AdaptiveCollectionRowProps) {
  const { data } = useQuery({
    queryKey: ["adaptive-collection", title, tags],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, duration_days, tags, view_count, booking_count, wishlist_count, created_at, is_verified,
          creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, home_base, content_style_tags)
        `)
        .eq("status", "published")
        .overlaps("tags", tags)
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-3">
        <p className="font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">{kicker}</p>
        <h3 className="font-secondary text-[22px] text-[#0a2225]">{title}</h3>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 sm:gap-5">
          {data.map((t: any) => (
            <div key={t.id} className="w-[200px] shrink-0 sm:w-[260px] md:w-[280px]">
              <LiveTripCard trip={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}