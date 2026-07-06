// src/components/marketplace/PartnerToursSection.tsx
//
// Partner (Viator) tours rendered in EXACTLY the LiveTripCard dimensions and
// typography so the marketplace stays visually uniform — but honestly scoped:
//   • every card carries a "Partner · Viator" badge
//   • cards link OUT to Viator (booking happens there, not via our Stripe)
//   • a disclosure line states these listings are not Goldsainte-reviewed
// Ratings/review counts shown are Viator's real data, attributed by the badge.
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const inter = { fontFamily: "Inter, sans-serif" } as const;

interface PartnerTour {
  productCode: string;
  title: string;
  shortDescription?: string;
  thumbnailURL?: string;
  destination?: string;
  rating?: number;
  reviewCount?: number;
  fromPrice?: number;
  currency?: string;
  productUrl?: string | null;
}

interface PartnerToursSectionProps {
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "top-rated" | "price-low" | "price-high";
  /** Viator results carry no duration data, so this filter can't be applied
      to partner inventory — when set, the section says so instead of
      silently ignoring it. */
  durationBucket?: "1-3" | "4-6" | "7+";
  /** Reports how many partner tours rendered (0 on empty/error) so the tab
      count and results line can include them. */
  onCountChange?: (n: number) => void;
}

// Show cents when the from-price isn't whole ($49.27 stays $49.27 —
// rounding a from-price DOWN would advertise a price nobody can book at).
const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);

export function PartnerToursSection({ destination, minPrice, maxPrice, sortBy, durationBucket, onCountChange }: PartnerToursSectionProps) {
  const dest = destination?.trim() || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["viator-partner-tours", dest || "top-rated"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("viator-search", {
        body: dest ? { location: dest } : { q: "top rated tours" },
      });
      if (error) throw error;
      return (data?.results ?? []) as PartnerTour[];
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Viator's productUrl is the affiliate deep link to the EXACT product —
  // commission depends on it. Normalize to absolute https so a scheme-less
  // or relative URL can never fall back to a generic page.
  const absolutize = (u?: string | null): string | null => {
    if (!u) return null;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (u.startsWith("//")) return "https:" + u;
    return "https://www.viator.com" + (u.startsWith("/") ? "" : "/") + u;
  };

  // Only tours we can actually send people to (affiliate URL present),
  // honoring the marketplace price filter, in the requested sort order.
  const durationFilterActive = !!durationBucket;
  const tours = durationFilterActive
    ? []
    : (data ?? [])
        .map((t) => ({ ...t, productUrl: absolutize(t.productUrl) }))
        .filter((t) => t.productUrl && t.title && t.thumbnailURL)
        .filter((t) => {
          if (typeof t.fromPrice !== "number") return true;
          if (typeof minPrice === "number" && minPrice > 0 && t.fromPrice < minPrice) return false;
          if (typeof maxPrice === "number" && maxPrice < 10000 && t.fromPrice > maxPrice) return false;
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "price-low") return (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity);
          if (sortBy === "price-high") return (b.fromPrice ?? 0) - (a.fromPrice ?? 0);
          if (sortBy === "top-rated") return (b.rating ?? 0) - (a.rating ?? 0);
          return 0; // "newest" is meaningless for partner inventory — keep Viator relevance
        });

  useEffect(() => {
    if (!isLoading) onCountChange?.(isError ? 0 : tours.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, tours.length]);

  if (isError) return null;

  if (durationFilterActive) {
    return (
      <p className="mt-2 text-[12.5px] text-[#6B7280]" style={inter}>
        Partner tours from Viator can't be filtered by duration — clear the
        duration filter to see them.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-2">
        <Skeleton className="mb-4 h-6 w-56 rounded-md" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl sm:aspect-[4/3]" />
          ))}
        </div>
      </div>
    );
  }

  if (tours.length === 0) return null;

  return (
    <section className="mt-2" aria-label="Partner tours">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-secondary text-[20px] text-[#0a2225]">
          {dest ? `Partner tours in ${dest}` : "Top-rated partner tours"}
        </h3>
      </div>
      {/* Honesty disclosure — these are outside the trust claims in the header. */}
      <p className="mb-4 text-[12px] text-[#6B7280]" style={inter}>
        Provided and booked on Viator. Partner listings are not reviewed by the
        Goldsainte team.
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tours.map((t) => (
          <a
            key={t.productCode}
            href={t.productUrl!}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`${t.title} — opens on Viator`}
            className="group block"
          >
            {/* Image — identical treatment to LiveTripCard */}
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_6px_16px_rgba(10,34,37,0.12)] sm:shadow-none sm:transition-shadow sm:duration-300 sm:group-hover:shadow-[0_6px_16px_rgba(10,34,37,0.12)]">
              <img
                src={t.thumbnailURL}
                alt={t.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
              />
              <span
                className="absolute left-3 top-3 rounded-full bg-[#0a2225]/75 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#FDF9F0] backdrop-blur-sm"
                style={inter}
              >
                Partner · Viator
              </span>
            </div>

            {/* Body — identical responsive treatment to LiveTripCard */}
            <div className="relative px-0.5 pt-2">
              <p className="truncate text-[10.5px] uppercase tracking-[0.13em] text-[#8a7136]" style={inter}>
                {t.destination || "\u00A0"}
              </p>
              <h3 className="mt-1 line-clamp-1 font-secondary text-[15px] font-medium leading-[1.35] text-[#0a2225]">
                {t.title}
              </h3>
              <div className="mt-1 flex h-[22px] items-center gap-2 overflow-hidden text-[12px] text-[#6B7280]" style={inter}>
                {typeof t.rating === "number" && t.rating > 0 ? (
                  <span className="flex items-center gap-1 text-[#0a2225]">
                    <Star className="h-3 w-3 fill-[#C7A962] text-[#C7A962]" />
                    <span className="font-medium">{t.rating.toFixed(1)}</span>
                    {typeof t.reviewCount === "number" && t.reviewCount > 0 && (
                      <span className="text-[#6B7280]">({t.reviewCount.toLocaleString()})</span>
                    )}
                  </span>
                ) : (
                  <span>Viator experience</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#E5DFC6]/60 pt-2">
                <span className="flex items-center gap-1 text-[11px] text-[#6B7280]" style={inter}>
                  Book on Viator <ExternalLink className="h-3 w-3" />
                </span>
                {typeof t.fromPrice === "number" && t.fromPrice > 0 && (
                  <p className="text-[15px] font-semibold text-[#0a2225]" style={inter}>
                    <span className="mr-1 text-[11px] font-normal text-[#6B7280]">From</span>
                    {formatPrice(t.fromPrice, t.currency || "USD")}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
