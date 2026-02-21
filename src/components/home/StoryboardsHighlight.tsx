// src/components/home/StoryboardsHighlight.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedTrip {
  id: string;
  slug: string;
  title: string;
  destination: string;
  duration_nights: number;
  cover_image_url: string;
  price_per_person: number;
  currency: string;
  creator_type: string;
  highlights: string[] | null;
}

export function StoryboardsHighlight() {
  const { t } = useTranslation();

  const { data: featuredTrips, isLoading } = useQuery({
    queryKey: ['featured-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaged_trips')
        .select('id, slug, title, destination, duration_nights, cover_image_url, price_per_person, currency, creator_type, highlights')
        .eq('is_featured', true)
        .eq('status', 'published')
        .limit(6);
      
      if (error) throw error;
      return data as FeaturedTrip[];
    }
  });

  // Derive vibe tags from highlights or use defaults
  const getVibeTags = (trip: FeaturedTrip): string[] => {
    if (trip.highlights && trip.highlights.length > 0) {
      return trip.highlights.slice(0, 3);
    }
    return ['Curated', 'Luxury'];
  };

  const getCuratorLabel = (creatorType: string): string => {
    return creatorType === 'creator' 
      ? t('home.storyboards.creatorAgentCollab')
      : t('home.storyboards.agentCurated');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="bg-white border-y border-[#E5DFC6]/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-left mb-10 md:mb-12">
          <h2 className="font-secondary text-[26px] leading-snug text-[#0a2225] md:text-[31px] lg:text-[36px] mb-4">
            {t('home.storyboards.title')}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-[#4a4a4a] md:text-base">
            {t('home.storyboards.description')}
          </p>
        </div>

        {/* Featured trip tiles grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-10">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl md:rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[4/5] md:aspect-[3/4] w-full" />
                <div className="p-2.5 md:p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : featuredTrips?.map((trip) => (
            <Link
              key={trip.id}
              to={`/marketplace/trip/${trip.slug}`}
              className="group overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-sm border border-[#E5DFC6] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              {/* Image with gradient and badges */}
              <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
                <img
                  src={trip.cover_image_url}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Duration badge - top right */}
                <Badge className="absolute top-2 right-2 md:top-3 md:right-3 rounded-full text-[9px] md:text-[10px] bg-white/95 text-[#0a2225] border-0 shadow-sm px-2 py-0.5">
                  <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                  {trip.duration_nights} nights
                </Badge>

                {/* Price badge - top left */}
                <Badge className="absolute top-2 left-2 md:top-3 md:left-3 rounded-full text-[10px] md:text-[11px] bg-[#0c4d47] text-white border-0 shadow-sm px-2.5 py-1 font-medium">
                  From {formatPrice(trip.price_per_person, trip.currency)}
                </Badge>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <h3 className="font-secondary text-sm md:text-base text-white font-medium leading-tight mb-1">
                    {trip.title}
                  </h3>
                  <p className="flex items-center gap-1 text-[10px] md:text-xs text-white/90">
                    <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </p>
                </div>
              </div>
              
              {/* Content below image */}
              <div className="p-2.5 md:p-4 space-y-2">
                {/* Vibe tags */}
                <div className="flex flex-wrap gap-1">
                  {getVibeTags(trip).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="rounded-full text-[8px] md:text-[9px] px-1.5 md:px-2 py-0 border-[#E5DFC6] text-[#6B7280] bg-[#FDF9F0]/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Curator credit */}
                <p className="text-[9px] md:text-[10px] text-[#8D8D8D]">{getCuratorLabel(trip.creator_type)}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] shadow-sm"
          >
            <Link to="/marketplace">
              {t('home.storyboards.exploreAll')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
