import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import fineDiningHeroImage from "@/assets/fine-dining-search-hero.jpg";

interface FineDiningSearchHeroProps {
  onOpenFilters: () => void;
}

export const FineDiningSearchHero = ({
  onOpenFilters,
}: FineDiningSearchHeroProps) => {
  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] flex items-center justify-center">
      <img
        src={fineDiningHeroImage}
        alt="Fine Dining Experience"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/90 via-luxury-emerald/50 to-luxury-emerald/30" />
      
      <div className="relative z-10 w-full max-w-5xl px-3 sm:px-4 md:px-6">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h1 className="font-secondary text-3xl md:text-4xl lg:text-5xl text-white text-center mb-4 font-light">
          Discover the World's Finest Restaurants
        </h1>
        <p className="text-white/90 text-center text-base md:text-lg mb-8 max-w-2xl mx-auto">
          Browse by destination or cuisine type below
        </p>
        
        {/* Filters Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="bg-luxury-ivory/20 hover:bg-luxury-gold/90 text-white border-luxury-gold/30 backdrop-blur-sm transition-all duration-300 rounded-full h-9 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
