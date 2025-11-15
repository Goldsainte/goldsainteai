import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";

type CreatorProfileResponse = {
  creator: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string | null;
    bio: string;
    primaryNiches: string[];
    primaryRegions: string[];
    tiktokHandle?: string | null;
    tiktokUrl?: string | null;
  };
  stats: {
    totalTripStories: number;
    featuredTripsCount: number;
    draftCount: number;
    publishedCount: number;
  };
  trips: {
    tripStoryId: string;
    title: string;
    heroImageUrl?: string | null;
    shortDescription?: string | null;
    priceFrom?: number | null;
    currency?: string;
    duration?: number | null;
    tags?: string[];
    postedToTikTok: boolean;
    tiktokPostId?: string | null;
    createdAt: string;
  }[];
};

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CreatorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: responseData, error: invokeError } = await supabase.functions.invoke(
          "get-creator-profile",
          {
            body: { creatorId: id },
          }
        );
        if (invokeError) {
          console.error(invokeError);
          if (!isMounted) return;
          setError("Unable to load creator profile.");
          return;
        }
        if (!isMounted) return;
        setData(responseData as CreatorProfileResponse);
      } catch (e: any) {
        console.error(e);
        if (!isMounted) return;
        setError("Unexpected error while loading creator profile.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          Loading creator profile…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-destructive">
          {error ?? "Creator not found."}
        </div>
      </div>
    );
  }

  const { creator, stats, trips } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* HEADER */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-muted md:h-20 md:w-20">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                  {creator.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {creator.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {creator.handle}
                {creator.tiktokHandle &&
                  creator.tiktokHandle !== creator.handle && (
                    <>
                      {" · "}
                      <span>{creator.tiktokHandle}</span>
                    </>
                  )}
              </p>
              <p className="mt-2 max-w-xl text-sm text-foreground">
                {creator.bio}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {creator.primaryNiches.map((niche) => (
                  <span
                    key={niche}
                    className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border"
                  >
                    {niche}
                  </span>
                ))}
                {creator.primaryRegions.map((region) => (
                  <span
                    key={region}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  >
                    {region}
                  </span>
                ))}
              </div>
              {creator.tiktokUrl && (
                <a
                  href={creator.tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center text-xs font-semibold text-foreground underline"
                >
                  View on TikTok
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 text-xs md:w-56">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border">
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  Trip stories
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.totalTripStories}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  Featured trips
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.featuredTripsCount}
                </div>
              </div>
            </div>
            <Link
              to={`/collabs/new?creatorId=${creator.id}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Propose collab (agent)
            </Link>
          </div>
        </header>

        {/* STORYBOARD */}
        <section className="mt-8">
          <TravelStoryboard
            title={`${creator.name}'s Travel Inspiration`}
            subtitle={`Visual moodboard for ${creator.primaryRegions.join(', ')} trips`}
            maxItems={12}
            highlightTags={creator.primaryRegions}
          />
        </section>

        {/* TRIPS */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Trips inspired by this creator's TikToks
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                These are trips built and sold through Goldsainte, based on this
                creator's content.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {trips.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-card p-4 text-xs text-muted-foreground">
                This creator hasn't published any trips yet.
              </div>
            ) : (
              trips.map((trip) => (
                <TripCard key={trip.tripStoryId} trip={trip} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TripCard({
  trip,
}: {
  trip: CreatorProfileResponse["trips"][number];
}) {
  const formatPrice = (price: number | null | undefined, currency: string = "USD") => {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (days: number | null | undefined) => {
    if (!days) return null;
    return `${days} ${days === 1 ? "day" : "days"}`;
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
      <div className="h-40 w-full bg-muted">
        {trip.heroImageUrl ? (
          <img
            src={trip.heroImageUrl}
            alt={trip.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {trip.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {trip.shortDescription}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatDuration(trip.duration) || "—"}</span>
          <span>From {formatPrice(trip.priceFrom, trip.currency)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {trip.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border"
            >
              {tag}
            </span>
          ))}
          {trip.postedToTikTok && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              TikTok featured
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          <Link
            to={`/trip/${trip.tripStoryId}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View trip
          </Link>
        </div>
      </div>
    </article>
  );
}
