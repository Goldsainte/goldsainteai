import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimplePropertyCardProps {
  property: any;
  type?: string;
}

export const SimplePropertyCard = ({ property, type = "hotels" }: SimplePropertyCardProps) => {
  // Handle both custom property format and Booking.com API format
  const image = property.image || property.property?.photoUrls?.[0] || "/placeholder.svg";
  const title = property.title || property.property?.name || property.label || "Property";
  const location = property.location || property.region || property.accessibilityLabel || "";
  const rating = property.rating || property.property?.reviewScore || 0;
  const reviews = property.reviews || property.property?.reviewCount || 0;
  const priceValue = property.price || property.priceBreakdown?.grossPrice?.value || 0;
  const currency = property.priceBreakdown?.grossPrice?.currency || "USD";
  const displayPrice = property.originalPrice || priceValue;
  const originalPrice = property.originalPrice;
  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <Badge variant="secondary" className="shrink-0">
            <Star className="h-3 w-3 mr-1 fill-current" />
            {rating}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-1">{location}</p>
        {reviews > 0 && (
          <p className="text-xs text-muted-foreground mb-3">{reviews.toLocaleString()} reviews</p>
        )}

        {displayPrice > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{currency} {displayPrice}</span>
            {originalPrice && originalPrice !== displayPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {currency} {originalPrice}
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-auto">per night</span>
          </div>
        )}
      </div>
    </div>
  );
};
