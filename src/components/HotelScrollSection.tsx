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
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-secondary text-3xl md:text-4xl mb-8 font-light">
          {title}
        </h2>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="flex-shrink-0 w-[320px] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {hotel.price}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{hotel.name}</h3>
                  <p className="text-muted-foreground text-sm">{hotel.location}</p>
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
