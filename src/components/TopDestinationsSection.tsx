import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import veniceSunset from "@/assets/luxury-venice-sunset.webp";
import resortPool from "@/assets/luxury-resort-pool.webp";
import arcticSpa from "@/assets/luxury-arctic-spa.webp";

interface Destination {
  destination: string;
  packageCount: number;
  imageUrl?: string;
}

interface TopDestinationsSectionProps {
  destinations: Destination[];
  onDestinationClick?: (destination: string) => void;
}

export const TopDestinationsSection = ({ destinations, onDestinationClick }: TopDestinationsSectionProps) => {
  const navigate = useNavigate();

  if (destinations.length === 0) return null;

  const getLuxuryImage = (destination: string) => {
    const dest = destination.toLowerCase();
    if (dest.includes('venice') || dest.includes('paris') || dest.includes('rome') || dest.includes('europe')) {
      return veniceSunset;
    } else if (dest.includes('iceland') || dest.includes('norway') || dest.includes('arctic')) {
      return arcticSpa;
    }
    return resortPool;
  };

  return (
    <div className="mb-12 md:mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {destinations.map((dest) => (
          <Card
            key={dest.destination}
            className="relative h-40 sm:h-48 md:h-56 rounded-xl overflow-hidden cursor-pointer group border-luxury-gold/20 hover:shadow-xl transition-all duration-500"
            onClick={() => onDestinationClick ? onDestinationClick(dest.destination) : navigate('/storyboards')}
          >
            <img
              src={dest.imageUrl || getLuxuryImage(dest.destination)}
              alt={dest.destination}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/80 via-luxury-emerald/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <div className="w-12 h-1 bg-luxury-gold mb-2 transform origin-left group-hover:w-20 transition-all duration-500" />
              <h3 className="text-white font-secondary text-base sm:text-lg md:text-xl font-light drop-shadow-lg">
                {dest.destination}
              </h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
