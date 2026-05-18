import { Helmet } from "react-helmet-async";
import { BASE_URL } from "./lib";

const FACTS: { label: string; value: string }[] = [
  { label: "Founded", value: "2024" },
  { label: "Headquarters", value: "Charlotte, North Carolina, USA" },
  { label: "Founder & CEO", value: "Andre Saint" },
  { label: "Category", value: "AI-powered travel marketplace" },
  { label: "Mission", value: "To connect every traveler with a vetted human expert who designs unforgettable, transparent, on-platform journeys." },
  { label: "Markets Served", value: "United States, with global trip sourcing through vetted creators and agents" },
  { label: "User Types", value: "Travelers, Travel Creators, Independent Travel Agents" },
  { label: "Investment", value: "Privately held" },
  { label: "General Contact", value: "hello@goldsainte.com" },
  { label: "Press Contact", value: "press@goldsainte.com" },
];

export default function CompanyFacts() {
  return (
    <>
      <Helmet>
        <title>Company Facts | Goldsainte Newsroom</title>
        <meta name="description" content="Goldsainte at a glance: founding details, headquarters, leadership, mission, and markets served." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/company-facts`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Goldsainte",
          url: BASE_URL,
          logo: `${BASE_URL}/brand/goldsainte-logo-512.png`,
          foundingDate: "2024",
          foundingLocation: "Charlotte, NC, USA",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Charlotte",
            addressRegion: "NC",
            addressCountry: "US",
          },
          email: "press@goldsainte.com",
        })}</script>
      </Helmet>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-secondary text-5xl mb-4">Goldsainte at a glance</h1>
        <p className="text-[#0a2225]/70 mb-12 max-w-2xl">
          Core facts, figures, and contact information for reporters and analysts.
        </p>
        <dl className="divide-y divide-[#E5DFC6] border-y border-[#E5DFC6]">
          {FACTS.map((f) => (
            <div key={f.label} className="grid md:grid-cols-[200px_1fr] gap-4 py-5">
              <dt className="text-xs uppercase tracking-wider text-[#0a2225]/60 pt-1">{f.label}</dt>
              <dd className="text-[#0a2225] leading-relaxed">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}