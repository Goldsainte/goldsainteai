import { Sparkles } from "lucide-react";

const SkeletonCard = ({ delay }: { delay: number }) => (
  <div 
    className="bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-up"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
  >
    {/* Image skeleton with shimmer */}
    <div className="relative h-52 bg-[#F6F0E4] overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer"
      />
      {/* Duration badge skeleton */}
      <div className="absolute top-3 right-3 w-20 h-5 rounded-full bg-white/60" />
    </div>

    {/* Content skeleton */}
    <div className="p-5 space-y-3">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-[#F6F0E4] rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" />
        </div>
        {/* Location */}
        <div className="h-3 w-1/3 bg-[#F6F0E4] rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: '100ms' }} />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-[#F6F0E4] rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: '200ms' }} />
        </div>
        <div className="h-3 w-2/3 bg-[#F6F0E4] rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-5 w-14 bg-[#F6F0E4] rounded-full relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: `${400 + i * 100}ms` }} />
          </div>
        ))}
      </div>

      {/* CTA area */}
      <div className="pt-4 flex justify-between items-center border-t border-border/30">
        <div className="h-8 w-32 bg-[#F6F0E4] rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: '700ms' }} />
        </div>
        <div className="h-8 w-24 bg-[#F6F0E4] rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C7A962]/10 to-transparent animate-shimmer" style={{ animationDelay: '800ms' }} />
        </div>
      </div>
    </div>
  </div>
);

export function CollectionsLoadingSkeleton() {
  return (
    <div className="space-y-10">
      {/* Elegant loading header */}
      <div className="flex flex-col items-center justify-center py-8 gap-5">
        {/* Animated gold sparkle */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#C7A962]/20 rounded-full blur-xl animate-gold-pulse" />
          <Sparkles className="w-10 h-10 text-[#C7A962] animate-gold-pulse relative z-10" />
        </div>
        
        {/* Elegant messaging */}
        <div className="text-center space-y-2 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="font-secondary text-lg text-[#0a2225]">
            Studying your travel signature…
          </p>
          <p className="text-sm text-muted-foreground">
            Curating itineraries that match your style
          </p>
        </div>

        {/* Animated progress line */}
        <div className="w-48 h-0.5 bg-[#E5DFC6] rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-[#C7A962] to-[#BFAD72] animate-progress-line rounded-full" />
        </div>
      </div>

      {/* Skeleton cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}
