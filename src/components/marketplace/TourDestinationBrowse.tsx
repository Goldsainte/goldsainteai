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
  Europe: ["London", "Paris", "Rome", "Barcelona", "Amsterdam", "Athens", "Lisbon", "Venice", "Florence", "Milan", "Madrid", "Seville", "Edinburgh", "Dublin", "Berlin", "Munich", "Vienna", "Prague", "Budapest", "Porto", "Santorini", "Mykonos", "Dubrovnik", "Split", "Zurich", "Interlaken", "Reykjavik", "Krakow", "Nice", "Naples"],
  "North America": ["New York", "Las Vegas", "Miami", "Los Angeles", "San Francisco", "Chicago", "Orlando", "New Orleans", "Washington DC", "Boston", "Honolulu", "Seattle", "San Diego", "Nashville", "Toronto", "Vancouver", "Montreal", "Quebec City", "Banff"],
  Asia: ["Tokyo", "Kyoto", "Osaka", "Bangkok", "Phuket", "Chiang Mai", "Singapore", "Bali", "Hanoi", "Ho Chi Minh City", "Hong Kong", "Seoul", "Delhi", "Mumbai", "Jaipur", "Agra", "Kuala Lumpur", "Manila", "Cebu", "Beijing", "Shanghai", "Taipei", "Siem Reap", "Male"],
  "Middle East & Africa": ["Dubai", "Abu Dhabi", "Istanbul", "Cappadocia", "Antalya", "Marrakech", "Casablanca", "Fes", "Cairo", "Luxor", "Hurghada", "Sharm El Sheikh", "Cape Town", "Johannesburg", "Doha", "Amman", "Petra", "Jerusalem", "Tel Aviv", "Nairobi", "Zanzibar", "Riyadh", "Jeddah", "Muscat"],
  "Latin America & Caribbean": ["Mexico City", "Cancun", "Tulum", "Playa del Carmen", "Cabo San Lucas", "Puerto Vallarta", "Rio de Janeiro", "Sao Paulo", "Buenos Aires", "Mendoza", "Lima", "Cusco", "Cartagena", "Medellin", "Bogota", "Santiago", "San Jose", "Quito", "Nassau", "San Juan", "Punta Cana", "Montego Bay", "Oranjestad", "Panama City", "Antigua Guatemala"],
  Oceania: ["Sydney", "Melbourne", "Cairns", "Gold Coast", "Brisbane", "Perth", "Adelaide", "Hobart", "Queenstown", "Auckland", "Rotorua", "Christchurch", "Wellington", "Nadi", "Bora Bora", "Papeete"],
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
  Edinburgh: u("photo-1506377585622-bedcbb027afc"),
  Manchester: u("photo-1515586838455-8f8f940d6853"),
  Nice: u("photo-1491166617655-0723a0999cfc"),
  Lyon: u("photo-1524396309943-e03f5249f002"),
  Florence: u("photo-1541370976299-4d24ebbc9077"),
  Milan: u("photo-1520440229-6469a149ac59"),
  Naples: u("photo-1516483638261-f4dbaf036963"),
  Madrid: u("photo-1539037116277-4db20889f2d4"),
  Seville: u("photo-1559682468-a6a29e7d9517"),
  Porto: u("photo-1555881400-74d7acaacd8b"),
  Santorini: u("photo-1613395877344-13d4a8e0d49e"),
  Mykonos: u("photo-1601581875039-e899893d520c"),
  Berlin: u("photo-1560969184-10fe8719e047"),
  Munich: u("photo-1595867818082-083862f3d630"),
  Vienna: u("photo-1516550893923-42d28e5677af"),
  Prague: u("photo-1541849546-216549ae216d"),
  Budapest: u("photo-1551867633-194f125bddfa"),
  Dublin: u("photo-1549918864-48ac978761a4"),
  Dubrovnik: u("photo-1555990538-1e6c0f0f2f14"),
  Split: u("photo-1555990538-32b1a1262260"),
  Zurich: u("photo-1515488764276-beab7607c1e6"),
  Interlaken: u("photo-1527668752968-14dc70a27c95"),
  Reykjavik: u("photo-1504829857797-ddff29c27927"),
  Krakow: u("photo-1562692447-5cd07e5f232a"),
  Orlando: u("photo-1597466599360-3b9775841aec"),
  "New Orleans": u("photo-1571893544028-06b07af6dade"),
  "Washington DC": u("photo-1501466044931-62695aada8e9"),
  Boston: u("photo-1501979376754-2ff867a4f659"),
  Honolulu: u("photo-1507876466758-bc54f384809c"),
  Seattle: u("photo-1502175353174-a7a70e73b362"),
  "San Diego": u("photo-1519659528534-7fd733a832a0"),
  Nashville: u("photo-1545419913-775e3e82c7db"),
  Montreal: u("photo-1519178614-68673b201f36"),
  "Quebec City": u("photo-1519832979-6fa011b87667"),
  Banff: u("photo-1561134643-668f9057cce4"),
  Osaka: u("photo-1590559899731-a382839e5549"),
  Phuket: u("photo-1589394815804-964ed0be2eb5"),
  "Chiang Mai": u("photo-1512553353614-82a7370096dc"),
  "Ho Chi Minh City": u("photo-1583417319070-4a69db38a482"),
  Delhi: u("photo-1587474260584-136574528ed5"),
  Mumbai: u("photo-1570168007204-dfb528c6958f"),
  Jaipur: u("photo-1477587458883-47145ed94245"),
  Agra: u("photo-1564507592333-c60657eea523"),
  "Kuala Lumpur": u("photo-1596422846543-75c6fc197f07"),
  Beijing: u("photo-1508804185872-d7badad00f7d"),
  Shanghai: u("photo-1474181487882-5abf3f0ba6c2"),
  Taipei: u("photo-1470004914212-05527e49370b"),
  "Siem Reap": u("photo-1552465011-b4e21bf6e79a"),
  Cappadocia: u("photo-1570939274717-7eda259b50ed"),
  Antalya: u("photo-1593238738928-e0d4b62b730f"),
  Casablanca: u("photo-1577147443647-81856d5151af"),
  Luxor: u("photo-1587975844610-957b1e5d4b48"),
  Petra: u("photo-1563177978-4c5ffc081b25"),
  Jerusalem: u("photo-1544734037-e4ec2e35e5eb"),
  "Tel Aviv": u("photo-1544971587-b842c27f8e14"),
  Zanzibar: u("photo-1586861635167-e5223aadc9fe"),
  Tulum: u("photo-1504730655501-24c39e5d1152"),
  Cusco: u("photo-1526392060635-9d6019884377"),
  Medellin: u("photo-1599999905374-b3e63e58f89b"),
  Bogota: u("photo-1568632234157-ce7aecd03d0d"),
  Santiago: u("photo-1478827387698-1527781a4887"),
  "Punta Cana": u("photo-1505881502353-a1986add3762"),
  "Montego Bay": u("photo-1547149600-a6cdf8fce60c"),
  Brisbane: u("photo-1566734904496-9309bb1798b3"),
  Perth: u("photo-1573935448851-4b07c29ee181"),
  "Bora Bora": u("photo-1589197331516-4d84b72ebde3"),
};

interface DestinationCardData {
  count: number;
  image: string | null;
}

function useDestinationTours(name: string, enabled = true) {
  return useQuery<DestinationCardData>({
    enabled,
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
        large ? "aspect-[3/2]" : "aspect-[3/2]"
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

function GridCityCard({ name, onSelect }: { name: string; onSelect: (name: string) => void }) {
  const curated = DESTINATION_IMAGES[name] ?? null;
  const [curatedFailed, setCuratedFailed] = useState(false);
  // Fetch a Viator photo ONLY when there is no working curated cover — keeps
  // API usage bounded while giving (nearly) every card a real photograph.
  const needViator = !curated || curatedFailed;
  const { data } = useDestinationTours(name, needViator);
  const imgSrc = curated && !curatedFailed ? curated : data?.image ?? null;
  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className="group relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-[#E5DFC6] text-left shadow-sm transition-shadow hover:shadow-md"
      aria-label={`Browse tours in ${name}`}
    >
      {imgSrc ? (
        <>
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            onError={() => { if (curated && !curatedFailed) setCuratedFailed(true); }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/80 via-[#0a2225]/10 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4d47] to-[#0a2225]" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-secondary text-[17px] leading-tight text-[#fdfaf2]">{name}</p>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {REGIONS[activeRegion].map((name) => (
          <GridCityCard key={`${activeRegion}-${name}`} name={name} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
