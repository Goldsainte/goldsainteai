import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { CreatorHeroSection } from "@/components/creator/CreatorHeroSection";
import { CreatorStorefrontFeed, type PinItem, type BoardSummary } from "@/components/creator/CreatorStorefrontFeed";
import { CreatorServicesSection } from "@/components/creator/CreatorServicesSection";
import { CreatorAboutSection } from "@/components/creator/CreatorAboutSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// -- Gold section divider component --
function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-[#C7A962]/40" />
      <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]/60" />
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-[#C7A962]/40" />
    </div>
  );
}

// -- Section label component --
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-primary text-sm uppercase tracking-[0.25em] text-[#C7A962] shrink-0">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-[#C7A962]/30 to-transparent" />
    </div>
  );
}

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
  created_at?: string | null;
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
  const [creatorStoryboards, setCreatorStoryboards] = useState<BoardSummary[]>([]);
  const [pinItems, setPinItems] = useState<PinItem[]>([]);
  const [guides, setGuides] = useState<Array<{ id: string; title: string; destination: string; duration_days: number; price: number; currency: string; cover_image_url: string | null }>>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [profileRes, creatorProfileRes, reviewsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, display_name, avatar_url, bio, location, tiktok_handle, instagram_handle, creator_niches, creator_avg_views, creator_followers, featured_photos, cover_image_url, content_style_tags, destinations_focus_tags, travel_philosophy, last_seen_at, website, created_at"
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
  }, [id, user, reviewRefreshKey]);

  // Fetch published itinerary guides for this creator
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("itinerary_products")
        .select("id, title, destination, duration_days, price, currency, cover_image_url")
        .eq("creator_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setGuides((data as any) || []);
    })();
  }, [id]);

  // Listen for storyboard-updated events
  useEffect(() => {
    const handler = () => setReviewRefreshKey((k) => k + 1);
    window.addEventListener("storyboard-updated", handler);
    return () => window.removeEventListener("storyboard-updated", handler);
  }, []);


  const isOwnProfile = user?.id === creator?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="animate-pulse">
          <div className="h-[420px] bg-[#E5DFC6]" />
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
          <p className="mt-2 text-sm text-[#6B7280]">We couldn't find this creator.</p>
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
  const specialties = creatorData?.specialties || creator.creator_niches || [];
  const positioningTitle = specialties[0] || "Travel Designer";

  const responseTimeHours = creatorData?.response_time_hours;
  const responseTimeText = responseTimeHours
    ? responseTimeHours <= 1
      ? "Responds within 1 hour"
      : responseTimeHours <= 24
      ? `Responds within ${responseTimeHours} hours`
      : `Responds within ${Math.ceil(responseTimeHours / 24)} days`
    : null;

  const handleRequestTrip = () => navigate(`/post-trip?fromCreator=${creator.id}`);

  // Get a fallback cover image from first storyboard pin
  const fallbackCover = pinItems.length > 0 ? pinItems[0].image_url : null;

  return (
    <>
      <Helmet>
        <title>{displayName} · Goldsainte Creators</title>
        <meta name="description" content={bio || `Discover ${displayName} on Goldsainte`} />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back bar */}
        <div className="sticky top-0 z-20 bg-[#FDF9F0]/80 backdrop-blur-sm border-b border-[#E5DFC6]/40">
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

        {/* ─── 1. HERO — Trust Layer ─── */}
        <CreatorHeroSection
          name={displayName}
          avatarUrl={creator.avatar_url}
          coverImageUrl={creator.cover_image_url}
          title={positioningTitle}
          location={creator.location}
          avgRating={avgRating}
          reviewCount={reviewCount}
          tripsCompleted={creatorData?.trips_completed ?? null}
          clientsServed={creatorData?.clients_served ?? null}
          isVerified
          isOwnProfile={isOwnProfile}
          targetUserId={isOwnProfile ? undefined : creator.id}
          onRequestTrip={handleRequestTrip}
          fallbackCoverUrl={fallbackCover}
        />

        {/* Spacer after hero card overlap */}
        <div className="h-8 md:h-12" />

        {/* ─── 2. STORYBOARDS — Desire Layer (Pinterest) ─── */}
        {(pinItems.length > 0 || isOwnProfile) && (
          <div className="bg-white">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
              <SectionLabel>Travel Collections</SectionLabel>
              <CreatorStorefrontFeed
                items={pinItems}
                storyboards={creatorStoryboards}
                creatorId={creator.id}
                isOwnProfile={isOwnProfile}
                onCreateNew={() => navigate("/storyboards/new")}
                onBoardDeleted={() => setReviewRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        )}

        {/* ─── Itinerary Guides ─── */}
        {guides.length > 0 && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
              <SectionLabel>Itinerary Guides</SectionLabel>
              <div className="space-y-3">
                {guides.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/itinerary-guide/${g.id}`)}
                    className="w-full text-left rounded-2xl bg-white border border-[#E5DFC6] p-3 flex items-center gap-4 hover:border-[#C7A962]/60 transition"
                  >
                    {g.cover_image_url ? (
                      <img src={g.cover_image_url} alt={g.title} className="h-[80px] w-[120px] object-cover rounded-xl flex-shrink-0" />
                    ) : (
                      <div className="h-[80px] w-[120px] rounded-xl bg-[#E5DFC6] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0a2225] truncate">{g.title}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5 truncate">{g.destination} · {g.duration_days} days</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-[#0a2225]">
                        {g.currency === "USD" ? "$" : ""}{Number(g.price).toFixed(0)} {g.currency}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#0c4d47] font-medium">
                        Get Guide <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. SERVICES — Clarity Layer (Fiverr) ─── */}
        <div className="bg-[#FDF9F0]">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <SectionLabel>Travel Services</SectionLabel>
            <CreatorServicesSection
              creatorId={creator.id}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>

        {/* ─── 4. REVIEWS — Proof Layer ─── */}
        {(reviewCount > 0 || (!authLoading && user && user.id !== creator.id)) && (
          <div className="bg-white">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
              <div className="flex items-center justify-between mb-8">
                <SectionLabel>Reviews</SectionLabel>
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

        {/* ─── 5. ABOUT — Positioning Layer ─── */}
        <div className="bg-[#FDF9F0]">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <SectionLabel>About</SectionLabel>
            <CreatorAboutSection
              bio={bio}
              specialties={specialties}
              certifications={creatorData?.certifications ?? null}
              memberSince={creator.created_at ?? null}
              responseTimeText={responseTimeText}
            />
          </div>
        </div>

        {/* ─── 6. FINAL CTA ─── */}
        <div className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 text-center">
            <GoldDivider />
            <div className="mt-10">
              <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-3">
                Start Your Journey With {firstName}
              </h2>
              <p className="font-primary text-sm text-[#6B7280] mb-8 max-w-md mx-auto">
                Share your travel style and get a personalized itinerary crafted just for you.
              </p>
              <Button
                onClick={handleRequestTrip}
                className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-10 h-12 text-sm font-medium shadow-sm"
              >
                Request a Trip
              </Button>
              <p className="text-[10px] text-[#9CA3AF] mt-3">
                No commitment · Delivered in 24–48 hours
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
