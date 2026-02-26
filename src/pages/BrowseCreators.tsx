import { useState } from "react";
import { Link } from "react-router-dom";

type Creator = {
  id: string;
  name: string;
  tiktokHandle: string;
  avatarUrl?: string;
  niches: string[];
  audienceSize: string;
  avgViews: string;
  primaryRegion: string;
  partnershipType: string;
  featuredTrips: Array<{
    id: string;
    title: string;
    price: string;
  }>;
};

const MOCK_CREATORS: Creator[] = [
  {
    id: "creator-1",
    name: "Travel with Maya",
    tiktokHandle: "@travelwithmaya",
    avatarUrl:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    niches: ["Couples", "Luxury Europe"],
    audienceSize: "210K followers",
    avgViews: "45K avg views",
    primaryRegion: "US → Europe",
    partnershipType: "Revenue share per booking",
    featuredTrips: [
      { id: "trip-1", title: "Santorini Honeymoon Escape", price: "$3,950" },
      { id: "trip-2", title: "Amalfi Coast Romance", price: "$4,200" },
    ],
  },
  {
    id: "creator-2",
    name: "Backpack Ben",
    tiktokHandle: "@backpackben",
    avatarUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
    niches: ["Backpacking", "Budget Asia"],
    audienceSize: "95K followers",
    avgViews: "18K avg views",
    primaryRegion: "US → SE Asia",
    partnershipType: "Flat fee + bonuses",
    featuredTrips: [
      { id: "trip-3", title: "Thailand Island Hopping", price: "$1,200" },
      { id: "trip-4", title: "Vietnam Street Food Tour", price: "$890" },
    ],
  },
];

export default function BrowseCreators() {
  const [query, setQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const filtered = MOCK_CREATORS.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.tiktokHandle.toLowerCase().includes(q) ||
      c.niches.some((n) => n.toLowerCase().includes(q));

    const matchesNiche =
      nicheFilter === "all" ||
      c.niches.some((n) => n.toLowerCase().includes(nicheFilter));
    const matchesRegion =
      regionFilter === "all" ||
      c.primaryRegion.toLowerCase().includes(regionFilter);

    return matchesQuery && matchesNiche && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Creator Marketplace
            </h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              Discover TikTok travel creators and partner with them to sell
              trips through Goldsainte.
            </p>
          </div>
          <Link
            to="/storyboards"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
          >
            Go to Goldsainte Creator Lab
          </Link>
        </header>

        {/* Filters */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="text-xs font-medium text-neutral-700">
                Search creators
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, TikTok handle, or niche"
                className="mt-1 w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-2 text-xs md:flex-row md:items-end">
              <div>
                <label className="font-medium text-neutral-700">Niche</label>
                <select
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="mt-1 w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="luxury">Luxury</option>
                  <option value="couples">Couples</option>
                  <option value="adventure">Adventure</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-neutral-700">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="mt-1 w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="europe">Europe</option>
                  <option value="asia">Asia</option>
                  <option value="caribbean">Caribbean</option>
                  <option value="us">US & Canada</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Creator cards */}
        <section className="grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white p-4 text-sm text-neutral-500">
              No creators match your filters yet. Try widening your search.
            </div>
          ) : (
            filtered.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <article className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-200">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-500">
              {creator.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              {creator.name}
            </h2>
            <p className="text-xs text-neutral-500">
              {creator.tiktokHandle}
            </p>
          </div>
          <div className="text-right text-[11px] text-neutral-500">
            <div>{creator.audienceSize}</div>
            <div>{creator.avgViews}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {creator.niches.map((niche) => (
            <span
              key={niche}
              className="rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-700 ring-1 ring-neutral-200"
            >
              {niche}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{creator.primaryRegion}</span>
          <span>{creator.partnershipType}</span>
        </div>

        {/* Featured Trips */}
        {creator.featuredTrips.length > 0 && (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="text-[10px] font-medium text-neutral-500 mb-2">
              Featured Trips
            </p>
            <div className="flex flex-col gap-1.5">
              {creator.featuredTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trip/${trip.id}`}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-2 py-1.5 text-[11px] hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-medium text-neutral-900 truncate">
                    {trip.title}
                  </span>
                  <span className="text-neutral-600 ml-2 flex-shrink-0">
                    {trip.price}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2 text-xs">
          <Link
            to={`/creator/${creator.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-neutral-900 px-3 py-1.5 font-semibold text-white hover:bg-neutral-800"
          >
            View Creator
          </Link>
          <Link
            to={`/collabs/new?creatorId=${creator.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-neutral-100 px-3 py-1.5 font-semibold text-neutral-900 hover:bg-neutral-200"
          >
            Propose Collab
          </Link>
        </div>
      </div>
    </article>
  );
}
