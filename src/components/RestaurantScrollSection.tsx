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
    <section className="py-12 sm:py-14 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl mb-6 sm:mb-8 font-light">
          {title}
        </h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 sm:gap-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-[340px] sm:h-[360px] md:h-[380px] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 active:scale-95 flex flex-col"
              >
                <div className="relative h-[200px] sm:h-[210px] md:h-[220px] flex-shrink-0">
                  <img
                    src={restaurant.image}
                    alt={`${restaurant.name} - ${restaurant.cuisine} restaurant in ${restaurant.location}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {restaurant.priceLevel}
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{restaurant.name}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-1 truncate">{restaurant.location}</p>
                    <p className="text-muted-foreground text-xs mb-2 truncate">{restaurant.cuisine}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-accent" />
                    <span className="text-xs sm:text-sm font-medium">{restaurant.rating}</span>
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
