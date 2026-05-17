import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";

const REGIONS: { name: string; countries: [string, string][] }[] = [
  {
    name: "Americas",
    countries: [["United States", "US"], ["Canada", "CA"], ["Mexico", "MX"], ["Brazil", "BR"]],
  },
  {
    name: "Europe",
    countries: [
      ["Austria","AT"],["Belgium","BE"],["Bulgaria","BG"],["Croatia","HR"],["Cyprus","CY"],["Czechia","CZ"],
      ["Denmark","DK"],["Estonia","EE"],["Finland","FI"],["France","FR"],["Germany","DE"],["Greece","GR"],
      ["Hungary","HU"],["Ireland","IE"],["Italy","IT"],["Latvia","LV"],["Liechtenstein","LI"],["Lithuania","LT"],
      ["Luxembourg","LU"],["Malta","MT"],["Netherlands","NL"],["Norway","NO"],["Poland","PL"],["Portugal","PT"],
      ["Romania","RO"],["Slovakia","SK"],["Slovenia","SI"],["Spain","ES"],["Sweden","SE"],["Switzerland","CH"],
      ["United Kingdom","GB"],
    ],
  },
  {
    name: "Asia-Pacific",
    countries: [
      ["Australia","AU"],["Hong Kong","HK"],["India","IN"],["Indonesia","ID"],["Japan","JP"],["Malaysia","MY"],
      ["New Zealand","NZ"],["Philippines","PH"],["Singapore","SG"],["Thailand","TH"],
    ],
  },
  {
    name: "Middle East / Africa",
    countries: [["South Africa","ZA"], ["United Arab Emirates","AE"]],
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
                {region.countries.map(([name, code]) => (
                  <li key={name} className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] tracking-[0.15em] text-[#C7A962] w-6 flex-shrink-0">{code}</span>
                    <span>{name}</span>
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