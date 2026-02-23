import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StoryboardItemRow = Database["public"]["Tables"]["storyboard_items"]["Row"];

interface TripStoryboardViewerProps {
  tripId: string;
  variant?: "sidebar" | "gallery";
}

export function TripStoryboardViewer({ tripId, variant = "sidebar" }: TripStoryboardViewerProps) {
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
      <div className={variant === "gallery" ? "h-[180px]" : "h-24"} >
        <div className="h-full rounded-xl bg-[#FDFBF5] animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5DFC6] px-4 py-8 text-center text-sm text-[#6B7280]">
        No storyboard yet. Once the traveler creates a visual brief, it will appear here.
      </div>
    );
  }

  // Gallery variant: horizontal scroll with large tiles
  if (variant === "gallery") {
    return (
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {items.map((item) => (
            <article
              key={item.id}
              className="relative flex-none w-[260px] sm:w-[300px] h-[200px] sm:h-[220px] rounded-2xl overflow-hidden border border-[#E5DFC6] bg-[#FDFBF5] snap-start group"
            >
              {item.image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.image_url})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-4">
                {item.subtitle && (
                  <p className="text-sm text-white font-medium line-clamp-2 drop-shadow-sm">
                    {item.subtitle}
                  </p>
                )}
                {item.title && (
                  <p className="text-xs text-[#C7A962] mt-1 drop-shadow-sm font-medium">
                    {item.title}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#f7f3ea] to-transparent hidden md:block" />
      </div>
    );
  }

  // Sidebar variant: compact grid
  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 auto-rows-[120px]">
      {items.map((item) => (
        <article
          key={item.id}
          className="relative rounded-xl overflow-hidden border border-[#E5DFC6] bg-[#FDFBF5] group"
        >
          {item.image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${item.image_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-2.5">
            {item.subtitle && (
              <p className="text-xs text-white font-medium line-clamp-2 drop-shadow-sm">
                {item.subtitle}
              </p>
            )}
            {item.title && (
              <p className="text-[11px] text-[#C7A962] mt-0.5 drop-shadow-sm">
                {item.title}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
