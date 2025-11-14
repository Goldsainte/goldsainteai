import { useParams } from "react-router-dom";

// For now, mock; later this should fetch from Supabase (trip_stories + journeys)
const MOCK_TRIP = {
  id: "trip-1",
  title: "Santorini Honeymoon Escape",
  heroImageUrl:
    "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg",
  tiktokUrl: "https://www.tiktok.com/@travelwithmaya/video/1234567890",
  creatorName: "Travel with Maya",
  creatorHandle: "@travelwithmaya",
  shortDescription:
    "7 nights in a cave suite with private pool, catamaran cruise, and winery day.",
  priceFrom: "$3,950 per person",
  duration: "7 nights",
  tags: ["Couples", "Luxury", "Greece"],
};

export default function CreatorTripPage() {
  const { id } = useParams<{ id: string }>();
  // TODO: use `id` to load real trip from Supabase.
  const trip = MOCK_TRIP;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {/* HERO */}
        <div className="overflow-hidden rounded-2xl bg-neutral-200 shadow-sm">
          {trip.heroImageUrl && (
            <img
              src={trip.heroImageUrl}
              alt={trip.title}
              className="h-64 w-full object-cover md:h-80"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {trip.title}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {trip.shortDescription}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {trip.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-neutral-200/80">
            <div className="text-xs text-neutral-500">From</div>
            <div className="text-lg font-semibold text-neutral-900">
              {trip.priceFrom}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {trip.duration}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button className="w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
                Book this trip
              </button>
              <button className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200">
                Request a custom version
              </button>
            </div>

            <p className="mt-2 text-[11px] text-neutral-500">
              Booked and managed securely by a certified Goldsainte travel
              partner.
            </p>
          </div>
        </div>

        {/* TikTok & creator */}
        <section className="mt-6 grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
            <h2 className="text-sm font-semibold text-neutral-900">
              TikTok preview
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              This is the TikTok that inspired this trip.
            </p>

            <div className="mt-3 aspect-[9/16] w-full overflow-hidden rounded-xl bg-neutral-900/80">
              {/* For now, just show the URL as a placeholder; later you can embed */}
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-100">
                TikTok video embed placeholder
                <br />
                {trip.tiktokUrl}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-neutral-200/80">
            <h2 className="text-sm font-semibold text-neutral-900">
              Featured creator
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              This trip is featured by a TikTok creator and fulfilled by a
              Goldsainte travel agent.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-200" />
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {trip.creatorName}
                </div>
                <div className="text-xs text-neutral-500">
                  {trip.creatorHandle}
                </div>
              </div>
            </div>
            <button className="mt-3 w-full rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-200">
              View creator profile
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
