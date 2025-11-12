import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Generate srcset for responsive images
  const generateSrcSet = (url: string) => {
    // For Supabase storage URLs, we can add transform parameters
    if (url.includes("supabase")) {
      return `
        ${url}?width=640 640w,
        ${url}?width=1024 1024w,
        ${url}?width=1920 1920w
      `.trim();
    }
    return url;
  };

  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <p className="text-sm text-muted-foreground">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-muted ${className}`}>
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
