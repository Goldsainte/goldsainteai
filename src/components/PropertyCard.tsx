import { Heart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PropertyCardProps {
  image: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
}

export const PropertyCard = ({
  image,
  title,
  location,
  rating,
  reviews,
  price,
  originalPrice,
}: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden group cursor-pointer transition-all hover:shadow-lg">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/80 hover:bg-background text-foreground"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-semibold">
            <Star className="h-3 w-3 fill-current" />
            <span>{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {reviews.toLocaleString()} reviews
        </p>

        <div className="flex items-center justify-between">
          <div>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                ${originalPrice}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              ${price}
            </span>
            <span className="text-sm text-muted-foreground"> /night</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
