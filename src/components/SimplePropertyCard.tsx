import { Heart, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimplePropertyCardProps {
  property: any;
  type?: string;
}

export const SimplePropertyCard = ({ property, type = "hotels" }: SimplePropertyCardProps) => {
  // Parse Booking.com API data properly
  const image = property.property?.photoUrls?.[0] || property.image || "/placeholder.svg";
  const title = property.property?.name || property.title || property.label || "Hotel";
  const propertyUrl = property.property?.externalUrls?.default || property.url || "#";
  
  const handleClick = () => {
    if (propertyUrl && propertyUrl !== "#") {
      window.open(propertyUrl, "_blank", "noopener,noreferrer");
    }
  };
  
  // Extract clean location from accessibilityLabel
  const getCleanLocation = () => {
    if (property.location) return property.location;
    if (property.region) return property.region;
    
    // Parse accessibilityLabel to get just the district and distance
    const label = property.accessibilityLabel || "";
    const districtMatch = label.match(/(\d+(?:st|nd|rd|th) arr\.)/);
    const distanceMatch = label.match(/(\d+\.?\d* km from downtown)/);
    
    if (districtMatch && distanceMatch) {
      return `${districtMatch[1]} • ${distanceMatch[1]}`;
    }
    if (districtMatch) return districtMatch[1];
    
    return label.split('.')[0] || "Location";
  };
  
  const location = getCleanLocation();
  const rating = property.property?.reviewScore || property.rating || 0;
  const reviews = property.property?.reviewCount || property.reviews || 0;
  
  // Extract clean price
  const getCleanPrice = () => {
    if (property.price) return property.price;
    if (property.priceBreakdown?.grossPrice?.value) {
      return property.priceBreakdown.grossPrice.value;
    }
    
    // Try to parse from accessibilityLabel
    const label = property.accessibilityLabel || "";
    const priceMatch = label.match(/Current price (\d+) USD/);
    if (priceMatch) return parseInt(priceMatch[1]);
    
    const singlePriceMatch = label.match(/(\d+) USD/);
    if (singlePriceMatch) return parseInt(singlePriceMatch[1]);
    
    return 0;
  };
  
  const displayPrice = getCleanPrice();
  const currency = property.priceBreakdown?.grossPrice?.currency || "USD";

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
    <div 
      onClick={handleClick}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer"
    >
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
            <MapPin className="h-3 w-3" />
            {location}
          </p>
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1 font-semibold">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {rating.toFixed(1)}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {getRatingText(rating)}
            </span>
            {reviews > 0 && (
              <span className="text-xs text-muted-foreground">
                ({reviews.toLocaleString()} reviews)
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
                </div>
                <p className="text-xs text-muted-foreground">per night</p>
              </div>
              <Button size="sm" className="text-xs h-8">
                View
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
