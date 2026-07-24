import { useState } from "react";
import { BadgeCheck, Star, Sparkles, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import { ProfilePhotoModal } from "@/components/ProfilePhotoModal";
import { TierBadge, type CreatorTier } from "@/components/creator/TierBadge";

interface CreatorHeroSectionProps {
  name: string;
  avatarUrl: string | null;
  title: string; // positioning e.g. "Adventure"
  location: string | null;
  avgRating: number | null;
  reviewCount: number;
  tripsCompleted: number | null;
  clientsServed: number | null;
  specialties?: string[];
  responseTimeText?: string | null;
  /** Real value from profiles.is_verified — do not hardcode true. */
  isVerified?: boolean;
  isOwnProfile?: boolean;
  targetUserId?: string;
  onRequestTrip: () => void;
  /** When provided (and not own profile), renders a Message button. */
  onMessage?: () => void;
  /** Required when isOwnProfile is true. */
  profileUserId?: string;
  /** Called after a successful avatar/cover upload so the parent can refetch. */
  onProfileUpdated?: () => void;
  /** ISO date string (e.g. profiles.created_at) — shown as "Member since {year}". */
  memberSince?: string | null;
  followerCount?: number | null;
  /** Real value from profiles.creator_tier. */
  creatorTier?: CreatorTier | string | null;
  /** profiles.cover_image_url — the full-bleed hero band. Null → brand gradient. */
  coverImageUrl?: string | null;
  /** Count of this creator's published guides — shown in the meta strip when > 0. */
  guideCount?: number;
  /** Owner-only: opens the cover photo modal (owned by the page for refetch). */
  onEditCover?: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/* Big-tech profile hero: full-bleed cover photo with the avatar overlapping
   its bottom edge, a consolidated identity band (name · badges · positioning ·
   inline earned-stats meta strip · chips), and right-aligned actions.
   Stats stay earned-only per the honesty policy — the meta strip simply has
   fewer separators on a brand-new profile, which still reads intentional. */
export function CreatorHeroSection({
  name,
  avatarUrl,
  title,
  location,
  avgRating,
  reviewCount,
  specialties = [],
  responseTimeText,
  isVerified = false,
  isOwnProfile = false,
  targetUserId,
  onRequestTrip,
  onMessage,
  profileUserId,
  onProfileUpdated,
  memberSince,
  followerCount,
  creatorTier,
  coverImageUrl,
  guideCount = 0,
  onEditCover,
}: CreatorHeroSectionProps) {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const canEdit = isOwnProfile && !!profileUserId;
  const memberYear = memberSince ? new Date(memberSince).getFullYear() : null;
  const showCompleteNudge = isOwnProfile && (!title || title === "Travel Designer") && !location;

  // Inline meta entries — each only when real.
  const meta: React.ReactNode[] = [];
  if (memberYear) meta.push(<span key="m">Member since <b className="font-semibold text-[#0a2225]">{memberYear}</b></span>);
  if (guideCount > 0) meta.push(<span key="g"><b className="font-semibold text-[#0a2225]">{guideCount}</b> guide{guideCount === 1 ? "" : "s"}</span>);
  if (responseTimeText) meta.push(<span key="r">Responds in <b className="font-semibold text-[#0a2225]">{responseTimeText}</b></span>);
  if (followerCount && followerCount > 0) meta.push(<span key="f"><b className="font-semibold text-[#0a2225]">{formatCount(followerCount)}</b> followers</span>);
  if (location) meta.push(<span key="l">{location}</span>);

  return (
    <section>
      {/* ── Cover band ── */}
      <div
        className={`relative h-[220px] md:h-[300px] ${
          coverImageUrl ? "" : "bg-gradient-to-br from-[#0c4d47] via-[#0a3a35] to-[#0a2225]"
        }`}
        style={
          coverImageUrl
            ? { backgroundImage: `linear-gradient(to bottom, rgba(10,34,37,0.05), rgba(10,34,37,0.45)), url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center 40%" }
            : undefined
        }
      >
        {!coverImageUrl && (
          /* Brand-gradient fallback gets a quiet gold sheen so it never reads as a missing image */
          <div className="absolute inset-0 opacity-[0.14]" style={{ background: "radial-gradient(ellipse at 30% 120%, #C7A962 0%, transparent 55%)" }} />
        )}
        {canEdit && onEditCover && (
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-5xl px-4 pb-5 flex justify-end">
              <button
                type="button"
                onClick={onEditCover}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-[#0a2225]/55 px-3.5 py-2 text-xs text-white backdrop-blur-sm hover:bg-[#0a2225]/75 transition"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {coverImageUrl ? "Change cover" : "Add a cover photo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Identity band overlapping the cover ── */}
      <div className="mx-auto max-w-5xl px-4">
        {/* Only the AVATAR overlaps the cover — the text column starts below
            the image edge so the name never sits on a busy photo. */}
        <div className="relative flex flex-wrap items-start gap-5 md:gap-7">
          {/* Avatar */}
          <div className="relative shrink-0 -mt-16 md:-mt-[72px]">
            <div className="h-32 w-32 md:h-36 md:w-36 overflow-hidden rounded-[28px] border-[5px] border-[#FDF9F0] bg-[#F6F0E4] shadow-[0_8px_30px_rgba(10,34,37,0.18)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-secondary text-4xl text-[#C7A962]">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
                <BadgeCheck className="h-5 w-5 text-[#C7A962]" />
              </div>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                aria-label="Edit profile photo"
                className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0a2225] text-white transition-colors hover:bg-[#0c4d47]"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Name · badges · positioning · meta · chips */}
          <div className="min-w-[260px] flex-1 pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-secondary text-3xl md:text-[40px] font-semibold leading-tight text-[#0a2225]">
                {name}
              </h1>
              {isVerified && (
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#0c4d47] text-white">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </span>
              )}
              {avgRating != null ? (
                <span className="flex items-center gap-1 text-sm font-medium text-[#0a2225]">
                  <Star className="h-3.5 w-3.5 fill-[#C7A962] text-[#C7A962]" />
                  {avgRating.toFixed(1)}
                  <span className="font-normal text-[#9CA3AF]">({reviewCount})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6CF94] bg-gradient-to-r from-[#FBF4E2] to-[#F1E2BB] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8A7136]">
                  <Sparkles className="h-3 w-3" />
                  New designer
                </span>
              )}
            </div>

            {title && (
              <p className="mt-1.5 font-primary text-lg italic text-[#6B7280]">{title}</p>
            )}

            {meta.length > 0 && (
              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                {meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-[#D8CFAF]">·</span>}
                    {m}
                  </span>
                ))}
              </p>
            )}

            {specialties.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {specialties.slice(0, 6).map((s) => (
                  <span key={s} className="rounded-full border border-[#E5DFC6] bg-white px-4 py-1.5 text-[15px] capitalize text-[#4a4a4a]">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {showCompleteNudge && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E5DFC6] bg-white px-3.5 py-2.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C7A962]" />
                <p className="font-primary text-xs leading-relaxed text-[#6B7280]">
                  Add your specialty and home base to help travelers find you.
                </p>
              </div>
            )}
          </div>

          {/* Actions — three equal pills on one row */}
          <div className="flex w-full flex-wrap items-center gap-2.5 pt-4 md:w-auto">
            <Button
              onClick={onRequestTrip}
              className="h-12 flex-1 rounded-full bg-[#0c4d47] px-7 text-sm font-medium text-white shadow-sm hover:bg-[#0a3d39] md:flex-none"
            >
              Request a Service
            </Button>
            {!isOwnProfile && onMessage && (
              <Button
                onClick={onMessage}
                variant="outline"
                className="h-12 flex-1 rounded-full border-[#E5DFC6] bg-white px-6 text-sm font-medium text-[#0a2225] hover:bg-[#f7f3ea] md:flex-none"
              >
                Message
              </Button>
            )}
            {!isOwnProfile && targetUserId && (
              <Button
                onClick={() => setTipOpen(true)}
                variant="outline"
                className="h-12 flex-1 rounded-full border-[#C7A962] bg-white px-6 text-sm font-medium text-[#8a7136] hover:bg-[#FDF9F0] md:flex-none"
              >
                <Heart className="mr-1.5 h-4 w-4" />
                Tip
              </Button>
            )}
            {!isOwnProfile && targetUserId && (
              <FollowButton
                targetUserId={targetUserId}
                className="h-12 flex-1 rounded-full border-[#E5DFC6] bg-white px-6 text-sm font-medium text-[#0a2225] hover:bg-[#f7f3ea] md:flex-none"
              />
            )}
          </div>
        </div>
      </div>

      {canEdit && profileUserId && (
        <ProfilePhotoModal
          open={avatarModalOpen}
          onOpenChange={setAvatarModalOpen}
          userId={profileUserId}
          currentAvatarUrl={avatarUrl}
          onSuccess={() => onProfileUpdated?.()}
        />
      )}
          {!isOwnProfile && targetUserId && (
        <TipModal
          open={tipOpen}
          onOpenChange={setTipOpen}
          recipientId={targetUserId}
          recipientName={(name || "this creator").split(" ")[0]}
        />
      )}
    </section>
  );
}
