// src/components/home/MarketplaceShowcase.tsx
import { Link } from "react-router-dom";

const FEATURED_TRIPS = [
  {
    id: "santorini-honeymoon",
    title: "Santorini cave-suite honeymoon",
    location: "Santorini, Greece",
    from: "$3,950 pp",
    image:
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg",
    tag: "Couples · Luxury · Europe",
  },
  {
    id: "kyoto-slow",
    title: "Slow Kyoto: temples, tea & ryokans",
    location: "Kyoto, Japan",
    from: "$2,600 pp",
    image:
      "https://images.pexels.com/photos/208773/pexels-photo-208773.jpeg",
    tag: "Culture · Asia",
  },
  {
    id: "amalfi-weekend",
    title: "Amalfi Coast long-weekend",
    location: "Positano, Italy",
    from: "$2,150 pp",
    image:
      "https://images.pexels.com/photos/161815/amalficoast-italy-sunrise-sun-161815.jpeg",
    tag: "Sun · Sea · Europe",
  },
  {
    id: "bali-villa",
    title: "Bali villa & private chef",
    location: "Uluwatu, Bali",
    from: "$1,950 pp",
    image:
      "https://images.pexels.com/photos/2581547/pexels-photo-2581547.jpeg",
    tag: "Wellness · Tropics",
  },
];

export function MarketplaceShowcase() {
  return (
    <section className="bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#0a2225] md:text-lg">
              A marketplace made for browsing
            </h2>
            <p className="mt-1 max-w-xl text-xs text-[#4a4a4a] md:text-sm">
              Scroll through trips like a Pinterest board—each one backed by a
              TikTok story and a certified agent ready to book every detail.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="mt-2 inline-flex items-center justify-center rounded-full border border-[#0c4d47]/30 px-4 py-2 text-[11px] font-semibold text-[#0c4d47] hover:bg-[#0c4d47]/5 md:mt-0"
          >
            View full marketplace
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_TRIPS.map((trip, index) => (
            <article
              key={trip.id}
              className={`group overflow-hidden rounded-3xl bg-[#f6f3ea] shadow-sm ring-1 ring-black/5 ${
                index === 0 ? "sm:row-span-2 sm:h-[340px]" : "h-[220px]"
              } flex flex-col`}
            >
              <div className="relative h-[60%] w-full overflow-hidden">
                <img
                  src={trip.image}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D8D8D]">
                    {trip.location}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#0a2225]">
                    {trip.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#4a4a4a]">
                    From <span className="font-semibold">{trip.from}</span>
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#4a4a4a]">
                  <span className="line-clamp-1">{trip.tag}</span>
                  <span className="text-[#0c4d47]">View trip →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
