// src/pages/public/StoryboardSharePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoryboardPublicBySlugOrId,
  type StoryboardPublic,
} from "@/services/storyboardsService";

function firstNonEmpty<T>(arr: (T | null | undefined)[]): T | null {
  for (const v of arr) {
    if (v != null) return v;
  }
  return null;
}

export default function StoryboardSharePage() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [storyboard, setStoryboard] = useState<StoryboardPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slugOrId) return;
      try {
        const [{ data: authData }, sb] = await Promise.all([
          supabase.auth.getUser(),
          getStoryboardPublicBySlugOrId(slugOrId),
        ]);
        if (cancelled) return;

        const user = authData.user;
        setUserId(user?.id ?? null);

        setStoryboard(sb);
      } catch (err: any) {
        if (!cancelled)
          setError(err.message || "We couldn't load this storyboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  function handleRequestThisTrip() {
    if (!storyboard) return;
    const target = `/post-trip?fromStoryboard=${storyboard.id}`;

    if (!userId) {
      // If not logged in, redirect via sign-in page with returnTo param
      sessionStorage.setItem('returnTo', target);
      navigate(`/auth?returnTo=${encodeURIComponent(target)}`);
    } else {
      navigate(target);
    }
  }

  const title =
    storyboard?.title ||
    storyboard?.destination ||
    "Goldsainte storyboard";

  const heroImage =
    firstNonEmpty([
      storyboard?.hero_image_url,
      storyboard?.scenes?.[0]?.media_url,
    ]) || null;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-4 md:pt-12 md:pb-6">
        {/* Optional subtle logo/back link */}
        <div className="flex items-center justify-between mb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            goldsainte.com
          </Link>
        </div>

        {loading && (
          <p className="text-[11px] text-[#8D8D8D]">Loading storyboard…</p>
        )}
        {error && (
          <p className="text-[11px] text-red-600">{error}</p>
        )}

        {storyboard && (
          <header className="space-y-3 md:flex md:items-end md:justify-between md:space-y-0 md:gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                Goldsainte storyboard
              </p>
              <h1 className="font-display text-[24px] md:text-[26px] leading-tight">
                {title}
              </h1>
              <div className="flex flex-wrap gap-2 text-[10px] text-[#4a4a4a]">
                {storyboard.destination && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {storyboard.destination}
                  </span>
                )}
                {storyboard.theme_tags?.length ? (
                  <span className="inline-flex flex-wrap gap-1">
                    {storyboard.theme_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </div>
              {storyboard.owner && (
                <p className="text-[10px] text-[#8D8D8D]">
                  A trip concept by{" "}
                  <span className="font-semibold">
                    {storyboard.owner.display_name}
                  </span>{" "}
                  on Goldsainte.
                </p>
              )}
            </div>

            <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end gap-2">
              <p className="text-[10px] text-[#4a4a4a] max-w-xs text-left md:text-right">
                Like what you see? Turn this storyboard into a real, bookable
                trip with Goldsainte creators and certified travel agents.
              </p>
              <button
                type="button"
                onClick={handleRequestThisTrip}
                className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-5 py-2 text-[11px] font-semibold hover:bg-[#073331]"
              >
                Request this trip on Goldsainte
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </header>
        )}
      </section>

      {storyboard && (
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          {/* Hero image + grid */}
          {heroImage && (
            <div className="mb-4 rounded-[24px] overflow-hidden border border-[#E5DFC6] bg-black/5">
              <img
                src={heroImage}
                alt={storyboard.title || storyboard.destination || "Storyboard"}
                className="w-full h-[220px] md:h-[280px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {storyboard.scenes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {storyboard.scenes.slice(0, 9).map((scene) => (
                <figure
                  key={scene.id}
                  className="relative rounded-[20px] overflow-hidden border border-[#E5DFC6] bg-black/5"
                >
                  {scene.media_url && (
                    <img
                      src={scene.media_url}
                      alt={scene.caption || ""}
                      className="w-full h-[140px] md:h-[170px] object-cover"
                      loading="lazy"
                    />
                  )}
                  {scene.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/45 text-white text-[9px] px-2 py-1">
                      {scene.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {!storyboard.scenes.length && (
            <p className="text-[11px] text-[#8D8D8D] mt-4">
              This storyboard doesn&apos;t have scenes yet, but it still gives a
              sense of the trip concept. You can request it and share your
              preferences once you&apos;re signed in.
            </p>
          )}

          <div className="mt-6 rounded-3xl bg-white/95 border border-[#E5DFC6] px-4 py-3 text-[10px] text-[#4a4a4a]">
            <p className="font-semibold mb-1">
              How Goldsainte makes this bookable
            </p>
            <p>
              1. You tell us how many nights, your dates and your budget. <br />
              2. Goldsainte creators and certified travel agents turn this
              storyboard into a tailored proposal. <br />
              3. You review everything and book through Goldsainte&apos;s
              protected flow — no DMs, no random links.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
