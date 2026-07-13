import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Booking.com-structured destination browse for the Tours tab, in Goldsainte
// skin: "Top destinations" hero cards + "Explore more destinations" with
// regional tabs. Each card fetches its own Viator search (cached 30 min) and
// uses the top result's photo + the live totalCount. Clicking a card runs the
// same destination search the tours search box would.

const TOP_DESTINATIONS = ["Paris", "London", "Rome", "New York", "Tokyo", "Dubai"];

const REGIONS: Record<string, string[]> = {
  Europe: ["London", "Paris", "Rome", "Barcelona", "Amsterdam", "Athens", "Lisbon", "Venice"],
  "North America": ["New York", "Las Vegas", "Miami", "Los Angeles", "San Francisco", "Chicago", "Toronto", "Vancouver"],
  Asia: ["Tokyo", "Kyoto", "Bangkok", "Singapore", "Bali", "Hong Kong", "Seoul", "Hanoi"],
  "Middle East & Africa": ["Dubai", "Istanbul", "Marrakech", "Cairo", "Cape Town", "Abu Dhabi", "Doha", "Nairobi"],
  "Latin America & Caribbean": ["Mexico City", "Cancun", "Rio de Janeiro", "Buenos Aires", "Lima", "Cartagena", "Nassau", "San Juan"],
  Oceania: ["Sydney", "Melbourne", "Queenstown", "Auckland", "Cairns", "Gold Coast", "Fiji", "Hobart"],
};

interface DestinationCardData {
  count: number;
  image: string | null;
}

function useDestinationTours(name: string) {
  return useQuery<DestinationCardData>({
    queryKey: ["viator-destination-card", name],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("viator-search", {
        body: { location: name },
      });
      if (error) throw error;
      const results = (data?.results ?? []) as { thumbnailURL?: string | null }[];
      return {
        count: Number(data?.totalCount ?? results.length) || 0,
        image: results.find((r) => r.thumbnailURL)?.thumbnailURL ?? null,
      };
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

function DestinationCard({
  name,
  large,
  onSelect,
}: {
  name: string;
  large?: boolean;
  onSelect: (name: string) => void;
}) {
  const { data, isLoading } = useDestinationTours(name);
  // Honest cards only: skip destinations that returned nothing.
  if (!isLoading && (!data || data.count === 0 || !data.image)) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={`group relative w-full overflow-hidden rounded-2xl border border-[#E5DFC6] bg-[#F5F0E8] text-left shadow-sm transition-shadow hover:shadow-md ${
        large ? "aspect-[16/10]" : "aspect-[4/3]"
      }`}
      aria-label={`Browse tours in ${name}`}
    >
      {data?.image ? (
        <img
          src={data.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-[#E5DFC6]/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className={`font-secondary text-[#fdfaf2] ${large ? "text-2xl" : "text-lg"} leading-tight`}>
          {name}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#E5DFC6]">
          {isLoading ? "…" : `${data!.count.toLocaleString()} tours`}
        </p>
      </div>
    </button>
  );
}

export function TourDestinationBrowse({ onSelect }: { onSelect: (name: string) => void }) {
  const regionNames = Object.keys(REGIONS);
  const [activeRegion, setActiveRegion] = useState(regionNames[0]);

  return (
    <div className="mt-2">
      <h2 className="font-secondary text-[24px] text-[#0a2225]">Top destinations</h2>
      <p className="mb-4 text-sm text-[#6B7280]">
        Bookable tours and experiences from Goldsainte's partner network.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOP_DESTINATIONS.map((name) => (
          <DestinationCard key={name} name={name} large onSelect={onSelect} />
        ))}
      </div>

      <h2 className="mt-12 font-secondary text-[24px] text-[#0a2225]">Explore more destinations</h2>
      <p className="mb-4 text-sm text-[#6B7280]">Find things to do in cities around the world.</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {regionNames.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRegion(r)}
            className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
              activeRegion === r
                ? "border-[#0c4d47] bg-[#0c4d47] text-[#f7f3ea]"
                : "border-[#E5DFC6] bg-white text-[#0a2225] hover:bg-[#FDF9F0]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {REGIONS[activeRegion].map((name) => (
          <DestinationCard key={`${activeRegion}-${name}`} name={name} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
