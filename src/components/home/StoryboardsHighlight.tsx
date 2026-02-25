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
  creator_id: string;
  creator_type: string;
  highlights: string[] | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export function StoryboardsHighlight() {
  const { t } = useTranslation();

  const { data: featuredTrips, isLoading } = useQuery({
    queryKey: ['featured-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaged_trips')
        .select('id, slug, title, destination, duration_nights, cover_image_url, price_per_person, currency, creator_id, creator_type, highlights, profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, username)')
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
          <h2 className="font-secondary text-[26px] leading-snug text-[#0a2225] md:text-[31px] lg:text-[36px] mb-2">
            Curated Journeys by Creators &amp; Certified Agents
          </h2>
          <p className="text-base md:text-lg text-[#4a4a4a] italic mb-4">
            Book instantly. Personalize effortlessly.
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-[#4a4a4a] md:text-base">
            {t('home.storyboards.description')}
          </p>
        </div>

        {/* Featured trip tiles grid */}
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-10">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="aspect-[4/3] w-full rounded-xl md:rounded-2xl" />
                <div className="space-y-1.5 px-0.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          ) : featuredTrips?.map((trip) => (
            <Link
              key={trip.id}
              to={`/marketplace/trip/${trip.slug}`}
              className="group cursor-pointer space-y-2.5"
            >
              {/* Clean image — no overlay, no badges */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
                <img
                  src={trip.cover_image_url}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Content below image */}
              <div className="space-y-1 px-0.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
                    {trip.title}
                  </h3>
                  <span className="text-sm md:text-[15px] font-semibold text-[#0a2225] whitespace-nowrap">
                    {formatPrice(trip.price_per_person, trip.currency)}
                  </span>
                </div>

                <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                </p>

                <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{trip.duration_nights} nights</span>
                </p>

                {/* Vibe tags */}
                <div className="flex flex-wrap gap-1 pt-1">
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
                
                {/* Creator/Agent attribution */}
                {trip.creator_type === 'platform' ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#C7A962]" />
                    <span className="text-[10px] md:text-[11px] font-medium text-[#7A7151]">
                      Goldsainte Curated
                    </span>
                  </div>
                ) : trip.profiles?.full_name ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-1"
                  >
                    <Link
                      to={trip.creator_type === 'agent' ? `/agents/${trip.profiles.id}` : `/creators/${trip.profiles.id}`}
                      className="flex items-center gap-1.5 group/host"
                    >
                      <img
                        src={trip.profiles.avatar_url || '/placeholder.svg'}
                        alt={trip.profiles.full_name}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-[#E5DFC6]"
                      />
                      <span className="text-[10px] md:text-[11px] font-medium text-[#0a2225] group-hover/host:underline">
                        By {trip.profiles.full_name}
                      </span>
                      <span className="rounded-full bg-[#C7B892]/20 px-1.5 py-0.5 text-[8px] font-medium text-[#7A7151]">
                        {trip.creator_type === 'agent' ? 'Agent' : 'Creator'}
                      </span>
                    </Link>
                  </div>
                ) : (
                  <p className="text-[9px] md:text-[10px] text-[#8D8D8D] pt-1">{getCuratorLabel(trip.creator_type)}</p>
                )}
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
