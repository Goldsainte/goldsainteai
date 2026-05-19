import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
      <div className="container px-3 sm:px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Elevate Your Business?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-10 text-white/90 leading-relaxed">
            Join a growing network of premium transportation vendors powering the future of luxury travel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="secondary"
              className="px-8 py-6 bg-white text-primary hover:bg-white/90"
              onClick={() => navigate('/transportation-vendor-application')}
            >
              Apply Now to Become a Goldsainte Vendor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Contact Partner Team
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/80">
              <strong className="text-white">Review process takes 3–5 business days.</strong>
              <span className="block mt-2">Questions? Contact our partner team at support@goldsainte.com</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
