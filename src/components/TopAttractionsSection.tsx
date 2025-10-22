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
    <div className="mb-16">
      <div className="w-20 h-1 bg-luxury-gold mb-6" />
      <h2 className="font-secondary text-3xl md:text-4xl text-luxury-emerald mb-6">Top Attractions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attractions.map((attraction) => (
          <Card
            key={attraction.destination}
            className="p-4 flex items-center gap-4 cursor-pointer border-luxury-gold/20 hover:shadow-lg hover:border-luxury-gold/40 transition-all duration-500 group"
            onClick={() => {
              const searchParams = new URLSearchParams(window.location.search);
              const currentDest = searchParams.get('destination') || '';
              navigate(`/cocurated-journeys?destination=${currentDest || 'Paris'}&category=${encodeURIComponent(attraction.destination)}`);
            }}
          >
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-luxury-gold/30">
              <img
                src={attraction.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80`}
                alt={attraction.destination}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1">
              <div className="w-8 h-0.5 bg-luxury-gold mb-2 transform origin-left group-hover:w-16 transition-all duration-500" />
              <h3 className="font-secondary text-xl text-luxury-emerald mb-1">{attraction.destination}</h3>
              <p className="text-sm text-luxury-emerald/60">
                {attraction.packageCount.toLocaleString()} Tours and Activities
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
