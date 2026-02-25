import { ExternalLink } from "lucide-react";
import { findLocationCoordinates } from "@/lib/locationMapping";

interface EssentialInfo {
  travel_protection?: string;
  visa_requirements?: string;
  travel_alerts?: string;
  destination_guide?: string;
}

interface TripEssentialInfoLinksProps {
  essentialInfo?: EssentialInfo;
  destination?: string;
}

// Mapping of country names to their URL slugs for State Dept and Lonely Planet
const COUNTRY_URL_MAPPING: Record<string, { stateDept: string; lonelyPlanet: string }> = {
  // Europe
  "france": { stateDept: "France", lonelyPlanet: "france" },
  "italy": { stateDept: "Italy", lonelyPlanet: "italy" },
  "spain": { stateDept: "Spain", lonelyPlanet: "spain" },
  "uk": { stateDept: "UnitedKingdom", lonelyPlanet: "england" },
  "united kingdom": { stateDept: "UnitedKingdom", lonelyPlanet: "england" },
  "england": { stateDept: "UnitedKingdom", lonelyPlanet: "england" },
  "germany": { stateDept: "Germany", lonelyPlanet: "germany" },
  "portugal": { stateDept: "Portugal", lonelyPlanet: "portugal" },
  "greece": { stateDept: "Greece", lonelyPlanet: "greece" },
  "netherlands": { stateDept: "Netherlands", lonelyPlanet: "the-netherlands" },
  "switzerland": { stateDept: "Switzerland", lonelyPlanet: "switzerland" },
  "austria": { stateDept: "Austria", lonelyPlanet: "austria" },
  "croatia": { stateDept: "Croatia", lonelyPlanet: "croatia" },
  "czech republic": { stateDept: "CzechRepublic", lonelyPlanet: "czech-republic" },
  "iceland": { stateDept: "Iceland", lonelyPlanet: "iceland" },
  "ireland": { stateDept: "Ireland", lonelyPlanet: "ireland" },
  "norway": { stateDept: "Norway", lonelyPlanet: "norway" },
  "sweden": { stateDept: "Sweden", lonelyPlanet: "sweden" },
  "denmark": { stateDept: "Denmark", lonelyPlanet: "denmark" },
  "poland": { stateDept: "Poland", lonelyPlanet: "poland" },
  "hungary": { stateDept: "Hungary", lonelyPlanet: "hungary" },
  "belgium": { stateDept: "Belgium", lonelyPlanet: "belgium" },
  "turkey": { stateDept: "Turkey", lonelyPlanet: "turkey" },
  
  // Asia
  "japan": { stateDept: "Japan", lonelyPlanet: "japan" },
  "thailand": { stateDept: "Thailand", lonelyPlanet: "thailand" },
  "indonesia": { stateDept: "Indonesia", lonelyPlanet: "indonesia" },
  "bali": { stateDept: "Indonesia", lonelyPlanet: "indonesia/bali" },
  "vietnam": { stateDept: "Vietnam", lonelyPlanet: "vietnam" },
  "singapore": { stateDept: "Singapore", lonelyPlanet: "singapore" },
  "malaysia": { stateDept: "Malaysia", lonelyPlanet: "malaysia" },
  "philippines": { stateDept: "Philippines", lonelyPlanet: "philippines" },
  "south korea": { stateDept: "SouthKorea", lonelyPlanet: "south-korea" },
  "korea": { stateDept: "SouthKorea", lonelyPlanet: "south-korea" },
  "china": { stateDept: "China", lonelyPlanet: "china" },
  "india": { stateDept: "India", lonelyPlanet: "india" },
  "maldives": { stateDept: "Maldives", lonelyPlanet: "maldives" },
  "sri lanka": { stateDept: "SriLanka", lonelyPlanet: "sri-lanka" },
  "nepal": { stateDept: "Nepal", lonelyPlanet: "nepal" },
  "cambodia": { stateDept: "Cambodia", lonelyPlanet: "cambodia" },
  "laos": { stateDept: "Laos", lonelyPlanet: "laos" },
  "myanmar": { stateDept: "Burma", lonelyPlanet: "myanmar-burma" },
  
  // Africa
  "south africa": { stateDept: "SouthAfrica", lonelyPlanet: "south-africa" },
  "morocco": { stateDept: "Morocco", lonelyPlanet: "morocco" },
  "egypt": { stateDept: "Egypt", lonelyPlanet: "egypt" },
  "kenya": { stateDept: "Kenya", lonelyPlanet: "kenya" },
  "tanzania": { stateDept: "Tanzania", lonelyPlanet: "tanzania" },
  "namibia": { stateDept: "Namibia", lonelyPlanet: "namibia" },
  "botswana": { stateDept: "Botswana", lonelyPlanet: "botswana" },
  "rwanda": { stateDept: "Rwanda", lonelyPlanet: "rwanda" },
  "mauritius": { stateDept: "Mauritius", lonelyPlanet: "mauritius" },
  "seychelles": { stateDept: "Seychelles", lonelyPlanet: "seychelles" },
  "tunisia": { stateDept: "Tunisia", lonelyPlanet: "tunisia" },
  "ethiopia": { stateDept: "Ethiopia", lonelyPlanet: "ethiopia" },
  "ghana": { stateDept: "Ghana", lonelyPlanet: "ghana" },
  "senegal": { stateDept: "Senegal", lonelyPlanet: "senegal" },
  
  // Americas
  "mexico": { stateDept: "Mexico", lonelyPlanet: "mexico" },
  "brazil": { stateDept: "Brazil", lonelyPlanet: "brazil" },
  "argentina": { stateDept: "Argentina", lonelyPlanet: "argentina" },
  "peru": { stateDept: "Peru", lonelyPlanet: "peru" },
  "colombia": { stateDept: "Colombia", lonelyPlanet: "colombia" },
  "chile": { stateDept: "Chile", lonelyPlanet: "chile" },
  "costa rica": { stateDept: "CostaRica", lonelyPlanet: "costa-rica" },
  "cuba": { stateDept: "Cuba", lonelyPlanet: "cuba" },
  "jamaica": { stateDept: "Jamaica", lonelyPlanet: "jamaica" },
  "bahamas": { stateDept: "Bahamas", lonelyPlanet: "the-bahamas" },
  "dominican republic": { stateDept: "DominicanRepublic", lonelyPlanet: "dominican-republic" },
  "puerto rico": { stateDept: "PuertoRico", lonelyPlanet: "puerto-rico" },
  "canada": { stateDept: "Canada", lonelyPlanet: "canada" },
  "ecuador": { stateDept: "Ecuador", lonelyPlanet: "ecuador" },
  "bolivia": { stateDept: "Bolivia", lonelyPlanet: "bolivia" },
  "uruguay": { stateDept: "Uruguay", lonelyPlanet: "uruguay" },
  "panama": { stateDept: "Panama", lonelyPlanet: "panama" },
  "guatemala": { stateDept: "Guatemala", lonelyPlanet: "guatemala" },
  "belize": { stateDept: "Belize", lonelyPlanet: "belize" },
  
  // Middle East
  "uae": { stateDept: "UnitedArabEmirates", lonelyPlanet: "united-arab-emirates" },
  "united arab emirates": { stateDept: "UnitedArabEmirates", lonelyPlanet: "united-arab-emirates" },
  "dubai": { stateDept: "UnitedArabEmirates", lonelyPlanet: "united-arab-emirates/dubai" },
  "israel": { stateDept: "Israel", lonelyPlanet: "israel" },
  "jordan": { stateDept: "Jordan", lonelyPlanet: "jordan" },
  "qatar": { stateDept: "Qatar", lonelyPlanet: "qatar" },
  "oman": { stateDept: "Oman", lonelyPlanet: "oman" },
  "saudi arabia": { stateDept: "SaudiArabia", lonelyPlanet: "saudi-arabia" },
  
  // Oceania
  "australia": { stateDept: "Australia", lonelyPlanet: "australia" },
  "new zealand": { stateDept: "NewZealand", lonelyPlanet: "new-zealand" },
  "fiji": { stateDept: "Fiji", lonelyPlanet: "fiji" },
  "tahiti": { stateDept: "FrenchPolynesia", lonelyPlanet: "tahiti" },
  "french polynesia": { stateDept: "FrenchPolynesia", lonelyPlanet: "french-polynesia" },
};

function getCountryFromDestination(destination?: string): string | null {
  if (!destination) return null;
  const lowerDest = destination.toLowerCase().trim();
  if (COUNTRY_URL_MAPPING[lowerDest]) return lowerDest;
  for (const country of Object.keys(COUNTRY_URL_MAPPING)) {
    if (lowerDest.includes(country)) return country;
  }
  const coords = findLocationCoordinates(destination);
  if (coords?.country) {
    const countryLower = coords.country.toLowerCase();
    if (COUNTRY_URL_MAPPING[countryLower]) return countryLower;
  }
  return null;
}

function getTravelAlertsUrl(destination?: string): string {
  const country = getCountryFromDestination(destination);
  if (country && COUNTRY_URL_MAPPING[country]) {
    return `https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/${COUNTRY_URL_MAPPING[country].stateDept}.html`;
  }
  return "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html";
}

function getDestinationGuideUrl(destination?: string): string {
  const country = getCountryFromDestination(destination);
  if (country && COUNTRY_URL_MAPPING[country]) {
    return `https://www.lonelyplanet.com/${COUNTRY_URL_MAPPING[country].lonelyPlanet}`;
  }
  if (destination) {
    return `https://www.lonelyplanet.com/${destination.toLowerCase().replace(/[,\\s]+/g, '-').replace(/-+/g, '-')}`;
  }
  return "https://www.lonelyplanet.com/";
}

export function TripEssentialInfoLinks({ essentialInfo, destination }: TripEssentialInfoLinksProps) {
  const links = [
    {
      label: "Travel Protection",
      href: essentialInfo?.travel_protection || "https://www.allianztravelinsurance.com/",
    },
    {
      label: "Visa Requirements",
      href: essentialInfo?.visa_requirements || "https://www.usa.gov/visas-citizens-traveling-abroad",
    },
    {
      label: "Travel Alerts",
      href: essentialInfo?.travel_alerts || getTravelAlertsUrl(destination),
    },
    {
      label: "Destination Guide",
      href: essentialInfo?.destination_guide || getDestinationGuideUrl(destination),
    },
  ];

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Essential Travel Information
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-4 transition hover:border-[#C7B892] hover:bg-[#C7B892]/10"
          >
            <span className="flex-1 text-sm font-medium text-[#0a2225]">{link.label}</span>
            <ExternalLink className="h-4 w-4 text-[#6B7280]" />
          </a>
        ))}
      </div>
    </section>
  );
}
