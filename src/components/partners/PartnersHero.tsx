import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic, MapPin, Plane, Users2 } from "lucide-react";
import heroImage from "@/assets/partners/hero-luxury-car.webp";

export const PartnersHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Premium luxury transportation partnership"
          className="w-full h-full object-cover"
        loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-3xl">
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Partner with <span className="text-primary">Goldsainte</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-4 leading-relaxed">
            Join a Luxury Travel Ecosystem Designed for Modern Transportation Providers
          </p>
          <p className="text-base text-gray-200 mb-4 leading-relaxed">
            Goldsainte connects premium black car, chauffeur, and shuttle services to a global audience of travelers, travel agents, and content creators. Your brand becomes part of fully curated travel experiences—booked through AI, recommended by creators, and powered by trusted agents.
          </p>
          <p className="text-sm text-gray-300 mb-8 italic">
            This isn't just another ride marketplace. It's a full-featured, intelligent ecosystem where your business gets discovered, booked, and promoted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              size="lg" 
              className="px-8 py-6"
              onClick={() => navigate('/transportation-vendor-application')}
            >
              Become a Partner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mic className="h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-white">AI-Powered</div>
              </div>
              <div className="text-sm text-gray-300">Voice Discovery</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-white">500+</div>
              </div>
              <div className="text-sm text-gray-300">Cities in 60+ Countries</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Plane className="h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-white">400+</div>
              </div>
              <div className="text-sm text-gray-300">Airports Worldwide</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users2 className="h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-white">Creator</div>
              </div>
              <div className="text-sm text-gray-300">Network Integrated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
