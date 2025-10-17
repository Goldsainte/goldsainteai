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
      <h2 className="text-3xl font-bold mb-6">Top Attractions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attractions.map((attraction) => (
          <Card
            key={attraction.destination}
            className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate(`/cocurated-journeys?destination=${attraction.destination}`)}
          >
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={attraction.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80`}
                alt={attraction.destination}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{attraction.destination}</h3>
              <p className="text-sm text-muted-foreground">
                {attraction.packageCount.toLocaleString()} Tours and Activities
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
