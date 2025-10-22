import { Card } from "@/components/ui/card";

interface Cuisine {
  name: string;
  imageUrl: string;
}

interface CuisineTypeSectionProps {
  cuisines: Cuisine[];
  onCuisineClick?: (cuisine: string) => void;
}

export const CuisineTypeSection = ({ cuisines, onCuisineClick }: CuisineTypeSectionProps) => {
  if (cuisines.length === 0) return null;

  return (
    <div className="mb-12 sm:mb-14 md:mb-16">
      <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4 sm:mb-6" />
      <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-4 sm:mb-6">
        Explore by Cuisine
      </h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cuisines.map((cuisine) => (
          <Card
            key={cuisine.name}
            className="flex-shrink-0 w-48 sm:w-56 md:w-64 cursor-pointer border-luxury-gold/20 hover:shadow-lg hover:border-luxury-gold/40 transition-all duration-500 group overflow-hidden"
            onClick={() => onCuisineClick?.(cuisine.name)}
          >
            <div className="relative h-32 sm:h-40 overflow-hidden">
              <img
                src={cuisine.imageUrl}
                alt={cuisine.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="w-8 h-0.5 bg-luxury-gold mb-2 transform origin-left group-hover:w-16 transition-all duration-500" />
                <h3 className="font-secondary text-lg sm:text-xl text-white font-light">
                  {cuisine.name}
                </h3>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
