import { useState } from "react";
import { BadgeCheck, Star, MapPin, Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import { ProfilePhotoModal } from "@/components/ProfilePhotoModal";
import { TierBadge, type CreatorTier } from "@/components/creator/TierBadge";

interface CreatorHeroSectionProps {
  name: string;
  avatarUrl: string | null;
  title: string; // positioning e.g. "Luxury Europe Travel Designer"
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
  /** When provided (and not own profile), renders a Message button that opens
   *  a direct-message composer. */
  onMessage?: () => void;
  /** Required when isOwnProfile is true — lets the edit controls know whose row to update. */
  profileUserId?: string;
  /** Called after a successful avatar upload so the parent can refetch. */
  onProfileUpdated?: () => void;
  /** ISO date string (e.g. profiles.created_at) — shown as "Member since {year}". */
  memberSince?: string | null;
  followerCount?: number | null;
  /** Real value from profiles.creator_tier — renders the actual Bronze/Silver/Gold/Platinum badge. */
  creatorTier?: CreatorTier | string | null;
}

export function CreatorHeroSection({
  name,
  avatarUrl,
  title,
  location,
  avgRating,
  reviewCount,
  tripsCompleted,
  specialties = [],
  responseTimeText,
  isVerified = false,
  isOwnProfile,
  targetUserId,
  onRequestTrip,
  onMessage,
  profileUserId,
  onProfileUpdated,
  memberSince,
  followerCount,
  creatorTier,
}: CreatorHeroSectionProps) {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const isGenericTitle = !title || title === "Travel Designer";
  const showCompleteNudge = Boolean(isOwnProfile && (isGenericTitle || !location));
  const memberSinceYear = memberSince ? new Date(memberSince).getFullYear() : null;
  const canEdit = Boolean(isOwnProfile && profileUserId);

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`);

  const stats = [
    { label: "Response time", value: responseTimeText || "New" },
    { label: "Trips designed", value: tripsCompleted != null ? `${tripsCompleted}` : "0" },
    { label: "Member since", value: memberSinceYear ? `${memberSinceYear}` : "—" },
    { label: "Followers", value: followerCount != null && followerCount > 0 ? formatCount(followerCount) : "—" },
  ];

  return (
    <section className="relative w-full">
      <div className="mx-auto max-w-5xl px-4 pt-8 md:pt-12">
        <div className="bg-white rounded-2xl border border-[#E5DFC6] shadow-lg p-6 md:p-8">
          {/* Top row: avatar + name/badges + actions */}
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl ring-2 ring-[#C7A962] overflow-hidden bg-[#E5DFC6]">
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <BadgeCheck className="h-5 w-5 text-[#C7A962]" />
                </div>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  aria-label="Edit profile photo"
                  className="absolute -bottom-1 -left-1 h-6 w-6 flex items-center justify-center rounded-full bg-[#0a2225] border-2 border-white text-white hover:bg-[#0c4d47] transition-colors"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-secondary text-xl md:text-2xl text-[#0a2225] leading-tight flex items-center gap-2">
                {name}
                {isVerified && <BadgeCheck className="h-4.5 w-4.5 text-[#0c4d47] shrink-0" />}
              </h1>
              <p className="text-sm text-[#6B7280] mt-0.5">{title}</p>
              {location && (
                <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {avgRating != null ? (
                  <span className="flex items-center gap-1 text-sm text-[#0a2225] font-medium">
                    <Star className="h-3.5 w-3.5 fill-[#C7A962] text-[#C7A962]" />
                    {avgRating.toFixed(1)}
                    <span className="text-[#9CA3AF] font-normal">({reviewCount})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FBF4E2] to-[#F1E2BB] border border-[#E6CF94] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A7136]">
                    <Sparkles className="h-3 w-3" />
                    New designer
                  </span>
                )}
                {creatorTier && <TierBadge tier={creatorTier} size="md" />}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={onRequestTrip}
                className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11 text-sm font-medium shadow-sm flex-1 md:flex-none"
              >
                Request a Trip
              </Button>
              {!isOwnProfile && onMessage && (
                <Button
                  onClick={onMessage}
                  variant="outline"
                  className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea] rounded-full px-6 h-11 text-sm font-medium flex-1 md:flex-none"
                >
                  Message
                </Button>
              )}
              {!isOwnProfile && targetUserId && (
                <FollowButton targetUserId={targetUserId} />
              )}
            </div>
          </div>

          {specialties.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {specialties.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[#E5DFC6] bg-[#FDF9F0] px-2.5 py-1 text-xs text-[#0a2225]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* At-a-glance stats — one consistent card treatment, not color-coded per stat */}
          <div className="mt-6 pt-6 border-t border-[#E5DFC6] grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] px-4 py-3.5">
                <p className="font-bold text-xl text-[#0a2225]">{s.value}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {showCompleteNudge && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] px-3.5 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C7A962] mt-0.5 shrink-0" />
              <p className="font-primary text-xs text-[#6B7280] leading-relaxed">
                Add your specialty and home base to help travelers find you.
              </p>
            </div>
          )}
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
    </section>
  );
}
