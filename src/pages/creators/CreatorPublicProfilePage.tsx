import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Grid3X3, BookOpen, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";
import { CreatorStoryboardGrid } from "@/components/creator/CreatorStoryboardGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
  const [creatorStoryboards, setCreatorStoryboards] = useState<any[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"storyboards" | "moments">("storyboards");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [profileRes, creatorProfileRes, reviewsRes, storyboardsRes, mediaCountRes] = await Promise.all([
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
        supabase
          .from("storyboards")
          .select("id, title, description, cover_image_url, destination, tags, view_count, created_at, storyboard_items(count)")
          .eq("owner_id", id)
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
          .limit(12),
        supabase
          .from("creator_media")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
      ]);

      setCreator(profileRes.data as CreatorProfile | null);
      setCreatorData(creatorProfileRes.data as CreatorProfileData | null);
      setCreatorStoryboards(
        (storyboardsRes.data || []).map((sb: any) => ({
          ...sb,
          items_count: sb.storyboard_items?.[0]?.count || 0,
        }))
      );
      setMediaCount(mediaCountRes.count || 0);

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
          <div className="h-32 bg-[#E5DFC6]" />
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="h-6 w-48 rounded bg-[#E5DFC6]" />
            <div className="mt-3 h-4 w-72 rounded bg-[#E5DFC6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="font-secondary text-2xl text-[#0a2225]">Creator not found</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            We couldn't find this creator.
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
  const firstName = (creator.display_name || creator.full_name || "").split(" ")[0] || displayName;
  const bio = creator.travel_philosophy || creator.bio || creatorData?.bio;

  const followerDisplay = (creator.creator_followers ?? 0) > 0
    ? fmt(creator.creator_followers)
    : null;

  const responseTimeHours = creatorData?.response_time_hours;
  const responseTimeText = responseTimeHours
    ? responseTimeHours <= 1
      ? "Responds within 1 hour"
      : responseTimeHours <= 24
      ? `Responds within ${responseTimeHours} hours`
      : `Responds within ${Math.ceil(responseTimeHours / 24)} days`
    : null;

  const handleRequestTrip = () => navigate(`/post-trip?fromCreator=${creator.id}`);

  // Featured storyboard = first one with a cover image
  const featuredStoryboard = creatorStoryboards.find((sb) => sb.cover_image_url);
  const remainingStoryboards = featuredStoryboard
    ? creatorStoryboards.filter((sb) => sb.id !== featuredStoryboard.id)
    : creatorStoryboards;

  const tabs = [
    { key: "storyboards" as const, label: "Storyboards", icon: BookOpen, count: remainingStoryboards.length },
    { key: "moments" as const, label: "Moments", icon: Grid3X3, count: mediaCount },
  ];

  const specialties = creatorData?.specialties || creator.creator_niches || [];

  return (
    <>
      <Helmet>
        <title>{displayName} · Goldsainte Creators</title>
        <meta name="description" content={bio || `Discover ${displayName} on Goldsainte`} />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back bar */}
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
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

        {/* Premium header */}
        <ProfileHero
          name={displayName}
          avatarUrl={creator.avatar_url}
          isVerified
          bio={bio}
          followerDisplay={followerDisplay}
          storyboardCount={creatorStoryboards.length}
          postCount={mediaCount}
          responseTimeText={responseTimeText}
          targetUserId={isOwnProfile ? undefined : creator.id}
          onRequestTrip={handleRequestTrip}
        />

        {/* Featured Storyboard */}
        {featuredStoryboard && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-5">
                Featured Experience
              </p>
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/storyboards/${featuredStoryboard.id}`)}
              >
                <div className="aspect-[2/1] md:aspect-[16/7] overflow-hidden">
                  <img
                    src={featuredStoryboard.cover_image_url}
                    alt={featuredStoryboard.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex items-end justify-between">
                  <div>
                    {featuredStoryboard.destination && (
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {featuredStoryboard.destination}
                      </p>
                    )}
                    <h3 className="font-secondary text-2xl md:text-3xl text-white leading-tight">
                      {featuredStoryboard.title}
                    </h3>
                    {featuredStoryboard.description && (
                      <p className="text-white/70 text-sm mt-2 max-w-lg line-clamp-2">
                        {featuredStoryboard.description}
                      </p>
                    )}
                  </div>
                  <button
                    className="hidden md:inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/30 transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/post-trip?fromCreator=${creator.id}&storyboard=${featuredStoryboard.id}${featuredStoryboard.destination ? `&destination=${encodeURIComponent(featuredStoryboard.destination)}` : ""}`);
                    }}
                  >
                    Plan a trip like this
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works strip */}
        <div className="bg-white border-y border-[#E5DFC6]/40">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <p className="text-xs text-[#9CA3AF] text-center tracking-wide">
              Share your travel style → Get a custom itinerary → Book your trip
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-[#E5DFC6]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-[#0a2225] text-[#0a2225]"
                      : "border-transparent text-[#6B7280] hover:text-[#0a2225]"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section label + Content grid */}
        <div className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-6">
              {activeTab === "storyboards" ? "Explore Travel Ideas" : "From My Travels"}
            </p>

            {activeTab === "storyboards" && (
              <CreatorStoryboardGrid
                storyboards={remainingStoryboards}
                displayName={displayName}
                creatorId={creator.id}
                onRequestTrip={handleRequestTrip}
                hideTitle
              />
            )}
            {activeTab === "moments" && (
              <CreatorMediaGallery
                creatorId={creator.id}
                fallbackPhotos={creator.featured_photos}
                instagramHandle={creator.instagram_handle}
                isOwnProfile={isOwnProfile}
                hideTitle
                useIgGrid
              />
            )}
          </div>
        </div>

        {/* Meet the Creator */}
        {bio && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-4">
                About
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-4">
                Meet {firstName}
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl line-clamp-4">
                {bio}
              </p>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {specialties.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280] border border-[#E5DFC6] rounded-full px-3 py-1"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviewCount > 0 && (
          <div className="bg-white border-t border-[#E5DFC6]/40">
            <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-secondary text-xl text-[#0a2225]">Reviews</h2>
                {!authLoading && user && user.id !== creator.id && (
                  <WriteReviewModal
                    revieweeId={creator.id}
                    revieweeName={displayName}
                    onSuccess={() => setReviewRefreshKey((k) => k + 1)}
                  >
                    <Button variant="outline" size="sm" className="border-[#E5DFC6] text-[#0a2225] rounded-full">
                      <PenLine className="mr-1.5 h-3.5 w-3.5" />
                      Write a Review
                    </Button>
                  </WriteReviewModal>
                )}
                {!authLoading && !user && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#E5DFC6] text-[#6B7280] rounded-full"
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
            </div>
          </div>
        )}

        {/* Final CTA block */}
        <div className="bg-[#FDF9F0] border-t border-[#E5DFC6]/40">
          <div className="mx-auto max-w-5xl px-4 py-14 md:py-20 text-center">
            <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-3">
              Start Your Journey With {firstName}
            </h2>
            <p className="text-sm text-[#6B7280] mb-8 max-w-md mx-auto">
              Share your travel style and get a personalized itinerary crafted just for you.
            </p>
            <Button
              onClick={handleRequestTrip}
              className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-10 h-12 text-sm font-medium shadow-sm"
            >
              Get Custom Itinerary
            </Button>
            <p className="text-[10px] text-[#9CA3AF] mt-3">
              Designed for you · No commitment · Delivered in 24–48 hours
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
