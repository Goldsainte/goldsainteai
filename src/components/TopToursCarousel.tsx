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
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Top Tours</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-6 pb-4">
          {tours.map((tour) => (
            <Card
              key={tour.id}
              className="w-[280px] inline-block overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
              onClick={() => navigate(`/cocurated-package/${tour.id}`)}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={tour.coverImage || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80`}
                  alt={tour.packageName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {tour.likelyToSellOut && (
                  <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                    Likely to Sell Out
                  </Badge>
                )}
                <button className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{tour.destination}</span>
                </div>
                
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{tour.packageName}</h3>
                
                {tour.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{tour.rating.toFixed(1)}</span>
                    </div>
                    {tour.totalReviews && (
                      <span className="text-sm text-muted-foreground">
                        ({tour.totalReviews.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}
                
                {tour.agencyName && (
                  <p className="text-sm text-muted-foreground mb-3">{tour.agencyName}</p>
                )}
                
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">from</span>
                  <span className="text-2xl font-bold">
                    {tour.currency} {tour.retailPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">per person</span>
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
