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

  // Get rating descriptor
  const getRatingText = (score: number) => {
    if (score >= 9) return "Superb";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  // Format currency symbol
  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
    };
    return symbols[curr] || curr + ' ';
  };

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background hover:text-destructive transition-colors"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            📍 {location}
          </p>
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-semibold">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              {rating.toFixed(1)}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {getRatingText(rating)}
            </span>
            {reviews > 0 && (
              <span className="text-xs text-muted-foreground">
                • {reviews.toLocaleString()} guest reviews
              </span>
            )}
          </div>
        )}

        {displayPrice > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {getCurrencySymbol(currency)}{Math.round(displayPrice)}
                  </span>
                  {originalPrice && originalPrice !== displayPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {getCurrencySymbol(currency)}{Math.round(originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">per night</p>
              </div>
              <Button size="sm" className="text-xs">
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
