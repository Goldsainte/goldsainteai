import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatWeDo = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">What We Do - Our Services</h1>
        <p className="text-muted-foreground text-lg mb-2">
          Registered Address: 850 New, Suite 201, Dover, DE, 19, County of Kent, USA
        </p>
        <p className="text-muted-foreground">
          Learn how Goldsainte provides AI-powered travel services across accommodations, attractions, car rentals, flights, and transportation.
        </p>
      </div>

      {/* Back to Top Button */}
      <div className="flex justify-center mt-12 pt-8 border-t">
        <Button onClick={scrollToTop} variant="outline" className="gap-2">
          <ChevronUp className="h-4 w-4" />
          Back to Top
        </Button>
      </div>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>
          For more information, visit our <Link to="/about" className="text-primary hover:underline">About page</Link> or <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
};

export default WhatWeDo;
