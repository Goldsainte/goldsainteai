import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LiveTripCard } from "./LiveTripCard";

/**
 * Whisper-soft personalization row. Pulls a user's saved tag affinity and
 * surfaces matching trips with floating "why" tags. No chatbot UI.
 */
export function ForYouRow() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["for-you-row", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("content_style_tags, location, agent_specialties")
        .eq("id", user!.id)
        .maybeSingle();

      const tags = [
        ...((profile?.content_style_tags as string[]) || []),
        ...((profile?.agent_specialties as string[]) || []),
      ].filter(Boolean).slice(0, 6);

      let q = supabase
        .from("packaged_trips")
        .select(`
          id, slug, title, destination, cover_image_url, price_per_person, currency,
          duration_nights, duration_days, tags, view_count, booking_count, wishlist_count, created_at, is_verified,
          creator:profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, home_base, content_style_tags)
        `)
        .eq("status", "published")
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(8);

      if (tags.length > 0) {
        q = q.overlaps("tags", tags);
      }
      const { data: trips, error } = await q;
      if (error) throw error;

      const reason = tags.length > 0 ? `Inspired by your ${tags[0]} interest` : "Editor's picks for you";
      return { trips: trips || [], reason };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!user || !data?.trips?.length) return null;

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">For you</p>
          <h3 className="font-secondary text-[20px] text-[#0a2225]">{data.reason}</h3>
        </div>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 sm:gap-5">
          {data.trips.map((t: any) => (
            <div key={t.id} className="w-[180px] shrink-0 sm:w-[200px] md:w-[220px]">
              <LiveTripCard trip={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
