import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimplePropertyCardProps {
  image: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
}

export const SimplePropertyCard = ({
  image,
  title,
  location,
  rating,
  reviews,
  price,
  originalPrice,
}: SimplePropertyCardProps) => {
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
        <p className="text-xs text-muted-foreground mb-3">{reviews.toLocaleString()} reviews</p>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${originalPrice}
            </span>
          )}
          <span className="text-sm text-muted-foreground ml-auto">per night</span>
        </div>
      </div>
    </div>
  );
};
