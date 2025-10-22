import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";

export interface Restaurant {
  id: number;
  name: string;
  location: string;
  image: string;
  priceLevel: string;
  rating: number;
  cuisine: string;
  websiteUrl?: string;
  googlePlacesId?: string;
}

interface RestaurantScrollSectionProps {
  title: string;
  restaurants: Restaurant[];
}

export const RestaurantScrollSection = ({ title, restaurants }: RestaurantScrollSectionProps) => {
  const handleRestaurantClick = (restaurant: Restaurant) => {
    if (restaurant.websiteUrl) {
      window.open(restaurant.websiteUrl, '_blank', 'noopener,noreferrer');
    } else if (restaurant.googlePlacesId) {
      window.open(`https://www.google.com/maps/search/?api=1&query_place_id=${restaurant.googlePlacesId}`, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${restaurant.name} ${restaurant.location} reservations`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-secondary text-3xl md:text-4xl mb-8 font-light">
          {title}
        </h2>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                className="flex-shrink-0 w-[320px] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={restaurant.image}
                    alt={`${restaurant.name} - ${restaurant.cuisine} restaurant in ${restaurant.location}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {restaurant.priceLevel}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-muted-foreground text-sm mb-1">{restaurant.location}</p>
                  <p className="text-muted-foreground text-xs mb-2">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-accent" />
                    <span className="text-sm font-medium">{restaurant.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
};
