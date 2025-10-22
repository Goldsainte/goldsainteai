import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import fineDiningImage from "@/assets/fine-dining-hero.jpg";

export const FineDiningHero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden">
      <img
        src={fineDiningImage}
        alt="Fine Dining Around the World"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/80 via-luxury-emerald/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 sm:px-4 md:px-6">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h2 className="font-secondary text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 font-light">
          Fine Dining Around the World
        </h2>
        <p className="text-white/90 text-base sm:text-lg md:text-xl mb-8 max-w-2xl">
          Discover the world's most exceptional culinary experiences
        </p>
        <Button 
          size="lg"
          className="bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90 transition-all duration-300"
          onClick={() => navigate('/fine-dining')}
        >
          Explore Global Restaurants
        </Button>
      </div>
    </section>
  );
};
