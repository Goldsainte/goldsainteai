import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";

interface DestinationCardProps {
  destination: string;
  packageCount: number;
  startingPrice: number;
  imageUrl?: string;
}

export const DestinationCard = ({
  destination,
  packageCount,
  startingPrice,
  imageUrl,
}: DestinationCardProps) => {
  const { openModal: openExpediaModal } = useExpediaModal();

  return (
    <Card 
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
      onClick={() => openExpediaModal({ destination })}
    >
      <div className="relative h-40">
        <img
          src={imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80`}
          alt={destination}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5" />
            <h3 className="text-2xl font-bold">{destination}</h3>
          </div>
          <p className="text-white/90 text-sm mb-1">
            {packageCount} {packageCount === 1 ? 'package' : 'packages'} available
          </p>
          <p className="text-white font-semibold">
            From ${startingPrice.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};
