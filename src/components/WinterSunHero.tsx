import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import infinityPoolImage from "@/assets/luxury-infinity-pool.jpg";

export const WinterSunHero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      <img
        src={infinityPoolImage}
        alt="Winter Sun Destinations"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/80 via-luxury-emerald/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h2 className="font-secondary text-4xl md:text-6xl text-white mb-4 font-light">
          Winter Sun
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl">
          Escape to paradise with our handpicked collection of luxury beach resorts
        </p>
        <Button 
          size="lg"
          className="bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90 transition-all duration-300"
          onClick={() => navigate('/cocurated-journeys')}
        >
          Explore Destinations
        </Button>
      </div>
    </section>
  );
};
