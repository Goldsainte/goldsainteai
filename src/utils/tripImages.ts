// Curated destination images for consistent luxury aesthetic
const DESTINATION_IMAGES: Record<string, string> = {
  // Europe
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
  london: "https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?auto=format&fit=crop&w=1600&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1600&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80",
  venice: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1600&q=80",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1600&q=80",
  athens: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=80",
  munich: "https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=1600&q=80",
  zurich: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=1600&q=80",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
  dublin: "https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=1600&q=80",
  edinburgh: "https://images.unsplash.com/photo-1506377585622-bedcbb5f30c4?auto=format&fit=crop&w=1600&q=80",
  florence: "https://images.unsplash.com/photo-1543429258-14ba520cdee8?auto=format&fit=crop&w=1600&q=80",
  monaco: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1600&q=80",
  mykonos: "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=1600&q=80",
  "amalfi coast": "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=80",
  amalfi: "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=80",
  iceland: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1600&q=80",
  croatia: "https://images.unsplash.com/photo-1555990538-1a8d4a0dbca8?auto=format&fit=crop&w=1600&q=80",
  dubrovnik: "https://images.unsplash.com/photo-1555990538-1a8d4a0dbca8?auto=format&fit=crop&w=1600&q=80",
  copenhagen: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  stockholm: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=80",
  madrid: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=80",
  milan: "https://images.unsplash.com/photo-1520440229-6469d149a66b?auto=format&fit=crop&w=1600&q=80",
  switzerland: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80",

  // Asia
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  thailand: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1600&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
  "hong kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1600&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
  vietnam: "https://images.unsplash.com/photo-1528127269322-539152af5929?auto=format&fit=crop&w=1600&q=80",
  seoul: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1600&q=80",
  "sri lanka": "https://images.unsplash.com/photo-1586613835341-c5eb70540b42?auto=format&fit=crop&w=1600&q=80",
  india: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80",
  maldives: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  phuket: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80",

  // Americas
  "new york": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
  "los angeles": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1600&q=80",
  miami: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?auto=format&fit=crop&w=1600&q=80",
  "mexico city": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1600&q=80",
  cancun: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=1600&q=80",
  mexico: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=80",
  "tulum": "https://images.unsplash.com/photo-1682553064441-09f667e13a53?auto=format&fit=crop&w=1600&q=80",
  hawaii: "https://images.unsplash.com/photo-1507876466758-bc54f384809c?auto=format&fit=crop&w=1600&q=80",
  "san francisco": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80",
  "rio de janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80",
  "buenos aires": "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=1600&q=80",
  colombia: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=80",
  cartagena: "https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1600&q=80",
  "costa rica": "https://images.unsplash.com/photo-1519483816200-2a1acc0bf1ff?auto=format&fit=crop&w=1600&q=80",
  peru: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=80",
  "machu picchu": "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=80",
  vegas: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1600&q=80",
  "las vegas": "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1600&q=80",
  canada: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=80",

  // Africa & Middle East
  morocco: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80",
  marrakech: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80",
  "cape town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80",
  "south africa": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80",
  egypt: "https://images.unsplash.com/photo-1539768942893-daf53e736b68?auto=format&fit=crop&w=1600&q=80",
  cairo: "https://images.unsplash.com/photo-1539768942893-daf53e736b68?auto=format&fit=crop&w=1600&q=80",
  kenya: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80",
  tanzania: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80",
  zanzibar: "https://images.unsplash.com/photo-1586861203927-800a5acdcc4d?auto=format&fit=crop&w=1600&q=80",

  // Oceania
  australia: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
  "new zealand": "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=1600&q=80",
  fiji: "https://images.unsplash.com/photo-1584811644165-33078f5e8724?auto=format&fit=crop&w=1600&q=80",

  // Caribbean
  bahamas: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1600&q=80",
  jamaica: "https://images.unsplash.com/photo-1580223530509-849e0ad1a563?auto=format&fit=crop&w=1600&q=80",
  "st. lucia": "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=1600&q=80",
  "saint lucia": "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=1600&q=80",
  "turks and caicos": "https://images.unsplash.com/photo-1580548517828-74eb29752a64?auto=format&fit=crop&w=1600&q=80",
  caribbean: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1600&q=80",
  aruba: "https://images.unsplash.com/photo-1580548517828-74eb29752a64?auto=format&fit=crop&w=1600&q=80",

  // Islands & Resorts
  seychelles: "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=1600&q=80",
  mauritius: "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=1600&q=80",
  "bora bora": "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=1600&q=80",
  tahiti: "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=1600&q=80",
  tulum: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  cancun: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  mexico: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  jamaica: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  caribbean: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  bahamas: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
};

// Curated luxury travel fallbacks for unmatched destinations
const FALLBACK_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80", // travel map
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // tropical beach
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80", // mountain vista
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80", // lake & mountains
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1600&q=80", // coastal town
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80", // scenic landscape
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80", // misty mountains
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80", // sunset ocean
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80", // desert dunes
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80", // waterfall
];

/** Simple string hash for consistent fallback rotation */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get a consistent hero image URL for a trip request.
 */
export const getTripRequestImageUrl = (
  destination?: string | null,
  override?: string | null
): string => {
  if (override) return override;

  if (!destination) {
    return FALLBACK_TRAVEL_IMAGES[0];
  }

  const key = destination.toLowerCase().trim();

  // Try curated matches first
  for (const city in DESTINATION_IMAGES) {
    if (key.includes(city)) {
      return DESTINATION_IMAGES[city];
    }
  }

  // Consistent travel-relevant fallback based on destination hash
  const index = hashCode(key) % FALLBACK_TRAVEL_IMAGES.length;
  return FALLBACK_TRAVEL_IMAGES[index];
};
