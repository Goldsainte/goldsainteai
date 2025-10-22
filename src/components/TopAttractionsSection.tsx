import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Attraction {
  destination: string;
  packageCount: number;
  imageUrl: string;
}

interface TopAttractionsSectionProps {
  attractions: Attraction[];
}

export const TopAttractionsSection = ({ attractions }: TopAttractionsSectionProps) => {
  const navigate = useNavigate();

  if (attractions.length === 0) return null;

  return (
    <div className="mb-12 sm:mb-14 md:mb-16">
      <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4 sm:mb-6" />
      <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald mb-4 sm:mb-6">Top Attractions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {attractions.map((attraction) => (
          <Card
            key={attraction.destination}
            className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer border-luxury-gold/20 hover:shadow-lg hover:border-luxury-gold/40 transition-all duration-500 group min-h-[88px]"
            onClick={() => {
              const searchParams = new URLSearchParams(window.location.search);
              const currentDest = searchParams.get('destination') || '';
              navigate(`/cocurated-journeys?destination=${currentDest || 'Paris'}&category=${encodeURIComponent(attraction.destination)}`);
            }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-luxury-gold/30">
              <img
                src={attraction.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80`}
                alt={attraction.destination}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-8 h-0.5 bg-luxury-gold mb-1 sm:mb-2 transform origin-left group-hover:w-16 transition-all duration-500" />
              <h3 className="font-secondary text-lg sm:text-xl text-luxury-emerald mb-0.5 sm:mb-1 truncate">{attraction.destination}</h3>
              <p className="text-xs sm:text-sm text-luxury-emerald/60">
                {attraction.packageCount.toLocaleString()} Tours and Activities
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
