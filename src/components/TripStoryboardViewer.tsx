// src/components/TripStoryboardViewer.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoryboardItem } from "@/services/storyboardService";

export function TripStoryboardViewer({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      // Find any storyboard for this trip with visibility "trip"
      const { data: storyboard, error: sbError } = await supabase
        .from("storyboards")
        .select("id")
        .eq("trip_id", tripId)
        .eq("visibility", "trip")
        .maybeSingle();

      if (sbError || !storyboard) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from("storyboard_items")
        .select("*")
        .eq("storyboard_id", storyboard.id)
        .order("order_index", { ascending: true });

      if (cancelled) return;

      if (itemsError) {
        console.error(itemsError);
        setItems([]);
      } else {
        setItems((items ?? []) as StoryboardItem[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-4 text-xs text-[#E5DFC6]/80">
        Loading trip storyboard…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-4 text-xs text-[#E5DFC6]/80">
        Your creator or agent hasn't built a visual storyboard yet. Once they do,
        you'll see the full mood of your journey here.
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[#E5DFC6]">
        Trip storyboard
      </h2>
      <p className="text-[11px] text-[#E5DFC6]/80">
        A visual preview of the hotels, moments, and scenes your trip is built
        around — curated by your creator and agent.
      </p>
      <div className="grid gap-2 md:grid-cols-3 auto-rows-[140px]">
        {items.map((item) => (
          <article
            key={item.id}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0c4d47] via-[#0a2225] to-[#BFAD72]"
          >
            {item.media_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.media_url})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-2">
              {item.caption && (
                <p className="text-[10px] text-[#E5DFC6] line-clamp-2">
                  {item.caption}
                </p>
              )}
              {(item.location_label || item.category_tag) && (
                <p className="text-[9px] text-[#BFAD72] mt-0.5">
                  {item.location_label}
                  {item.location_label && item.category_tag ? " · " : ""}
                  {item.category_tag}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
