// src/components/home/StoryboardsHighlight.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

interface FeaturedTrip {
  id: string;
  title: string;
  destination: string;
  durationNights: number;
  vibeTags: string[];
  image: string;
  curator: string;
  priceFrom: number;
  currency: string;
}

export function StoryboardsHighlight() {
  const { t } = useTranslation();

  // These will eventually be fetched from packaged_trips table
  const featuredTrips: FeaturedTrip[] = [
    {
      id: "amalfi-coast",
      title: "Amalfi Coast Long Weekend",
      destination: "Amalfi Coast, Italy",
      durationNights: 4,
      vibeTags: ["Romantic", "Coastal", "Foodie"],
      image: "/home/jack-ward-rknrvCrfS1k-unsplash.jpg",
      curator: t('home.storyboards.creatorAgentCollab'),
      priceFrom: 2499,
      currency: "USD",
    },
    {
      id: "cape-town",
      title: "Cape Town & Winelands",
      destination: "Cape Town, South Africa",
      durationNights: 6,
      vibeTags: ["Adventure", "Wine", "Safari"],
      image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&auto=format&fit=crop",
      curator: t('home.storyboards.agentCurated'),
      priceFrom: 3299,
      currency: "USD",
    },
    {
      id: "tokyo",
      title: "Tokyo for Food Lovers",
      destination: "Tokyo, Japan",
      durationNights: 5,
      vibeTags: ["Foodie", "Culture", "Urban"],
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop",
      curator: t('home.storyboards.creatorAgentCollab'),
      priceFrom: 4199,
      currency: "USD",
    },
    {
      id: "swiss-alps",
      title: "Swiss Alps Ski Escape",
      destination: "Zermatt, Switzerland",
      durationNights: 5,
      vibeTags: ["Skiing", "Luxury", "Mountains"],
      image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&auto=format&fit=crop",
      curator: t('home.storyboards.agentCurated'),
      priceFrom: 5499,
      currency: "USD",
    },
    {
      id: "morocco",
      title: "Moroccan Desert Adventure",
      destination: "Marrakech, Morocco",
      durationNights: 6,
      vibeTags: ["Adventure", "Desert", "Culture"],
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&auto=format&fit=crop",
      curator: t('home.storyboards.creatorAgentCollab'),
      priceFrom: 2899,
      currency: "USD",
    },
    {
      id: "bali",
      title: "Bali Wellness Retreat",
      destination: "Ubud, Bali",
      durationNights: 4,
      vibeTags: ["Wellness", "Yoga", "Nature"],
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
      curator: t('home.storyboards.agentCurated'),
      priceFrom: 1899,
      currency: "USD",
    },
  ];

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
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-secondary text-[26px] leading-snug text-[#0a2225] md:text-[31px] lg:text-[36px] mb-4">
            <Trans 
              i18nKey="home.storyboards.title" 
              components={{ em: <em className="font-secondary italic" /> }} 
            />
          </h2>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-[#4a4a4a] md:text-base">
            {t('home.storyboards.description')}
          </p>
        </div>

        {/* Featured trip tiles grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-10">
          {featuredTrips.map((trip) => (
            <Link
              key={trip.id}
              to={`/marketplace/trip/${trip.id}`}
              className="group overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-sm border border-[#E5DFC6] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              {/* Image with gradient and badges */}
              <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
                <img
                  src={trip.image}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Duration badge - top right */}
                <Badge className="absolute top-2 right-2 md:top-3 md:right-3 rounded-full text-[9px] md:text-[10px] bg-white/95 text-[#0a2225] border-0 shadow-sm px-2 py-0.5">
                  <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                  {trip.durationNights} nights
                </Badge>

                {/* Price badge - top left */}
                <Badge className="absolute top-2 left-2 md:top-3 md:left-3 rounded-full text-[10px] md:text-[11px] bg-[#0c4d47] text-white border-0 shadow-sm px-2.5 py-1 font-medium">
                  From {formatPrice(trip.priceFrom, trip.currency)}
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
                  {trip.vibeTags.slice(0, 3).map((tag) => (
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
                <p className="text-[9px] md:text-[10px] text-[#8D8D8D]">{trip.curator}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] shadow-sm"
          >
            <Link to="/concierge">
              <Sparkles className="mr-2 h-4 w-4" />
              {t('home.storyboards.startWithMadison')}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47]/5"
          >
            <Link to="/marketplace">
              {t('home.storyboards.exploreStoryboards')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
