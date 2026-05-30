import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabaseImageUrl } from "@/lib/images";

type Mode = 'cover' | 'contain';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: "square" | "video" | "auto";
  mode?: Mode;
  priority?: boolean;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  aspectRatio = "auto",
  mode = "contain",
  priority = false,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading before visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Calculate aspect ratio for preventing CLS
  const ratio = width && height ? (height / width) * 100 : undefined;

  // Generate responsive sizes
  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  // Generate srcset using Supabase's server-side image transform endpoint
  const generateSrcSet = () => {
    if (!src.includes("/storage/v1/object/public/")) return undefined;
    return [400, 800, 1200, 1600]
      .map((w) => `${supabaseImageUrl(src, { width: w, quality: 70 })} ${w}w`)
      .join(", ");
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-[9/16]",
    auto: "",
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        !ratio && aspectClasses[aspectRatio],
        className
      )}
      style={ratio ? { paddingTop: `${ratio}%` } : undefined}
    >
      {/* Loading skeleton */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-sm text-muted-foreground">
            <p>Image unavailable</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !error && (
        <img
          src={supabaseImageUrl(src, { width: width ?? 1200, quality: 70 })}
          srcSet={generateSrcSet()}
          sizes={sizes}
          alt={alt}
          className={cn(
            ratio ? "absolute inset-0" : "",
            "h-full w-full transition-opacity duration-300",
            `object-${mode}`,
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          {...props}
        />
      )}
    </div>
  );
};
