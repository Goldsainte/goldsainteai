import { Star, MapPin, BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileHeroProps {
  name: string;
  coverImage?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  verifiedLabel?: string;
  location?: string | null;
  tagline?: string | null;
  serviceLine?: string | null;
  pills?: string[];
  rating?: number | null;
  reviewCount?: number | null;
  followerDisplay?: string | null;
  responseTimeText?: string | null;
  targetUserId?: string;
  onRequestTrip?: () => void;
  className?: string;
}

export function ProfileHero({
  name,
  coverImage,
  avatarUrl,
  isVerified,
  verifiedLabel = "Verified",
  location,
  tagline,
  serviceLine,
  pills = [],
  rating,
  reviewCount,
  followerDisplay,
  responseTimeText,
  targetUserId,
  onRequestTrip,
  className,
}: ProfileHeroProps) {
  const defaultCover =
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80";

  return (
    <div className={cn("relative w-full", className)}>
      {/* Cover image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
        <img
          src={coverImage || defaultCover}
          alt={name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* Structured 3-column header below cover */}
      <div className="bg-white border-b border-[#E5DFC6]">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6 md:gap-8 items-start">
            {/* LEFT — Identity */}
            <div className="flex items-start gap-4">
              {/* Avatar — overlapping cover */}
              <div className="-mt-16 md:-mt-20 h-20 w-20 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-xl md:text-2xl font-bold text-[#0a2225]">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-secondary text-2xl md:text-3xl font-bold text-[#0a2225] truncate">
                    {name}
                  </h1>
                  {isVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-[#C7A962] shrink-0 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#0a2225] text-white text-xs">
                          Verified by Goldsainte
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {serviceLine && (
                  <p className="text-sm text-[#6B7280] truncate max-w-md">
                    {serviceLine}
                  </p>
                )}
                {tagline && (
                  <p className="text-sm text-[#0a2225]/70 italic mt-1 truncate max-w-lg">
                    "{tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* CENTER — Positioning */}
            <div className="hidden md:flex flex-col items-start gap-3 min-w-[200px]">
              {location && (
                <span className="inline-flex items-center gap-1.5 text-sm text-[#6B7280]">
                  <MapPin className="h-3.5 w-3.5 text-[#C7A962]" />
                  {location}
                </span>
              )}
              {pills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pills.slice(0, 5).map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-[#E5DFC6] bg-[#F5F0E0]/50 px-3 py-1 text-xs font-medium text-[#0a2225]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              )}
              {rating != null && rating > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="h-3.5 w-3.5 fill-[#C7A962] text-[#C7A962]" />
                  <span className="font-semibold text-[#0a2225]">{rating.toFixed(1)}</span>
                  {reviewCount != null && (
                    <span className="text-[#6B7280]">({reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Actions + Trust */}
            <div className="flex flex-col items-stretch gap-3 min-w-[200px]">
              <Button
                onClick={onRequestTrip}
                className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-11 font-medium"
              >
                Get Custom Itinerary
              </Button>

              <p className="text-center text-xs text-[#6B7280]">
                Takes 2 minutes · No commitment
              </p>

              <div className="flex flex-col gap-1.5 mt-1">
                {followerDisplay && (
                  <span className="text-xs text-[#6B7280]">
                    <span className="font-semibold text-[#0a2225]">{followerDisplay}</span> followers
                  </span>
                )}
                {responseTimeText && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <Clock className="h-3 w-3 text-[#C7A962]" />
                    {responseTimeText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-only: location, pills, rating */}
          <div className="md:hidden mt-4 flex flex-wrap items-center gap-2">
            {location && (
              <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                <MapPin className="h-3 w-3 text-[#C7A962]" />
                {location}
              </span>
            )}
            {pills.slice(0, 4).map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-[#E5DFC6] bg-[#F5F0E0]/50 px-2.5 py-1 text-[11px] text-[#0a2225]"
              >
                {pill}
              </span>
            ))}
            {rating != null && rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-[#C7A962] text-[#C7A962]" />
                <span className="font-semibold text-[#0a2225]">{rating.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
