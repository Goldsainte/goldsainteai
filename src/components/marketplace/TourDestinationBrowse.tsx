import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Booking.com-structured destination browse for the Tours tab, in Goldsainte
// skin. Cover images are CURATED destination photography (not the first
// tour's photo — that gave us chauffeur signs and van pictures). If a curated
// image ever fails to load, the card gracefully falls back to the destination's
// top tour photo. Counts come live from Viator; the API caps at 200, so we
// show "200+" rather than pretend 200 is exact.

const TOP_DESTINATIONS = ["Paris", "London", "Rome", "New York", "Tokyo", "Dubai"];

const REGIONS: Record<string, string[]> = {
  Europe: ["London", "Paris", "Rome", "Barcelona", "Amsterdam", "Athens", "Lisbon", "Venice"],
  "North America": ["New York", "Las Vegas", "Miami", "Los Angeles", "San Francisco", "Chicago", "Toronto", "Vancouver"],
  Asia: ["Tokyo", "Kyoto", "Bangkok", "Singapore", "Bali", "Hong Kong", "Seoul", "Hanoi"],
  "Middle East & Africa": ["Dubai", "Istanbul", "Marrakech", "Cairo", "Cape Town", "Abu Dhabi", "Doha", "Nairobi"],
  "Latin America & Caribbean": ["Mexico City", "Cancun", "Rio de Janeiro", "Buenos Aires", "Lima", "Cartagena", "Nassau", "San Juan"],
  Oceania: ["Sydney", "Melbourne", "Queenstown", "Auckland", "Cairns", "Gold Coast", "Fiji", "Hobart"],
};

// Curated covers (Unsplash CDN, hotlink-friendly). Swap any URL freely —
// a broken one degrades to the destination's top tour photo, never a broken card.
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=72`;
const DESTINATION_IMAGES: Record<string, string> = {
  Paris: u("photo-1502602898657-3e91760cbb34"),
  London: u("photo-1513635269975-59663e0ac1ad"),
  Rome: u("photo-1552832230-c0197dd311b5"),
  "New York": u("photo-1496442226666-8d4d0e62e6e9"),
  Tokyo: u("photo-1540959733332-eab4deabeeaf"),
  Dubai: u("photo-1512453979798-5ea266f8880c"),
  Barcelona: u("photo-1583422409516-2895a77efded"),
  Amsterdam: u("photo-1534351590666-13e3e96b5017"),
  Athens: u("photo-1555993539-1732b0258235"),
  Lisbon: u("photo-1585208798174-6cedd86e019a"),
  Venice: u("photo-1514890547357-a9ee288728e0"),
  "Las Vegas": u("photo-1581351721010-8cf859cb14a4"),
  Miami: u("photo-1506966953602-c20cc11f75e3"),
  "Los Angeles": u("photo-1534190760961-74e8c1c5c3da"),
  "San Francisco": u("photo-1501594907352-04cda38ebc29"),
  Chicago: u("photo-1494522855154-9297ac14b55f"),
  Toronto: u("photo-1517090504586-fde19ea6066f"),
  Vancouver: u("photo-1559511260-66a654ae982a"),
  Kyoto: u("photo-1493976040374-85c8e12f0c0e"),
  Bangkok: u("photo-1508009603885-50cf7c579365"),
  Singapore: u("photo-1525625293386-3f8f99389edd"),
  Bali: u("photo-1537996194471-e657df975ab4"),
  "Hong Kong": u("photo-1536599018102-9f803c140fc1"),
  Seoul: u("photo-1517154421773-0529f29ea451"),
  Hanoi: u("photo-1509030450996-dd1a26dda07a"),
  Istanbul: u("photo-1541432901042-2d8bd64b4a9b"),
  Marrakech: u("photo-1597212618440-806262de4f6b"),
  Cairo: u("photo-1572252009286-268acec5ca0a"),
  "Cape Town": u("photo-1580060839134-75a5edca2e99"),
  "Abu Dhabi": u("photo-1512632578888-169bbbc64f33"),
  Doha: u("photo-1518684079-3c830dcef090"),
  Nairobi: u("photo-1611348586804-61bf6c080437"),
  "Mexico City": u("photo-1518105779142-d975f22f1b0a"),
  Cancun: u("photo-1510097467424-192d713fd8b2"),
  "Rio de Janeiro": u("photo-1483729558449-99ef09a8c325"),
  "Buenos Aires": u("photo-1589909202802-8f4aadce1849"),
  Lima: u("photo-1531968455001-5c5272a41129"),
  Cartagena: u("photo-1583997052103-b4a1cb974ce5"),
  Nassau: u("photo-1548574505-5e239809ee19"),
  "San Juan": u("photo-1579687196544-08ae57ab5c11"),
  Sydney: u("photo-1506973035872-a4ec16b8e8d9"),
  Melbourne: u("photo-1514395462725-fb4566210144"),
  Queenstown: u("photo-1589871973318-9ca1258faa5d"),
  Auckland: u("photo-1507699622108-4be3abd695ad"),
  Cairns: u("photo-1544551763-46a013bb70d5"),
  "Gold Coast": u("photo-1572454591674-2739f30d8c40"),
  Fiji: u("photo-1573843981267-be1999ff37cd"),
  Hobart: u("photo-1591081658714-f576fb7ea3ed"),
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
  const curated = DESTINATION_IMAGES[name] ?? null;
  const [curatedFailed, setCuratedFailed] = useState(false);
  const imgSrc = !curatedFailed && curated ? curated : data?.image ?? null;

  // Honest cards only: no inventory (or nothing to show) = no card.
  if (!isLoading && (!data || data.count === 0 || !imgSrc)) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={`group relative w-full overflow-hidden rounded-2xl border border-[#E5DFC6] bg-[#F5F0E8] text-left shadow-sm transition-shadow hover:shadow-md ${
        large ? "aspect-[16/10]" : "aspect-[4/3]"
      }`}
      aria-label={`Browse tours in ${name}`}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          onError={() => {
            if (!curatedFailed && curated) setCuratedFailed(true);
          }}
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
          {isLoading
            ? "…"
            : `${data!.count >= 200 ? "200+" : data!.count.toLocaleString()} tours`}
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
