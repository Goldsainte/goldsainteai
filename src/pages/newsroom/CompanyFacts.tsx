import { Helmet } from "react-helmet-async";
import { BASE_URL } from "./lib";
import {
  NewsroomPageHeader,
  newsroomPageSectionClass,
  newsroomPageShellClass,
  newsroomSectionTitleClass,
} from "./ui";

const FACTS: { label: string; value: string }[] = [
  { label: "Headquarters", value: "Charlotte, North Carolina, USA" },
  { label: "Founder & CEO", value: "Andre C. Powell, Jr." },
  { label: "Founded", value: "2022" },
  { label: "Category", value: "Artificial Intelligence • Travel Technology • Marketplace Platform" },
  { label: "Mission", value: "To redefine how modern travelers plan and book travel by combining intelligent technology, creator-driven discovery, and expert human curation into one seamless platform experience." },
  { label: "Markets Served", value: "United States with expanding global marketplace participation across destinations throughout North America, Europe, Asia, the Caribbean, the Middle East, and Africa." },
  { label: "User Types", value: "Travelers, Travel Creators, Independent Travel Advisors, Hospitality & Experience Partners" },
  { label: "Investment Status", value: "Privately held" },
  { label: "General Contact", value: "info@goldsainte.com" },
  { label: "Press Contact", value: "info@goldsainte.com" },
];

const CORE_PRODUCTS = [
  "AI-generated itineraries",
  "Creator-curated travel guides",
  "Custom trip proposals",
  "Marketplace travel packages",
  "Collaborative travel storyboards",
  "Luxury and experiential travel planning",
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
          foundingDate: "2022",
          foundingLocation: "Charlotte, NC, USA",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Charlotte",
            addressRegion: "NC",
            addressCountry: "US",
          },
          email: "info@goldsainte.com",
        })}</script>
      </Helmet>
      <div className={`${newsroomPageShellClass} space-y-12 md:space-y-24`}>
        {/* Hero */}
        <section>
          <NewsroomPageHeader
            eyebrow="Company Facts"
            title="Goldsainte is building the intelligent marketplace for modern travel."
            intro={
              <p>
                Goldsainte is an AI-powered global travel marketplace that enables travelers to discover, create,
                customize, and book curated travel experiences through a network of vetted travel creators, independent
                travel advisors, and hospitality partners.
              </p>
            }
          />
        </section>

        {/* Overview */}
        <section className={`grid md:grid-cols-[260px_1fr] gap-8 md:gap-16 ${newsroomPageSectionClass}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">Overview</p>
            <h2 className={newsroomSectionTitleClass}>
              A connected ecosystem for inspiration, planning, and booking.
            </h2>
          </div>
          <div className="space-y-5 text-[#0a2225]/80 leading-relaxed text-base">
            <p>
              The platform combines artificial intelligence with human expertise to simplify the fragmented travel
              planning process — from inspiration and itinerary design to booking and trip coordination — within a
              single connected ecosystem.
            </p>
            <p>
              Goldsainte operates a multi-sided travel marketplace connecting travelers, travel creators, and
              independent travel professionals through AI-powered itinerary creation, collaborative trip planning
              tools, and proposal-based booking experiences.
            </p>
          </div>
        </section>

        {/* Facts table */}
        <section className={newsroomPageSectionClass}>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.3em] text-[#0c4d47] mb-6 sm:mb-8">At a glance</p>
          <dl className="divide-y divide-[#E5DFC6] border-y border-[#E5DFC6]">
            {FACTS.map((f) => (
              <div key={f.label} className="grid md:grid-cols-[220px_1fr] gap-4 py-6">
                <dt className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[#0a2225]/55 pt-1">{f.label}</dt>
                <dd className="text-[#0a2225] leading-relaxed">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Core Products */}
        <section className={`grid md:grid-cols-[260px_1fr] gap-8 md:gap-16 ${newsroomPageSectionClass}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">Core Products</p>
            <h2 className={newsroomSectionTitleClass}>
              What we build.
            </h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8">
            {CORE_PRODUCTS.map((product) => (
              <li
                key={product}
                className="py-4 border-b border-[#E5DFC6] text-[#0a2225] flex items-start gap-3"
              >
                <span className="text-[#C7A962] mt-2 text-[8px]">●</span>
                <span>{product}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Company History */}
        <section className={`grid md:grid-cols-[260px_1fr] gap-8 md:gap-16 ${newsroomPageSectionClass}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-3">Company History</p>
            <h2 className={newsroomSectionTitleClass}>
              From luxury transportation to a next-generation travel marketplace.
            </h2>
          </div>
          <div className="text-[#0a2225]/80 leading-relaxed">
            <p>
              Goldsainte was originally launched as a luxury transportation platform before evolving into a
              next-generation AI travel marketplace focused on modernizing the travel planning and booking experience
              for consumers globally.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}