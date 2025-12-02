import { Shield, FileText, AlertTriangle, MapPin, ExternalLink } from "lucide-react";

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

export function TripEssentialInfoLinks({ essentialInfo, destination }: TripEssentialInfoLinksProps) {
  const links = [
    {
      icon: Shield,
      label: "Travel Protection",
      href: essentialInfo?.travel_protection || "/travel-insurance",
    },
    {
      icon: FileText,
      label: "Visa Requirements",
      href: essentialInfo?.visa_requirements || `https://travel.state.gov/content/travel/en/international-travel.html`,
    },
    {
      icon: AlertTriangle,
      label: "Travel Alerts",
      href: essentialInfo?.travel_alerts || "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
    },
    {
      icon: MapPin,
      label: "Destination Guide",
      href: essentialInfo?.destination_guide || (destination ? `https://www.lonelyplanet.com/${destination.toLowerCase().replace(/\s+/g, '-')}` : "#"),
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
            <link.icon className="h-5 w-5 text-[#0C4D47]" />
            <span className="flex-1 text-sm font-medium text-[#0a2225]">{link.label}</span>
            <ExternalLink className="h-4 w-4 text-[#6B7280]" />
          </a>
        ))}
      </div>
    </section>
  );
}
