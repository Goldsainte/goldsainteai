import { useState } from "react";
import defaultTripImage from "@/assets/luxury-destinations.jpg";
import { supabaseImageUrl, supabaseSrcSet } from "@/lib/images";

interface TripCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export const TripCoverImage = ({
  src,
  alt,
  className,
  loading = "lazy",
}: TripCoverImageProps) => {
  const [failed, setFailed] = useState(false);
  const raw = !src || failed ? defaultTripImage : src;
  return (
    <img
      src={supabaseImageUrl(raw, { width: 640, quality: 65 })}
      srcSet={supabaseSrcSet(raw, [480, 640, 960], { quality: 65 })}
      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
};
