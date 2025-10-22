import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface InspirationCardProps {
  image: string;
  title: string;
  location: string;
  description: string;
  onClick?: () => void;
}

export const InspirationCard = ({ image, title, location, description, onClick }: InspirationCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl border-0 h-64"
      onClick={onClick}
    >
      {/* Image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        <div className="transform transition-all duration-500 group-hover:translate-y-0 translate-y-2">
          <div className="flex items-center gap-2 mb-2 text-primary-foreground/80">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">{location}</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 tracking-tight">{title}</h3>
          
          <p className="text-sm text-primary-foreground/90 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 max-w-md">
            {description}
          </p>
        </div>

        {/* Decorative accent */}
        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 group-hover:w-full" />
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
};
