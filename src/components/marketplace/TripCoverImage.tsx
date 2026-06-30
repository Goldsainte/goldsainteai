import { useState } from "react";
import defaultTripImage from "@/assets/luxury-destinations.jpg";
import { supabaseImageUrl, supabaseSrcSet } from "@/lib/images";

interface TripCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Base render width in px (cards are small — 600 covers 1× nicely). */
  width?: number;
  /** Responsive `sizes`; defaults to the base width. */
  sizes?: string;
  /** "high" for above-the-fold cards (first popular-trips row). */
  fetchPriority?: "high" | "low" | "auto";
}

export const TripCoverImage = ({
  src,
  alt,
  className,
  loading = "lazy",
  width = 600,
  sizes,
  fetchPriority,
}: TripCoverImageProps) => {
  const [failed, setFailed] = useState(false);

  // Serve a resized render-URL (≈60 KB) instead of the multi-MB original. On error
  // fall back to the un-transformed original (which we know serves), then the
  // bundled default. Non-Supabase URLs pass through the helpers untouched.
  const original = src || defaultTripImage;
  const displaySrc = failed ? original : supabaseImageUrl(original, { width }) || original;
  const srcSet = failed ? undefined : supabaseSrcSet(src, [width, width * 2]);

  return (
    <img
      src={displaySrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes ?? `${width}px` : undefined}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
};
