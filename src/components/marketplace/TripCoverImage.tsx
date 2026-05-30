import { useState } from "react";
import defaultTripImage from "@/assets/luxury-destinations.jpg";

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
  const resolvedSrc = !src || failed ? defaultTripImage : src;
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
};
