import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface LuxuryServiceCardProps {
  title: string;
  description: string;
  image: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const LuxuryServiceCard = ({ 
  title, 
  description, 
  image, 
  icon: Icon,
  onClick 
}: LuxuryServiceCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer border-primary/20 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-3"
      onClick={onClick}
    >
      <div className="relative h-80 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-700" />
        
        {/* Icon Badge */}
        <div className="absolute top-6 right-6 bg-primary/20 backdrop-blur-md rounded-full p-4 border border-primary/30 group-hover:bg-primary/30 transition-all duration-500">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-3">
          <h3 className="text-3xl font-bold font-chiffon tracking-wide">{title}</h3>
          <p className="text-sm text-white/90 leading-relaxed">{description}</p>
          
          {/* Hover indicator */}
          <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
            <span className="text-sm font-medium">Explore Now</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};
