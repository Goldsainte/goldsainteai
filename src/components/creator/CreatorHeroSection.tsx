import { BadgeCheck, Star, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import wordmark from "@/assets/wordmark-green.svg";

interface CreatorHeroSectionProps {
  name: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  title: string; // positioning e.g. "Luxury Europe Travel Designer"
  location: string | null;
  avgRating: number | null;
  reviewCount: number;
  tripsCompleted: number | null;
  clientsServed: number | null;
  isVerified?: boolean;
  isOwnProfile?: boolean;
  targetUserId?: string;
  onRequestTrip: () => void;
  fallbackCoverUrl?: string | null;
}

export function CreatorHeroSection({
  name,
  avatarUrl,
  coverImageUrl,
  title,
  location,
  avgRating,
  reviewCount,
  tripsCompleted,
  clientsServed,
  isVerified = true,
  isOwnProfile,
  targetUserId,
  onRequestTrip,
  fallbackCoverUrl,
}: CreatorHeroSectionProps) {
  const heroImage = coverImageUrl || fallbackCoverUrl || null;
  const hasStats = (tripsCompleted ?? 0) > 0 || (clientsServed ?? 0) > 0;
  const isGenericTitle = !title || title === "Travel Designer";
  const showCompleteNudge = Boolean(isOwnProfile && (isGenericTitle || !location));

  return (
    <section className="relative w-full">
      {/* Full-width destination hero image (or branded fallback) */}
      <div className="relative h-[360px] md:h-[520px] w-full overflow-hidden">
        {heroImage ? (
          <>
            <img
              src={heroImage}
              alt={`${name}'s destination`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE0] via-[#F7F3EA] to-[#EDE4CC]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
              <img src={wordmark} alt="" className="w-[60%] max-w-[420px]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#F7F3EA] via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* Floating profile card overlay */}
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="relative -mt-24 md:-mt-32 bg-white rounded-2xl border border-[#E5DFC6] shadow-lg p-6 md:p-8 max-w-lg">
          {/* Avatar + Name */}
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full ring-[3px] ring-[#C7A962] overflow-hidden bg-[#E5DFC6]">
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={name}
                  className="h-full w-full object-cover"
                loading="lazy"/>
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <BadgeCheck className="h-5 w-5 text-[#C7A962]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-secondary text-xl md:text-2xl text-[#0a2225] leading-tight truncate">
                {name}
              </h1>
              <p className="text-sm text-[#6B7280] mt-0.5">{title}</p>
              {location && (
                <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </p>
              )}

              {/* Rating + Stats */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {avgRating != null ? (
                  <span className="flex items-center gap-1 text-sm text-[#0a2225] font-medium">
                    <Star className="h-3.5 w-3.5 fill-[#C7A962] text-[#C7A962]" />
                    {avgRating.toFixed(1)}
                    <span className="text-[#9CA3AF] font-normal">({reviewCount})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7A7151]">
                    <Sparkles className="h-3 w-3" />
                    New designer
                  </span>
                )}
                {hasStats && (
                  <>
                    {(tripsCompleted ?? 0) > 0 && (
                      <span className="text-xs text-[#6B7280]">
                        <span className="font-semibold text-[#0a2225]">{tripsCompleted}</span> trips
                      </span>
                    )}
                    {(clientsServed ?? 0) > 0 && (
                      <span className="text-xs text-[#6B7280]">
                        <span className="font-semibold text-[#0a2225]">{clientsServed}</span> clients
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={onRequestTrip}
              className="font-primary bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11 text-sm font-medium shadow-sm flex-1 md:flex-none"
            >
              Request a Trip
            </Button>
            {!isOwnProfile && targetUserId && (
              <FollowButton targetUserId={targetUserId} />
            )}
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
    </section>
  );
}
