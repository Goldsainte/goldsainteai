import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, MapPin, TrendingUp } from "lucide-react";
import heroImage from "@/assets/partners/hero-luxury-car.jpg";

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
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Drive Success with <span className="text-primary">Goldsainte</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
            Join our premium transportation network and connect with luxury travelers worldwide. 
            Grow your business with advanced technology and exclusive clientele.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/transportation-vendor-application')}
            >
              Become a Partner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <div className="text-3xl font-bold text-white">500+</div>
              </div>
              <div className="text-sm text-gray-300">Premium Vendors</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-6 w-6 text-primary" />
                <div className="text-3xl font-bold text-white">50+</div>
              </div>
              <div className="text-sm text-gray-300">Cities Worldwide</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <div className="text-3xl font-bold text-white">40%</div>
              </div>
              <div className="text-sm text-gray-300">Avg. Revenue Growth</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
