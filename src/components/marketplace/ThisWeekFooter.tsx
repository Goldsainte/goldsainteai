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

  return (
    <section className="mt-20 border-t border-[#E5DFC6] py-10">
      <p className="text-center font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">
        This week on Goldsainte
      </p>
      <div className="mt-6 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-x-10">
        <Stat label="New creators" value={data?.new_creators_count ?? "—"} />
        <Stat label="Curated trips" value={data?.active_trips ?? "—"} />
        <Stat label="Trending now" value={data?.trending_count ?? "—"} />
        <Stat label="Recent bookings" value={data?.recently_booked_count ?? "—"} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="font-secondary text-[36px] leading-none text-[#0a2225]">{value}</p>
      <p className="mt-2 font-secondary italic text-[12px] text-[#7A7151]">{label}</p>
    </div>
  );
}