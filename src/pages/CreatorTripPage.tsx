import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TripStoryboardViewer } from "@/components/TripStoryboardViewer";

type CreatorTripData = {
  tripStory: {
    id: string;
    title: string;
    hook?: string | null;
    caption: string;
    heroImageUrl?: string | null;
    itinerary?: string[] | null;
    postedToTikTok: boolean;
    tiktokVideoId?: string | null;
    createdAt: string;
  };
  journey: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
    shortDescription?: string | null;
    priceFrom?: string | null;
    duration?: string | null;
    tags?: string[] | null;
    destination?: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    username?: string | null;
    handle: string;
    avatarUrl?: string | null;
  };
};

export default function CreatorTripPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CreatorTripData | null>(null);
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
          "get-creator-trip",
          {
            body: { tripStoryId: id },
          }
        );

        if (invokeError) {
          console.error("Error invoking get-creator-trip:", invokeError);
          if (!isMounted) return;
          setError("Unable to load trip.");
          return;
        }

        if (!isMounted) return;
        setData(responseData as CreatorTripData);
      } catch (e: any) {
        console.error("Unexpected error loading trip:", e);
        if (!isMounted) return;
        setError("Unexpected error while loading trip.");
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
      <div className="flex-1 bg-[#f7f3ea]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 text-sm text-[#6B7280]">
          Loading trip…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-[#f7f3ea]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 text-sm text-red-700">
          {error ?? "Trip not found."}
        </div>
      </div>
    );
  }

  const { tripStory, journey, creator } = data;
  const heroImage = journey?.coverImageUrl || tripStory.heroImageUrl || undefined;
  const tags = journey?.tags ?? [];

  return (
    <div className="flex-1 bg-[#f7f3ea]">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        {/* HERO */}
        <div className="overflow-hidden rounded-2xl bg-neutral-200 shadow-sm">
          {heroImage && (
            <img
              src={heroImage}
              alt={journey?.title ?? tripStory.title}
              className="h-64 w-full object-cover md:h-80"
            loading="lazy"/>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">
              {journey?.title ?? tripStory.title}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {journey?.shortDescription ?? tripStory.caption}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
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
              {journey?.priceFrom ?? "Contact for pricing"}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {journey?.duration ?? ""}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button className="w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
                Book this trip
              </button>
              <button className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200">
                Request a custom version
              </button>
              <Link 
                to={`/storyboards`}
                className="w-full rounded-full bg-[#BFAD72] px-4 py-2 text-sm font-semibold text-[#0a2225] hover:bg-[#d4c58d] text-center"
              >
                Open storyboard
              </Link>
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
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-100">
                TikTok video placeholder
                <br />
                {tripStory.tiktokVideoId
                  ? `TikTok video ID: ${tripStory.tiktokVideoId}`
                  : "Once TikTok posting is fully integrated, this will show the video."}
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
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-9 w-9 overflow-hidden rounded-full bg-neutral-200 object-cover"
                loading="lazy"/>
              ) : (
                <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-200" />
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {creator.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {creator.handle}
                </div>
              </div>
            </div>
            <Link
              to={`/creator/${creator.id}`}
              className="mt-3 w-full rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-200 inline-flex items-center justify-center"
            >
              View creator profile
            </Link>
          </div>
        </section>

        {/* Trip Storyboard Viewer */}
        {journey?.id && (
          <div className="mt-6">
            <TripStoryboardViewer tripId={journey.id} />
          </div>
        )}
      </div>
    </div>
  );
}
