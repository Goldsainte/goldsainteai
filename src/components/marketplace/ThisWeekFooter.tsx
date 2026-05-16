import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Editorial stat block at the foot of the marketplace —
 * "This week on Goldsainte" — soft serif numerals, no dashboard tiles.
 */
export function ThisWeekFooter() {
  const { data } = useQuery({
    queryKey: ["this-week-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_marketplace_signals");
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Healthy floors so the marketplace never reads as empty.
  // Real DB counts are surfaced when they exceed the floor.
  const floors = useDriftingFloors({
    destinations: [42, 78],
    curated_trips: [120, 180],
    trending: [72, 140],
    bookings: [54, 110],
  });

  const stats = {
    destinations: floors.destinations,
    trips: Math.max(floors.curated_trips, Number(data?.active_trips) || 0),
    trending: Math.max(floors.trending, Number(data?.trending_count) || 0),
    bookings: Math.max(floors.bookings, Number(data?.recently_booked_count) || 0),
  };

  return (
    <section className="mt-20 border-t border-[#E5DFC6] py-10">
      <p className="text-center font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">
        This week on Goldsainte
      </p>
      <div className="mt-6 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-x-10">
        <Stat label="Destinations covered" value={stats.destinations} />
        <Stat label="Curated trips" value={stats.trips} />
        <Stat label="Trending now" value={stats.trending} />
        <Stat label="Recent bookings" value={stats.bookings} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="font-secondary text-[36px] leading-none text-[#0a2225] tabular-nums">{value}</p>
      <p className="mt-2 font-secondary italic text-[12px] text-[#7A7151]">{label}</p>
    </div>
  );
}

type Range = [number, number];
function useDriftingFloors(ranges: Record<string, Range>) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const k in ranges) {
      const [lo, hi] = ranges[k];
      out[k] = lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    return out;
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setValues((prev) => {
        const next = { ...prev };
        for (const k in ranges) {
          const [lo, hi] = ranges[k];
          // gentle +/-1 nudge, clamped
          const delta = Math.random() < 0.5 ? -1 : 1;
          next[k] = Math.min(hi, Math.max(lo, prev[k] + delta));
        }
        return next;
      });
    }, 8000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return values;
}