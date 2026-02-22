import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StoryboardItemRow = Database["public"]["Tables"]["storyboard_items"]["Row"];

export function TripStoryboardViewer({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<StoryboardItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      
      const { data: storyboard, error: sbError } = await supabase
        .from("storyboards")
        .select("id")
        .eq("trip_request_id", tripId)
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
        .order("position", { ascending: true });

      if (cancelled) return;

      if (itemsError) {
        console.error(itemsError);
        setItems([]);
      } else {
        setItems(items ?? []);
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
      <div className="h-24 rounded-xl bg-[#FDFBF5] animate-pulse" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5DFC6] px-4 py-6 text-center text-[11px] text-[#6B7280]">
        No storyboard yet. Once the traveler creates a visual brief, it will appear here.
      </div>
    );
  }

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 auto-rows-[110px]">
      {items.map((item) => (
        <article
          key={item.id}
          className="relative rounded-xl overflow-hidden border border-[#E5DFC6] bg-[#FDFBF5]"
        >
          {item.image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-2">
            {item.subtitle && (
              <p className="text-[10px] text-white font-medium line-clamp-2 drop-shadow-sm">
                {item.subtitle}
              </p>
            )}
            {item.title && (
              <p className="text-[9px] text-[#C7A962] mt-0.5 drop-shadow-sm">
                {item.title}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
