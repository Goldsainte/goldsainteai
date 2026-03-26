import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";
import { CreatorPinterestFeed, type PinItem, type BoardSummary } from "@/components/creator/CreatorPinterestFeed";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStoryboard } from "@/services/storyboardsService";
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
  const [mediaCount, setMediaCount] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [newBoardDestination, setNewBoardDestination] = useState("");
  const [creating, setCreating] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<{ platform: string; handle: string; profile_url: string; followers_count: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [profileRes, creatorProfileRes, reviewsRes, storyboardsRes, mediaCountRes, socialRes] = await Promise.all([
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
        (() => {
          let q = supabase
            .from("storyboards")
            .select("id, title, destination, is_public, storyboard_items(id, image_url, title, subtitle, position)")
            .eq("owner_id", id)
            .order("updated_at", { ascending: false });
          if (!user || user.id !== id) {
            q = q.eq("is_public", true);
          }
          return q;
        })(),
        supabase
          .from("creator_media")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
        supabase
          .from("creator_social_accounts")
          .select("platform, handle, profile_url, followers_count")
          .eq("user_id", id)
          .order("sort_order", { ascending: true }),
      ]);

      setCreator(profileRes.data as CreatorProfile | null);
      setCreatorData(creatorProfileRes.data as CreatorProfileData | null);

      const boards = (storyboardsRes.data || []) as any[];
      setCreatorStoryboards(
        boards.map((sb) => ({
          id: sb.id,
          title: sb.title,
          destination: sb.destination,
          is_public: sb.is_public ?? true,
        }))
      );

      // Flatten all items into pins
      const allPins: PinItem[] = [];
      for (const sb of boards) {
        for (const item of sb.storyboard_items || []) {
          if (item.image_url) {
            allPins.push({
              id: item.id,
              image_url: item.image_url,
              title: item.title,
              subtitle: item.subtitle,
              storyboard_id: sb.id,
              storyboard_title: sb.title,
              storyboard_destination: sb.destination,
            });
          }
        }
      }
      setPinItems(allPins);
      setMediaCount(mediaCountRes.count || 0);
      setSocialAccounts((socialRes.data || []) as { platform: string; handle: string; profile_url: string; followers_count: number }[]);

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

  // Listen for storyboard-updated events from SaveToStoryboardModal
  useEffect(() => {
    const handler = () => setReviewRefreshKey((k) => k + 1);
    window.addEventListener("storyboard-updated", handler);
    return () => window.removeEventListener("storyboard-updated", handler);
  }, []);

  const handleCreateStoryboard = async () => {
    if (!user || !newBoardTitle.trim()) return;
    setCreating(true);
    try {
      const board = await createStoryboard({
        ownerId: user.id,
        role: "creator",
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || undefined,
        isPublic: true,
      });
      // Add destination if provided
      if (newBoardDestination.trim()) {
        await supabase
          .from("storyboards")
          .update({ destination: newBoardDestination.trim() })
          .eq("id", board.id);
      }
      toast.success("Storyboard created!");
      setShowCreateDialog(false);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setNewBoardDestination("");
      setReviewRefreshKey((k) => k + 1); // triggers re-fetch
    } catch (err: any) {
      toast.error(err.message || "Failed to create storyboard");
    } finally {
      setCreating(false);
    }
  };

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
          specialties={specialties}
          socialAccounts={socialAccounts}
          followerDisplay={followerDisplay}
          storyboardCount={creatorStoryboards.length}
          postCount={mediaCount}
          responseTimeText={responseTimeText}
          targetUserId={isOwnProfile ? undefined : creator.id}
          onRequestTrip={handleRequestTrip}
        />

        {/* Pinterest-Style Storyboard Feed */}
        {(pinItems.length > 0 || isOwnProfile) && (
          <div className="bg-white">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
              <SectionLabel>Explore Travel Ideas</SectionLabel>
              <p className="font-primary text-sm text-[#6B7280] -mt-4 mb-8 max-w-lg">
                Curated travel pins by {firstName} — destinations, experiences, and moments that inspire your next journey.
              </p>
              <CreatorPinterestFeed
                items={pinItems}
                storyboards={creatorStoryboards}
                creatorId={creator.id}
                isOwnProfile={isOwnProfile}
                onCreateNew={() => setShowCreateDialog(true)}
                onBoardDeleted={() => setReviewRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        )}

        {/* Create Storyboard Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md bg-[#FDF9F0]">
            <DialogHeader>
              <DialogTitle className="font-secondary text-xl text-[#0a2225]">New Storyboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Title *</label>
                <Input
                  placeholder="e.g. Amalfi Coast Dream Trip"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="mt-1 border-[#E5DFC6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Destination</label>
                <Input
                  placeholder="e.g. Italy, Amalfi Coast"
                  value={newBoardDestination}
                  onChange={(e) => setNewBoardDestination(e.target.value)}
                  className="mt-1 border-[#E5DFC6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Description</label>
                <Textarea
                  placeholder="What's this storyboard about?"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="mt-1 border-[#E5DFC6] min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleCreateStoryboard}
                disabled={!newBoardTitle.trim() || creating}
                className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full h-11"
              >
                {creating ? "Creating…" : "Create Storyboard"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* From My Travels — Media gallery */}
        <div className="bg-[#FDF9F0]">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
            <SectionLabel>My Top Trip Highlights</SectionLabel>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#C7A962] mt-2 mb-6">Trips Gallery</p>
            <CreatorMediaGallery
              creatorId={creator.id}
              fallbackPhotos={creator.featured_photos}
              instagramHandle={creator.instagram_handle}
              isOwnProfile={isOwnProfile}
              hideTitle
            />
          </div>
        </div>


        {/* Reviews */}
        {reviewCount > 0 && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
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

        {/* Final CTA block */}
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
                Design My Trip
              </Button>
              <p className="text-[10px] text-[#9CA3AF] mt-3">
                Designed for you · No commitment · Delivered in 24–48 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
