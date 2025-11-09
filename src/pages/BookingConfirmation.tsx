import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import logomark from "@/assets/logomark-gold.png";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BookingConfirmation = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <img src={logomark} alt="Logo" className="h-24 w-24 mx-auto mb-6" />
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Info className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
              Booking Information
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your booking journey with Goldsainte
            </p>
          </div>
        </div>

        <Card className="border-accent/20 shadow-xl bg-card/50 backdrop-blur">
          <div className="p-8 space-y-6">
            <Alert className="border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold text-foreground mb-2">How Goldsainte Bookings Work</p>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Goldsainte is your AI-powered travel concierge that helps you discover and plan amazing trips. 
                    We connect you with the best booking options:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Expedia:</strong> Complete your booking directly on Expedia with pre-filled search details</li>
                    <li><strong>Travel Agents:</strong> Connect with certified Goldsainte agents who handle everything for you</li>
                    <li><strong>CoCurated Packages:</strong> Book exclusive travel packages through our marketplace</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Need Help?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="font-semibold text-foreground mb-1">Check Your Expedia Bookings</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you completed a booking on Expedia, check your confirmation email or visit Expedia directly.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://www.expedia.com/trips', '_blank')}
                  >
                    Go to Expedia
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="font-semibold text-foreground mb-1">Agent-Handled Bookings</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    View bookings managed by your travel agent in the Goldsainte marketplace.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/my-bookings')}
                  >
                    View My Bookings
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-accent/20">
              <h3 className="text-xl font-semibold text-foreground mb-3">Continue Exploring</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Discover more travel options with our AI concierge or browse exclusive packages from our certified agents.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate('/home')} 
                  className="flex-1"
                >
                  Search More Trips
                </Button>
                <Button 
                  onClick={() => navigate('/marketplace')} 
                  variant="outline"
                  className="flex-1"
                >
                  Browse Travel Agents
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default BookingConfirmation;
