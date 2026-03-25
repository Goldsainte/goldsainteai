import { Star, MapPin, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileHeroStat {
  label: string;
  value: string;
}

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
  stats?: ProfileHeroStat[];
  rating?: number | null;
  reviewCount?: number | null;
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
  stats = [],
  rating,
  reviewCount,
  className,
}: ProfileHeroProps) {
  const defaultCover =
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600&q=80";

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-none md:rounded-b-3xl">
        <img
          src={coverImage || defaultCover}
          alt={name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Rating badge — top right */}
        {rating != null && rating > 0 && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-lg">
            <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
            <span className="font-semibold text-[#0a2225]">
              {rating.toFixed(1)}
            </span>
            {reviewCount != null && (
              <span className="text-xs text-[#6B7280]">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Stat badges — top right (used for creators) */}
        {stats.length > 0 && !rating && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-lg"
              >
                <span className="text-sm font-semibold text-[#0a2225]">
                  {s.value}
                </span>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end gap-4 md:gap-6">
              {/* Avatar */}
              <div className="h-16 w-16 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-xl">
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

              {/* Name, badge, tagline */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-secondary text-2xl md:text-4xl font-bold text-white truncate">
                    {name}
                  </h1>
                  {isVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-[#C7B892] shrink-0 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#0a2225] text-white text-xs">
                          Verified by Goldsainte
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {serviceLine && (
                  <p className="text-xs md:text-sm text-white/70 tracking-wide truncate mb-0.5">
                    {serviceLine}
                  </p>
                )}
                {tagline && (
                  <p className="text-sm md:text-base text-white/80 italic truncate mb-1">
                    {tagline}
                  </p>
                )}
                {isVerified && verifiedLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C7B892]/90 px-3 py-1 text-xs font-medium text-[#0a2225] uppercase tracking-wide">
                    {verifiedLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Pills row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-xs text-[#0a2225]">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
              {pills.slice(0, 5).map((pill) => (
                <span
                  key={pill}
                  className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-xs text-white"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
