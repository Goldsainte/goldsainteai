import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import pinkBeachImage from "@/assets/pink-beach-aerial.jpg";

export const WinterSunHero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      <img
        src={pinkBeachImage}
        alt="Winter Sun Destinations"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-secondary text-4xl md:text-6xl text-white mb-4 font-light">
          Winter Sun
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl">
          Escape to paradise with our handpicked collection of luxury beach resorts
        </p>
        <Button 
          size="lg"
          className="bg-white text-primary hover:bg-white/90"
          onClick={() => navigate('/cocurated-journeys')}
        >
          Explore Destinations
        </Button>
      </div>
    </section>
  );
};
