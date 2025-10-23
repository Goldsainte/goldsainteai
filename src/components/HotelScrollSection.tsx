import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface Hotel {
  id: number;
  name: string;
  location: string;
  image: string;
  price: string;
  rating?: number;
}

interface HotelScrollSectionProps {
  title: string;
  hotels: Hotel[];
}

export const HotelScrollSection = ({ title, hotels }: HotelScrollSectionProps) => {
  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl mb-6 sm:mb-8 font-light">
          {title}
        </h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 sm:gap-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-[340px] sm:h-[360px] md:h-[380px] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 active:scale-95 flex flex-col"
              >
                <div className="relative h-[200px] sm:h-[210px] md:h-[220px] flex-shrink-0">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {hotel.price}
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{hotel.name}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm truncate">{hotel.location}</p>
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
