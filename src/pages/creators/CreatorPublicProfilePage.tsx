import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PenLine, LogIn, Settings, Plus, ArrowRight, MoreHorizontal, Link2, Eye, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { CreatorHeroSection } from "@/components/creator/CreatorHeroSection";
import { CreatorServicesSection } from "@/components/creator/CreatorServicesSection";
import { CreatorAboutSection } from "@/components/creator/CreatorAboutSection";
import { CoverPhotoModal } from "@/components/CoverPhotoModal";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TikTokCarousel } from "@/components/TikTokEmbed";
import { ShareButton } from "@/components/ShareButton";

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
/* Mockup-spec section header: gold eyebrow + Playfair headline (+ optional link) */
function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="font-sans text-[13px] uppercase tracking-[0.25em] text-[#C7A962]" style={{ fontFamily: "Inter, sans-serif" }}>
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-secondary text-[27px] font-semibold text-[#0a2225]">{title}</h2>
      </div>
      {link}
    </div>
  );
}

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
  username: string | null;
  featured_tiktok_videos: string[] | null;
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
  creator_tier?: string | null;
  is_verified?: boolean | null;
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
  const [guides, setGuides] = useState<Array<{ id: string; title: string; destination: string; duration_days: number; price: number; currency: string; cover_image_url: string | null }>>([]);
  const [trips, setTrips] = useState<Array<{ id: string; title: string | null; slug: string | null; destination: string | null; cover_image_url: string | null; price_per_person: number | null }>>([]);

  // ── Direct message composer state ──
  // MUST live up here with the other hooks: this component has early returns
  // (loading / not-found) below, and hooks declared after those returns crash
  // with React error #310 ("rendered more hooks than during the previous
  // render") the moment loading flips to false.
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProfile();
  }, [id, user, reviewRefreshKey]);

  const fetchProfile = async () => {
    if (!id) return;
    const [profileRes, creatorProfileRes, reviewsRes] = await Promise.all([
        // profiles is RLS-locked to own-row reads; creator_directory is the
        // public window view (columns mirror profiles, hence the type borrow).
        supabase
          .from("creator_directory" as unknown as "profiles")
          .select(
            "id, username, featured_tiktok_videos, full_name, display_name, avatar_url, bio, location, tiktok_handle, instagram_handle, creator_niches, creator_avg_views, creator_followers, featured_photos, cover_image_url, content_style_tags, destinations_focus_tags, travel_philosophy, last_seen_at, website, created_at, creator_tier, is_verified"
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

      const raw = profileRes.data as any;
      setCreator(
        raw
          ? {
              ...raw,
              featured_tiktok_videos: Array.isArray(raw.featured_tiktok_videos)
                ? raw.featured_tiktok_videos.filter((v: any) => typeof v === "string")
                : [],
            }
          : null
      );
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
  };

  // Fetch this creator's published itinerary guides + bookable trip packages
  useEffect(() => {
    if (!id) return;
    (async () => {
      const [guidesRes, tripsRes] = await Promise.all([
        supabase
          .from("itinerary_products")
          .select("id, title, destination, duration_days, price, currency, cover_image_url")
          .eq("creator_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase
          .from("packaged_trips")
          .select("id, title, slug, destination, cover_image_url, price_per_person")
          .eq("creator_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      setGuides((guidesRes.data as any) || []);
      setTrips((tripsRes.data as any) || []);
    })();
  }, [id]);

  const isOwnProfile = user?.id === creator?.id;
  // "View as traveler": Airbnb-style preview. While previewing, every
  // owner affordance (camera, coach marks, builder CTAs, tier picker)
  // disappears so the owner sees exactly what the public sees.
  const [previewAsTraveler, setPreviewAsTraveler] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const effIsOwn = isOwnProfile && !previewAsTraveler;

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
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/marketplace")
            }
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
  const rawSpecialty = specialties[0];
  const positioningTitle = rawSpecialty
    ? rawSpecialty.charAt(0).toUpperCase() + rawSpecialty.slice(1)
    : "Travel Designer";

  const responseTimeHours = creatorData?.response_time_hours;
  const responseTimeText = responseTimeHours
    ? responseTimeHours <= 1
      ? "Responds within 1 hour"
      : responseTimeHours <= 24
      ? `Responds within ${responseTimeHours} hours`
      : `Responds within ${Math.ceil(responseTimeHours / 24)} days`
    : null;

  const handleRequestTrip = () => navigate(`/post-trip?fromCreator=${creator.id}`);
  const handlePreviewOnly = () =>
    toast.info("Preview only — travelers can use this button.");

  const handleOpenMessage = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/creators/${id}`)}`);
      return;
    }
    setMessageOpen(true);
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !creator) return;
    setMessageSending(true);
    try {
      // send-direct-message finds-or-creates the conversation server-side
      // and enforces block/privacy settings. Same path the rest of the DM
      // system uses.
      const { error } = await supabase.functions.invoke("send-direct-message", {
        body: { recipientId: creator.id, message: text },
      });
      if (error) throw error;
      setMessageOpen(false);
      setMessageText("");
      toast.success(`Message sent to ${creator.display_name || "the creator"}.`, {
        action: { label: "Open Messages", onClick: () => navigate("/messages") },
      });
    } catch (err: any) {
      toast.error(err?.message || "Could not send the message.");
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{displayName} · Goldsainte Creators</title>
        <meta name="description" content={bio || `Discover ${displayName} on Goldsainte`} />
        {/* Rich link previews. Note: client-rendered tags only reach scrapers
            that execute JS; full coverage needs server-rendered OG per profile
            (queued post-launch). */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayName} · Goldsainte`} />
        <meta property="og:description" content={bio || `Plan your next trip with ${displayName} on Goldsainte.`} />
        {creator.avatar_url && <meta property="og:image" content={creator.avatar_url} />}
        <meta name="twitter:card" content={creator.avatar_url ? "summary_large_image" : "summary"} />
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
            <div className="flex items-center gap-2">
              {isOwnProfile && previewAsTraveler ? (
                /* Preview mode: all owner chrome collapses to one exit
                   affordance — what remains below is byte-for-byte the
                   public render. */
                <Button
                  onClick={() => setPreviewAsTraveler(false)}
                  size="sm"
                  className="bg-[#0a2225] hover:bg-[#0c4d47] text-white rounded-full h-9 px-4 text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Previewing as traveler — Exit
                </Button>
              ) : isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewAsTraveler(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#F5F0E0] hover:bg-[#EDE6D2] px-3 py-1.5 text-[11px] text-[#6B7280] hover:text-[#0a2225] transition-colors"
                    title="See exactly what travelers see."
                  >
                    <Eye className="h-3 w-3" /> View as traveler
                  </button>
                  <Button
                    onClick={() => navigate("/creator-dashboard?tab=portfolio")}
                    variant="outline"
                    size="sm"
                    className="border-[#E5DFC6] text-[#0a2225] rounded-full h-9"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" /> Edit profile
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="More options"
                        className="border-[#E5DFC6] text-[#0a2225] rounded-full h-9 w-9 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-primary w-52 bg-white border-[#E5DFC6]">
                      <DropdownMenuItem
                        onClick={() => {
                          const url = creator.username
                            ? `https://goldsainte.ai/@${creator.username}`
                            : `https://goldsainte.ai/creators/${creator.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Profile link copied");
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5 mr-2" /> Copy profile link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          // Canonical /creators/:id route — the @username redirector
                          // can 404 if the username record is missing/mis-cased.
                          window.open(`/creators/${creator.id}`, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" /> Public preview
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <ShareButton
                  url={creator.username ? `/@${creator.username}/shop` : `/creators/${creator.id}`}
                  title={`${displayName} on Goldsainte`}
                  description={bio || undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── 1. HERO — Trust Layer ─── */}
        <CreatorHeroSection
          name={displayName}
          avatarUrl={creator.avatar_url}
          title={positioningTitle}
          location={creator.location}
          avgRating={avgRating}
          reviewCount={reviewCount}
          tripsCompleted={creatorData?.trips_completed ?? null}
          clientsServed={creatorData?.clients_served ?? null}
          specialties={specialties}
          responseTimeText={responseTimeText}
          isVerified={Boolean(creator.is_verified)}
          isOwnProfile={effIsOwn}
          coverImageUrl={(creator as any).cover_image_url || null}
          guideCount={guides.length}
          onEditCover={effIsOwn ? () => setCoverModalOpen(true) : undefined}
          targetUserId={effIsOwn ? undefined : creator.id}
          onRequestTrip={previewAsTraveler ? handlePreviewOnly : handleRequestTrip}
          onMessage={effIsOwn ? undefined : previewAsTraveler ? handlePreviewOnly : handleOpenMessage}
          profileUserId={creator.id}
          onProfileUpdated={fetchProfile}
          memberSince={creator.created_at ?? null}
          followerCount={creator.creator_followers}
          creatorTier={creator.creator_tier}
        />

        {/* ── In-page anchor nav (only sections that actually exist) ── */}
        {(() => {
          const anchors = [
            guides.length > 0 && { id: "guides", label: "Guides" },
            trips.length > 0 && { id: "trips", label: "Trips" },
            ((creator.featured_photos?.length ?? 0) > 0 || (creator.featured_tiktok_videos?.length ?? 0) > 0 || creator.instagram_handle) &&
              { id: "highlights", label: "Highlights" },
            Boolean(bio || (creatorData?.certifications?.length ?? 0) > 0 || creator.location) && { id: "about", label: "About" },
            reviewCount > 0 && { id: "reviews", label: "Reviews" },
          ].filter(Boolean) as { id: string; label: string }[];
          if (anchors.length < 2) return null;
          return (
            <div className="mx-auto max-w-5xl px-4">
              <nav className="mt-9 flex gap-8 border-b border-[#E5DFC6] font-sans text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
                {anchors.map((a, i) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    className={`pb-3.5 pt-1 tracking-[0.04em] transition-colors ${
                      i === 0
                        ? "border-b-2 border-[#0c4d47] font-semibold text-[#0a2225]"
                        : "text-[#6B7280] hover:text-[#0a2225]"
                    }`}
                  >
                    {a.label}
                  </a>
                ))}
              </nav>
            </div>
          );
        })()}

        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent className="bg-[#FDF9F0] border-[#E5DFC6] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-secondary text-[#0a2225]">
                Message {creator.display_name || "this creator"}
              </DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                Starts a private conversation. Replies land in your Messages.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi! I'd love to talk about..."
              rows={5}
              maxLength={2000}
              className="bg-white border-[#E5DFC6] text-[#0a2225] placeholder:text-[#9CA3AF]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMessageOpen(false)}
                className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea] rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={messageSending || !messageText.trim()}
                className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-6"
              >
                {messageSending ? "Sending…" : "Send message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Spacer after hero card overlap */}
        <div className="h-8 md:h-12" />

        {/* ─── Photo/video portfolio — was built but never wired into this page ─── */}
        <div className="bg-[#FDF9F0]">
          <div id="highlights" className="mx-auto max-w-5xl px-4 pb-8 md:pb-12 scroll-mt-24">
            <CreatorMediaGallery
              creatorId={creator.id}
              fallbackPhotos={creator.featured_photos}
              instagramHandle={creator.instagram_handle}
              isOwnProfile={effIsOwn}
            />
          </div>
        </div>

        {/* ─── Empty portfolio state (owner only, nothing published yet) ─── */}
        {effIsOwn && trips.length === 0 && guides.length === 0 && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 pb-12 md:pb-16">
              <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-10 text-center">
                <Compass className="h-7 w-7 text-[#C7A962] mx-auto mb-3" />
                <h3 className="font-secondary text-xl text-[#0a2225] mb-1.5">No published work yet</h3>
                <p className="text-sm text-[#6B7280] max-w-sm mx-auto mb-5">
                  Package a trip, create a bookable tour, or build an itinerary guide to start filling this space — it's the first thing travelers see.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    onClick={() => navigate("/trip-builder")}
                    className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-6 h-10 text-sm font-medium"
                  >
                    Package a trip
                  </Button>
                  <Button
                    onClick={() => navigate("/trip-builder")}
                    variant="outline"
                    className="border-[#E5DFC6] text-[#0a2225] rounded-full px-6 h-10 text-sm font-medium"
                  >
                    Create a tour
                  </Button>
                  <Button
                    onClick={() => navigate("/itinerary-builder")}
                    variant="outline"
                    className="border-[#E5DFC6] text-[#0a2225] rounded-full px-6 h-10 text-sm font-medium"
                  >
                    Build a guide
                  </Button>
                </div>
                <p className="mt-3 text-xs text-[#9CA3AF]">
                  Tours use the Trip Builder — pick "Bookable Tour" as the listing type.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Curated Journeys (bookable trip packages) ─── */}
        {trips.length > 0 && (
          <div className="bg-[#FDF9F0]">
            <div id="trips" className="mx-auto max-w-5xl px-4 py-12 md:py-16 scroll-mt-24">
              <SectionHead eyebrow="Curated Journeys" title={`Trips with ${firstName}`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/marketplace/trip/${t.slug ?? t.id}`)}
                    className="group text-left rounded-2xl bg-white border border-[#E5DFC6] overflow-hidden hover:border-[#C7A962]/60 hover:shadow-md transition flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-[#F6F0E4] overflow-hidden">
                      {t.cover_image_url ? (
                        <img
                          src={t.cover_image_url}
                          alt={t.title ?? "Trip"}
                          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#E5DFC6]" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-secondary text-lg text-[#0a2225] leading-snug line-clamp-2">
                        {t.title || "Untitled journey"}
                      </h3>
                      {t.destination && (
                        <p className="text-xs text-[#6B7280] mt-1">{t.destination}</p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        {t.price_per_person != null ? (
                          <span className="text-sm text-[#0a2225]">
                            <span className="text-[#6B7280] text-xs">from </span>
                            ${Number(t.price_per_person).toFixed(0)}
                            <span className="text-[#6B7280] text-xs"> / person</span>
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-[#0c4d47] font-medium">
                          View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Recent TikTok Videos ─── */}
        {creator.featured_tiktok_videos && creator.featured_tiktok_videos.length > 0 && (
          <div className="bg-[#FDF9F0]">
            <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
              <TikTokCarousel urls={creator.featured_tiktok_videos} />
            </div>
          </div>
        )}

        {/* ─── Itinerary Guides ─── */}
        {guides.length > 0 && (
          <div className="bg-[#FDF9F0]">
            <div id="guides" className="mx-auto max-w-5xl px-4 py-12 md:py-16 scroll-mt-24">
              <SectionHead eyebrow="Itinerary Guides" title={`Guides by ${firstName}`} />
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
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
            <CreatorServicesSection
              creatorId={creator.id}
              isOwnProfile={effIsOwn}
              creatorTier={creator.creator_tier}
            />
          </div>
        </div>

        {/* ─── 4. REVIEWS — Proof Layer ─── */}
        {(reviewCount > 0 || (!authLoading && user && user.id !== creator.id)) && (
          <div className="bg-white">
            <div id="reviews" className="mx-auto max-w-5xl px-4 py-12 md:py-16 scroll-mt-24">
              <div className="flex items-center justify-between mb-8">
                <SectionHead eyebrow="Reviews" title="What travelers say" />
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
        {/* Rendered only when there's real content — a section header with
            nothing under it (or with chips repeated from the hero) is the
            fastest way to look unfinished. */}
        {Boolean(bio || (creatorData?.certifications?.length ?? 0) > 0 || creator.location) && (
          <div className="bg-[#FDF9F0]">
            <div id="about" className="mx-auto max-w-5xl px-4 py-12 md:py-16 scroll-mt-24">
              <SectionHead eyebrow="About" title="The philosophy" />
              <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-12 items-start">
                <CreatorAboutSection
                  bio={bio}
                  certifications={creatorData?.certifications ?? null}
                />
                {/* Facts card — every row conditional on real data */}
                <div
                  className="rounded-[20px] border border-[#E5DFC6] bg-white p-6 text-[13.5px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {[
                    creator.location && { k: "Home base", v: creator.location },
                    positioningTitle && positioningTitle !== "Travel Designer" && { k: "Specialty", v: positioningTitle },
                    creator.created_at && { k: "Member since", v: String(new Date(creator.created_at).getFullYear()) },
                    responseTimeText && { k: "Responds in", v: responseTimeText },
                  ]
                    .filter(Boolean)
                    .map((f: any, i, arr) => (
                      <div
                        key={f.k}
                        className={`flex items-center justify-between py-3 text-[#6B7280] ${
                          i < arr.length - 1 ? "border-b border-[#f7f3ea]" : ""
                        }`}
                      >
                        <span>{f.k}</span>
                        <span className="font-semibold text-[#0a2225]">{f.v}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 6. FINAL CTA ─── */}
        {!effIsOwn && (
          <div className="bg-[#0c4d47]">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-20 text-center">
              <h2 className="font-secondary text-[28px] md:text-[32px] font-semibold text-white mb-3">
                Start Your Journey With {firstName}
              </h2>
              <p className="font-primary text-lg text-[#cfe0dc] mb-8 max-w-md mx-auto">
                Share your travel style and get a personalized itinerary crafted just for you.
              </p>
              <Button
                onClick={previewAsTraveler ? handlePreviewOnly : handleRequestTrip}
                className="h-12 rounded-full bg-[#C7A962] px-10 text-sm font-semibold text-[#0a2225] shadow-sm hover:bg-[#b6984f]"
              >
                Request a Service
              </Button>
              <p className="mt-4 font-sans text-xs text-[#9fc0ba]" style={{ fontFamily: "Inter, sans-serif" }}>
                No commitment · Delivered in 24–48 hours
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Owner-only cover upload — reuses the previously orphaned CoverPhotoModal,
          which writes profiles.cover_image_url (already exposed via creator_directory). */}
      {effIsOwn && (
        <CoverPhotoModal
          open={coverModalOpen}
          onOpenChange={setCoverModalOpen}
          userId={creator.id}
          currentCoverUrl={(creator as any).cover_image_url || null}
          onSuccess={fetchProfile}
        />
      )}
    </>
  );
}
