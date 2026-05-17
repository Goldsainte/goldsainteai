import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import { FlagGlyph } from "@/components/help/FlagGlyph";

const REGIONS: { name: string; countries: string[] }[] = [
  {
    name: "Americas",
    countries: ["United States", "Canada", "Mexico", "Brazil"],
  },
  {
    name: "Europe",
    countries: [
      "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia",
      "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
      "Hungary", "Ireland", "Italy", "Latvia", "Liechtenstein", "Lithuania",
      "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", "Portugal",
      "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
      "United Kingdom",
    ],
  },
  {
    name: "Asia-Pacific",
    countries: [
      "Australia", "Hong Kong", "India", "Indonesia", "Japan", "Malaysia",
      "New Zealand", "Philippines", "Singapore", "Thailand",
    ],
  },
  {
    name: "Middle East / Africa",
    countries: ["South Africa", "United Arab Emirates"],
  },
];

export default function SupportedCountriesPage() {
  return (
    <main className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-[#0c4d47] hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <Globe className="h-6 w-6 text-[#0c4d47]" />
          <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium">Where we're available</p>
        </div>
        <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] mb-4">Supported countries</h1>
        <p className="text-base text-[#4A4A4A] mb-10 leading-relaxed">
          Travelers can book Goldsainte trips from anywhere in the world. Travel professionals and creators must be based in one of the 47 countries supported by Stripe Connect to receive payouts.
        </p>

        <div className="space-y-8">
          {REGIONS.map((region) => (
            <section key={region.name} className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
              <h2 className="font-secondary text-xl text-[#0a2225] mb-4">{region.name}</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm text-[#4A4A4A]">
                {region.countries.map((c) => (
                  <li key={c} className="flex items-center gap-3">
                    <FlagGlyph country={c} className="flex-shrink-0 opacity-80" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-xs text-[#6B7280] mt-8">
          Source: <a href="https://stripe.com/global" target="_blank" rel="noopener noreferrer" className="underline">stripe.com/global</a>. List may update as Stripe expands availability.
        </p>
      </div>
    </main>
  );
}