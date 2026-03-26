import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Grid3X3, BookOpen } from "lucide-react";
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

  const tabs = [
    { key: "storyboards" as const, label: "Storyboards", icon: BookOpen, count: creatorStoryboards.length },
    { key: "moments" as const, label: "Moments", icon: Grid3X3, count: mediaCount },
  ];

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

        {/* Compact IG-style header */}
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

        {/* Tab bar */}
        <div className="bg-white border-b border-[#E5DFC6]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
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

        {/* Content grid */}
        <div className="mx-auto max-w-5xl px-4 py-6">
          {activeTab === "storyboards" && (
            <CreatorStoryboardGrid
              storyboards={creatorStoryboards}
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

        {/* Reviews — minimal */}
        {reviewCount > 0 && (
          <div className="bg-white border-t border-[#E5DFC6]/40">
            <div className="mx-auto max-w-5xl px-4 py-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-secondary text-lg text-[#0a2225]">Reviews</h2>
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}
