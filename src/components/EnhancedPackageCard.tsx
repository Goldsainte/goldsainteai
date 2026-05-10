import { Star, MapPin, Clock, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EnhancedPackageCardProps {
  id: string;
  packageName: string;
  destination: string;
  coverImage?: string;
  durationDays: number;
  retailPrice: number;
  currency?: string;
  agencyName?: string;
  rating?: number;
  totalReviews?: number;
  maxParticipants?: number;
  highlights?: any[];
  influencerCommission?: number;
  onViewDetails: () => void;
  onRequestPromotion: () => void;
  isPromoting?: boolean;
  source?: 'amadeus' | 'agent';
}

export const EnhancedPackageCard = ({
  packageName,
  destination,
  coverImage,
  durationDays,
  retailPrice,
  currency = "USD",
  agencyName,
  rating,
  totalReviews,
  maxParticipants,
  highlights = [],
  influencerCommission,
  onViewDetails,
  onRequestPromotion,
  isPromoting,
  source = 'amadeus',
}: EnhancedPackageCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
        <img
          src={coverImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"}
          alt={packageName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        {influencerCommission && influencerCommission > 0 && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-white text-[10px] sm:text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            {influencerCommission}% Commission
          </Badge>
        )}
      </div>

      <CardContent className="p-2.5 sm:p-3 md:p-4">
        {/* Source and Agency Badges */}
        <div className="flex items-center gap-2 mb-2">
          {source === 'agent' && (
            <Badge variant="default" className="text-xs bg-primary">
              CoCurated by {agencyName || 'Agent'}
            </Badge>
          )}
          {source === 'amadeus' && agencyName && (
            <Badge variant="outline" className="text-xs">
              Via Amadeus
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {packageName}
        </h3>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{destination}</span>
        </div>

        {/* Details Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{durationDays} Days</span>
          </div>
          {maxParticipants && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>Max {maxParticipants}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962] mr-1" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
            {totalReviews && totalReviews > 0 && (
              <span className="text-sm text-muted-foreground">
                ({totalReviews} reviews)
              </span>
            )}
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {highlights.slice(0, 3).map((highlight: any, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {typeof highlight === 'string' ? highlight : highlight.text || highlight.title}
              </Badge>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">From</span>
            <span className="text-2xl font-bold text-primary">
              ${retailPrice.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">per person</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2.5 sm:p-3 md:p-4 pt-0 flex gap-2">
        <Button 
          onClick={onViewDetails} 
          variant="outline" 
          className={`min-h-[44px] min-w-[44px] text-xs sm:text-sm ${source === 'agent' ? 'flex-1' : 'w-full'}`}
        >
          View Details
        </Button>
        {source === 'agent' && (
          <Button 
            onClick={onRequestPromotion} 
            className="flex-1 min-h-[44px] min-w-[44px] text-xs sm:text-sm"
            disabled={isPromoting}
          >
            {isPromoting ? "Promoting" : "Request to Promote"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
