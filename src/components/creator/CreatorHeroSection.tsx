import { BadgeCheck, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";

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
  const heroImage = coverImageUrl || fallbackCoverUrl || "/placeholder.svg";
  const hasStats = (tripsCompleted ?? 0) > 0 || (clientsServed ?? 0) > 0;

  return (
    <section className="relative w-full">
      {/* Full-width destination hero image */}
      <div className="relative h-[420px] md:h-[520px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt={`${name}'s destination`}
          className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"/>
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Floating profile card overlay */}
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="relative -mt-32 md:-mt-36 bg-white rounded-2xl border border-[#E5DFC6] shadow-lg p-6 md:p-8 max-w-lg">
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
                {avgRating != null && (
                  <span className="flex items-center gap-1 text-sm text-[#0a2225] font-medium">
                    <Star className="h-3.5 w-3.5 fill-[#C7A962] text-[#C7A962]" />
                    {avgRating.toFixed(1)}
                    <span className="text-[#9CA3AF] font-normal">({reviewCount})</span>
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
              className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11 text-sm font-medium shadow-sm flex-1 md:flex-none"
            >
              Request a Trip
            </Button>
            {!isOwnProfile && targetUserId && (
              <FollowButton targetUserId={targetUserId} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
