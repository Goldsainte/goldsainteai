import { useState } from 'react';

interface OptimizedFeedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedFeedImage = ({
  src,
  alt,
  className = '',
  priority = false
}: OptimizedFeedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Generate responsive image URLs with Supabase transformations
  const getSrcSet = (url: string) => {
    if (!url) return '';
    
    // Check if this is a Supabase Storage URL
    const isSupabaseUrl = url.includes('supabase');
    
    if (!isSupabaseUrl) {
      // For external URLs, just use the original
      return url;
    }
    
    // Generate multiple sizes for responsive loading
    const baseUrl = url.split('?')[0];
    return `
      ${baseUrl}?width=640&quality=75 640w,
      ${baseUrl}?width=1024&quality=75 1024w,
      ${baseUrl}?width=1920&quality=75 1920w
    `.trim();
  };
  
  const handleError = () => {
    setError(true);
  };
  
  if (error) {
    return (
      <div className={`bg-neutral-200 ${className} flex items-center justify-center`}>
        <span className="text-neutral-500 text-sm">Image unavailable</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Blur placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded" />
      )}
      
      <img
        src={src}
        srcSet={getSrcSet(src)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
};
