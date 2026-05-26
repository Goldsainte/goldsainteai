import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapPin, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";

interface Tour {
  id: string;
  packageName: string;
  destination: string;
  coverImage?: string;
  retailPrice: number;
  currency: string;
  rating?: number;
  totalReviews?: number;
  likelyToSellOut?: boolean;
  agencyName?: string;
}

interface TopToursCarouselProps {
  tours: Tour[];
}

export const TopToursCarousel = ({ tours }: TopToursCarouselProps) => {
  const navigate = useNavigate();

  if (tours.length === 0) return null;

  return (
    <div className="mb-12 sm:mb-14 md:mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-luxury-emerald">Top Tours</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 sm:gap-6 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tours.map((tour) => (
            <Card
              key={tour.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-[340px] sm:h-[360px] md:h-[380px] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 active:scale-95 flex flex-col"
              onClick={() => navigate(`/cocurated-package/${tour.id}`)}
            >
              <div className="relative h-[200px] sm:h-[210px] md:h-[220px] flex-shrink-0">
                <TripCoverImage
                  src={tour.coverImage}
                  alt={tour.packageName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {tour.likelyToSellOut && (
                  <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-destructive text-destructive-foreground text-xs">
                    Likely to Sell Out
                  </Badge>
                )}
                <button className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-background/80 hover:bg-background transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{tour.packageName}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {tour.destination}
                  </p>
                  
                  {tour.rating && (
                    <div className="flex items-center gap-1 mb-2 text-xs sm:text-sm text-muted-foreground">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-[#C7A962] text-[#C7A962] flex-shrink-0" />
                      <span className="font-semibold">{tour.rating.toFixed(1)}</span>
                      {tour.totalReviews && (
                        <span className="truncate">({tour.totalReviews.toLocaleString()})</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">from</span>
                  <span className="text-lg sm:text-xl font-bold">
                    {tour.currency} {tour.retailPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
