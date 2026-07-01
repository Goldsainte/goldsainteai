import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Capsule {
  label: string;
  value: string;
}

/**
 * A whisper-soft, horizontally scrolling row of editorial activity capsules.
 * Sourced from real DB aggregates via the get_marketplace_signals RPC.
 */
export function LiveSignalRow() {
  const { data } = useQuery({
    queryKey: ["marketplace-signals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_marketplace_signals");
      if (error) throw error;
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const capsules: Capsule[] = [
    { label: "Trending this week", value: data?.trending_count ? `${data.trending_count} stories` : "Just in" },
    { label: "Recently booked", value: data?.recently_booked_count ? `${data.recently_booked_count} trips` : "—" },
    { label: "New creators", value: data?.new_creators_count ? `${data.new_creators_count} this month` : "—" },
    { label: "Saved on Goldsainte", value: data?.total_saves_this_month ? `${data.total_saves_this_month}+` : "—" },
    { label: "In the collection", value: data?.active_trips ? `${data.active_trips} curated` : "—" },
  ];

  // Scroll-position-aware fade hints — this row easily overflows on mobile,
  // and with no visual cue that plain cutoff looked like a broken layout.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [data]);

  return (
    <div className="relative -mx-4 mb-6">
      <div
        className={`pointer-events-none absolute left-0 top-0 h-full w-8 z-10 transition-opacity duration-200 bg-gradient-to-r from-[#FDF9F0] to-transparent ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 h-full w-10 z-10 transition-opacity duration-200 bg-gradient-to-l from-[#FDF9F0] to-transparent ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={scrollRef}
        className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-3 md:gap-4">
          {capsules.map((c) => (
            <div
              key={c.label}
              className="shrink-0 rounded-full border border-[#E5DFC6] bg-white/60 px-4 py-2 backdrop-blur-sm"
            >
              <span className="font-secondary italic text-[12px] text-[#7A7151]">{c.label}</span>
              <span className="mx-2 text-[#C7B892]">·</span>
              <span className="text-[12px] font-medium text-[#0a2225]">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
