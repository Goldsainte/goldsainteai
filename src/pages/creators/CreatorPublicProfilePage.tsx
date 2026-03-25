import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileTripsGrid } from "@/components/profile/ProfileTripsGrid";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";
import { CreatorTrustSection } from "@/components/creator/CreatorTrustSection";
import { HowCreatorWorks } from "@/components/creator/HowCreatorWorks";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreatorProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  creator_niches: string[] | null;
  creator_avg_views: number | null;
  creator_followers: number | null;
  featured_photos: string[] | null;
  cover_image_url: string | null;
  content_style_tags: string[] | null;
  destinations_focus_tags: string[] | null;
  travel_philosophy: string | null;
  last_seen_at: string | null;
  website: string | null;
}

interface CreatorProfileData {
  years_experience: number | null;
  trips_completed: number | null;
  clients_served: number | null;
  certifications: string[] | null;
  travel_styles: string[] | null;
  best_for: string[] | null;
  not_ideal_for: string[] | null;
  response_time_hours: number | null;
  specialties: string[] | null;
  bio: string | null;
  updated_at: string;
}

export default function CreatorPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  
  

  useEffect(() => {
    if (!id) return;
    (async () => {
      // Fetch profile + creator_profiles + reviews in parallel
      const [profileRes, creatorProfileRes, reviewsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, display_name, avatar_url, bio, location, tiktok_handle, instagram_handle, creator_niches, creator_avg_views, creator_followers, featured_photos, cover_image_url, content_style_tags, destinations_focus_tags, travel_philosophy, last_seen_at, website"
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("creator_profiles")
          .select(
            "years_experience, trips_completed, clients_served, certifications, travel_styles, best_for, not_ideal_for, response_time_hours, specialties, bio, updated_at"
          )
          .eq("user_id", id)
          .maybeSingle(),
        supabase
          .from("profile_reviews")
          .select("rating")
          .eq("reviewee_id", id),
      ]);

      setCreator(profileRes.data as CreatorProfile | null);
      setCreatorData(creatorProfileRes.data as CreatorProfileData | null);

      const reviews = reviewsRes.data;
      if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        setAvgRating(sum / reviews.length);
        setReviewCount(reviews.length);
      } else {
        setAvgRating(null);
        setReviewCount(0);
      }

      setLoading(false);
    })();
  }, [id, reviewRefreshKey]);

  const fmt = (n: number | null | undefined) =>
    n != null && n > 0
      ? Intl.NumberFormat(undefined, { notation: "compact" }).format(n)
      : "0";

  const isOwnProfile = user?.id === creator?.id;

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

  const displayName = creator.display_name || creator.full_name || "Goldsainte Creator";

  // Build service line from niches + destinations
  const nichePart = creator.creator_niches?.length
    ? `Custom ${creator.creator_niches.slice(0, 2).join(" & ").toLowerCase()} travel planning`
    : "Custom travel planning";
  const destPart = creator.destinations_focus_tags?.length
    ? creator.destinations_focus_tags.slice(0, 2).join(" & ")
    : null;
  const serviceLine = destPart ? `${nichePart} · ${destPart}` : nichePart;

  const specialties = creatorData?.specialties || creator.content_style_tags || creator.creator_niches || [];
  const travelStyles = creatorData?.travel_styles || [];
  const bestFor = creatorData?.best_for || [];
  const notIdealFor = creatorData?.not_ideal_for || [];
  const bio = creator.bio || creatorData?.bio;
  const tagline = creator.travel_philosophy;
  const lastActive = creator.last_seen_at || creatorData?.updated_at;

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

  const followerDisplay = (creator.creator_followers ?? 0) > 0
    ? fmt(creator.creator_followers)
    : null;

  const heroStats = [
    followerDisplay
      ? { label: "Followers", value: followerDisplay }
      : { label: "Status", value: "New Creator" },
    { label: "Avg Views", value: fmt(creator.creator_avg_views) },
  ];

  const handleRequestTrip = () => navigate(`/post-trip?fromCreator=${creator.id}`);

  return (
    <>
      <Helmet>
        <title>{displayName} · Goldsainte Creators</title>
        <meta
          name="description"
          content={
            tagline || bio || `Discover ${displayName} on Goldsainte`
          }
        />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back bar */}
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#0a2225] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/creator-dashboard?tab=portfolio")}
                className="border-[#E5DFC6] text-[#0a2225] rounded-full"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Hero */}
        <ProfileHero
          name={displayName}
          coverImage={creator.cover_image_url || creator.featured_photos?.[0]}
          avatarUrl={creator.avatar_url}
          isVerified
          verifiedLabel="Goldsainte Creator"
          location={creator.location}
          tagline={tagline}
          serviceLine={serviceLine}
          pills={creator.creator_niches?.slice(0, 4) || []}
          rating={avgRating}
          reviewCount={reviewCount}
          stats={heroStats}
        />

        {/* How to Book — directly under hero */}
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-0">
          <HowCreatorWorks creatorName={displayName} />
        </div>

        {/* Two-column layout */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* Structured About */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                  About {displayName}
                </h2>
                <p className="mt-3 text-[#0a2225] leading-relaxed whitespace-pre-line">
                  {bio || "This creator hasn't added a bio yet, but their trips speak for themselves."}
                </p>

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
                      What I Specialize In
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-[#C7B892]/20 border border-[#C7B892]/30 px-3 py-1.5 text-xs text-[#0a2225]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel Styles */}
                {travelStyles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
                      Travel Style
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {travelStyles.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-[#0c4d47]/10 border border-[#0c4d47]/20 px-3 py-1.5 text-xs text-[#0c4d47]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state placeholder */}
                {specialties.length === 0 && travelStyles.length === 0 && !bio && (
                  <div className="mt-4 rounded-xl border border-dashed border-[#E5DFC6] bg-[#F5F0E0]/30 p-4 text-center">
                    <Sparkles className="h-5 w-5 text-[#C7A962] mx-auto mb-2" />
                    <p className="text-xs text-[#6B7280]">
                      This creator is building their profile — stay tuned!
                    </p>
                  </div>
                )}
              </section>

              {/* Trust & Credibility */}
              <CreatorTrustSection
                yearsExperience={creatorData?.years_experience}
                tripsCompleted={creatorData?.trips_completed}
                clientsServed={creatorData?.clients_served}
                certifications={creatorData?.certifications}
                isVerified
              />

              {/* Audience / Fit */}
              {(bestFor.length > 0 || notIdealFor.length > 0) && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
                    Who This Is For
                  </h2>
                  {bestFor.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[#6B7280] mb-2">Best For</p>
                      <div className="flex flex-wrap gap-2">
                        {bestFor.map((b) => (
                          <span
                            key={b}
                            className="rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-xs text-green-800"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {notIdealFor.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-2">Not Ideal For</p>
                      <div className="flex flex-wrap gap-2">
                        {notIdealFor.map((n) => (
                          <span
                            key={n}
                            className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs text-orange-800"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Gallery */}
              <CreatorMediaGallery
                creatorId={creator.id}
                fallbackPhotos={creator.featured_photos}
                instagramHandle={creator.instagram_handle}
                isOwnProfile={isOwnProfile}
              />

              {/* Trips */}
              <ProfileTripsGrid
                creatorId={creator.id}
                creatorType="creator"
              />

              {/* Reviews */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
                    Reviews
                  </h2>
                  {!authLoading && user && user.id !== creator.id && (
                    <WriteReviewModal
                      revieweeId={creator.id}
                      revieweeName={displayName}
                      onSuccess={() => setReviewRefreshKey((k) => k + 1)}
                    >
                      <Button variant="outline" size="sm" className="border-[#E5DFC6] text-[#0a2225]">
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        Write a Review
                      </Button>
                    </WriteReviewModal>
                  )}
                  {!authLoading && !user && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E5DFC6] text-[#6B7280]"
                      onClick={() => navigate("/auth")}
                    >
                      <LogIn className="mr-1.5 h-3.5 w-3.5" />
                      Sign in to review
                    </Button>
                  )}
                </div>
                <ReviewsList
                  revieweeId={creator.id}
                  refreshKey={reviewRefreshKey}
                  avgRating={avgRating}
                  reviewCount={reviewCount}
                />
              </section>
            </div>

            {/* Right column — sticky sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <ProfileSidebar
                name={displayName}
                rating={avgRating}
                reviewCount={reviewCount}
                targetUserId={isOwnProfile ? undefined : creator.id}
                stats={[
                  {
                    label: "Followers",
                    value: followerDisplay || "New",
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
                website={creator.website}
                lastActiveAt={lastActive}
                responseTimeHours={creatorData?.response_time_hours}
                requestTripMicrocopy="Post your trip details → get matched instantly"
                onRequestTrip={handleRequestTrip}
                onSaveToStoryboard={() =>
                  toast.info("Save to storyboard", {
                    description: "Coming soon!",
                  })
                }
                showHowItWorks={false}
              />
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
