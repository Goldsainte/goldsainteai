import { Star, MapPin, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandHeroProps {
  name: string;
  tagline?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  brandType?: string | null;
  regions?: string[] | null;
  styleTags?: string[] | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  className?: string;
}

export function BrandHero({
  name,
  tagline,
  coverImageUrl,
  logoUrl,
  brandType,
  regions,
  styleTags,
  averageRating,
  reviewCount,
  className,
}: BrandHeroProps) {
  const defaultCover = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80";

  return (
    <div className={cn("relative w-full", className)}>
      {/* Hero Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-none md:rounded-b-3xl">
        <img
          src={coverImageUrl || defaultCover}
          alt={name}
          className="h-full w-full object-cover"
        loading="lazy"/>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Rating badge - top right */}
        {averageRating && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-lg">
            <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
            <span className="font-semibold text-[#0a2225]">{averageRating.toFixed(1)}</span>
            {reviewCount !== null && reviewCount !== undefined && (
              <span className="text-xs text-[#6B7280]">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Content overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end gap-4 md:gap-6">
              {/* Logo */}
              <div className="h-16 w-16 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="h-full w-full object-cover"
                  loading="lazy"/>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-xl md:text-2xl font-bold text-[#0a2225]">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name and info */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-secondary text-2xl md:text-4xl font-bold text-white truncate">
                    {name}
                  </h1>
                  <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-[#C7B892] shrink-0" />
                </div>
                {tagline && (
                  <p className="text-sm md:text-base text-white/90 line-clamp-2 max-w-2xl">
                    {tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Pills row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {brandType && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7B892]/90 px-3 py-1.5 text-xs font-medium text-[#0a2225] uppercase tracking-wide">
                  {brandType}
                </span>
              )}
              {regions && regions.slice(0, 3).map((region) => (
                <span
                  key={region}
                  className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-xs text-[#0a2225]"
                >
                  <MapPin className="h-3 w-3" />
                  {region}
                </span>
              ))}
              {styleTags && styleTags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-xs text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
