import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapPin, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
              className="w-[240px] sm:w-[280px] inline-block overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group active:scale-95"
              onClick={() => navigate(`/cocurated-package/${tour.id}`)}
            >
              <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden">
                <img
                  src={tour.coverImage || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80`}
                  alt={tour.packageName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
              
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">{tour.destination}</span>
                </div>
                
                <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">{tour.packageName}</h3>
                
                {tour.rating && (
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm sm:text-base">{tour.rating.toFixed(1)}</span>
                    </div>
                    {tour.totalReviews && (
                      <span className="text-xs sm:text-sm text-muted-foreground truncate">
                        ({tour.totalReviews.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}
                
                {tour.agencyName && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 truncate">{tour.agencyName}</p>
                )}
                
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-xs sm:text-sm text-muted-foreground">from</span>
                  <span className="text-xl sm:text-2xl font-bold">
                    {tour.currency} {tour.retailPrice.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">per person</span>
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
