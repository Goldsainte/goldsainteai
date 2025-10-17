import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Destination {
  destination: string;
  packageCount: number;
  imageUrl?: string;
}

interface TopDestinationsSectionProps {
  destinations: Destination[];
}

export const TopDestinationsSection = ({ destinations }: TopDestinationsSectionProps) => {
  const navigate = useNavigate();

  if (destinations.length === 0) return null;

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Top Destinations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {destinations.map((dest) => (
          <Card
            key={dest.destination}
            className="relative h-48 rounded-xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
            onClick={() => navigate(`/cocurated-journeys?destination=${dest.destination}`)}
          >
            <img
              src={dest.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80`}
              alt={dest.destination}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white text-xl font-bold drop-shadow-lg">
                {dest.destination}
              </h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
