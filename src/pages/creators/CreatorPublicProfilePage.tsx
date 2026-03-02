import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileTripsGrid } from "@/components/profile/ProfileTripsGrid";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreatorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  creator_niches: string[] | null;
  creator_avg_views: number | null;
  creator_followers: number | null;
  featured_photos: string[] | null;
}

export default function CreatorPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, bio, location, tiktok_handle, instagram_handle, creator_niches, creator_avg_views, creator_followers, featured_photos"
        )
        .eq("id", id)
        .maybeSingle();
      setCreator(data as CreatorProfile | null);
      setLoading(false);
    })();
  }, [id]);

  const fmt = (n: number | null | undefined) =>
    n && n > 0
      ? Intl.NumberFormat(undefined, { notation: "compact" }).format(n)
      : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="animate-pulse">
          <div className="h-64 md:h-80 bg-[#E5DFC6]" />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="h-8 w-64 rounded bg-[#E5DFC6]" />
            <div className="mt-4 h-4 w-96 rounded bg-[#E5DFC6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="font-secondary text-2xl text-[#0a2225]">
            Creator not found
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            We couldn't find this creator. They may have been removed or haven't completed onboarding.
          </p>
          <button
            onClick={() => navigate("/creators")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c4d47] px-5 py-2.5 text-sm text-white hover:bg-[#0a3d39]"
          >
            Browse creators
          </button>
        </div>
      </div>
    );
  }

  const socialLinks = [
    creator.tiktok_handle && {
      platform: "TikTok",
      handle: creator.tiktok_handle,
      url: `https://www.tiktok.com/@${creator.tiktok_handle}`,
    },
    creator.instagram_handle && {
      platform: "Instagram",
      handle: creator.instagram_handle,
      url: `https://www.instagram.com/${creator.instagram_handle}`,
    },
  ].filter(Boolean) as { platform: string; handle: string; url: string }[];

  return (
    <>
      <Helmet>
        <title>
          {creator.full_name || "Creator"} · Goldsainte Creators
        </title>
        <meta
          name="description"
          content={
            creator.bio ||
            `Discover ${creator.full_name || "this creator"} on Goldsainte`
          }
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back bar */}
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#0a2225] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* Hero */}
        <ProfileHero
          name={creator.full_name || "Goldsainte Creator"}
          coverImage={creator.featured_photos?.[0]}
          avatarUrl={creator.avatar_url}
          isVerified
          verifiedLabel="Goldsainte Creator"
          location={creator.location}
          pills={creator.creator_niches?.slice(0, 4) || []}
          stats={[
            { label: "Followers", value: fmt(creator.creator_followers) },
            { label: "Avg Views", value: fmt(creator.creator_avg_views) },
          ]}
        />

        {/* Two-column layout */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* About */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                  About {creator.full_name}
                </h2>
                <p className="mt-3 text-[#0a2225] leading-relaxed whitespace-pre-line">
                  {creator.bio ||
                    "This creator hasn't added a bio yet, but their trips speak for themselves."}
                </p>
              </section>

              {/* Niches */}
              {creator.creator_niches && creator.creator_niches.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-3">
                    Niches
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {creator.creator_niches.map((niche) => (
                      <span
                        key={niche}
                        className="rounded-full bg-[#C7B892]/20 border border-[#C7B892]/30 px-4 py-1.5 text-sm text-[#0a2225]"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery */}
              {creator.featured_photos &&
                creator.featured_photos.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
                      Storyboard Preview
                    </h2>
                    <div className="columns-2 md:columns-3 gap-3 space-y-3">
                      {creator.featured_photos.map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt="Storyboard"
                          className="w-full rounded-2xl object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </section>
                )}

              {/* Trips */}
              <ProfileTripsGrid creatorId={creator.id} creatorType="creator" />

              {/* Reviews */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Reviews
                  </h2>
                  {user && user.id !== creator.id && (
                    <WriteReviewModal
                      revieweeId={creator.id}
                      revieweeName={creator.full_name || "Creator"}
                      onSuccess={() => setReviewRefreshKey((k) => k + 1)}
                    >
                      <Button variant="outline" size="sm" className="border-[#E5DFC6] text-[#0a2225]">
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        Write a Review
                      </Button>
                    </WriteReviewModal>
                  )}
                </div>
                <ReviewsList revieweeId={creator.id} refreshKey={reviewRefreshKey} />
              </section>
            </div>

            {/* Right column — sticky sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <ProfileSidebar
                name={creator.full_name || "Creator"}
                targetUserId={creator.id}
                stats={[
                  {
                    label: "Followers",
                    value: fmt(creator.creator_followers),
                  },
                  {
                    label: "Avg Views",
                    value: fmt(creator.creator_avg_views),
                  },
                  {
                    label: "Niches",
                    value: creator.creator_niches?.length ?? 0,
                  },
                ]}
                socialLinks={socialLinks}
                onRequestTrip={() =>
                  navigate(`/post-trip?fromCreator=${creator.id}`)
                }
                onSaveToStoryboard={() =>
                  toast.info("Save to storyboard", {
                    description: "Coming soon!",
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
