import { Plane, Hotel, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logomark from "@/assets/logomark-gold.png";

const Index = () => {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <img src={logomark} alt="Goldsainte" className="h-16 w-16" />
          <h1 className="text-4xl md:text-5xl font-primary font-bold text-center">
            Goldsainte AI
          </h1>
        </div>

        {/* Main Search Input */}
        <div className="w-full space-y-4">
          <div className="relative">
            <Input
              placeholder="Where Can Goldsainte AI Help You Travel To"
              className="w-full h-14 px-6 text-base border-border rounded-3xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
            >
              <Hotel className="h-4 w-4 mr-2" />
              Hotels
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
            >
              <Plane className="h-4 w-4 mr-2" />
              Flights
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Destinations
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
            >
              <Compass className="h-4 w-4 mr-2" />
              Explore
            </Button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-auto pt-12">
          <p className="text-sm text-muted-foreground text-center">
            By using Goldsainte AI, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms
            </a>{" "}
            and have read our{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
};

export default Index;
