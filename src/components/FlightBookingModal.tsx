import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Users, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingPolicyBanner } from "./BookingPolicyBanner";
import { generateExpediaFlightUrl, openExpediaBooking } from "@/lib/expediaRedirect";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FlightBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: any;
  dictionaries?: any;
}

export const FlightBookingModal = ({ open, onOpenChange, flight, dictionaries }: FlightBookingModalProps) => {
  const navigate = useNavigate();
  
  const numberOfTravelers = parseInt(flight.travelerPricings?.length || 1);
  const basePrice = parseFloat(flight.price.total);
  const markedUpPrice = basePrice * 1.15;

  const handleExpediaRedirect = () => {
    try {
      const originSegment = flight.itineraries?.[0]?.segments?.[0];
      const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
      const returnItinerary = flight.itineraries?.[1];

      const expediaUrl = generateExpediaFlightUrl({
        origin: originSegment?.departure?.iataCode || '',
        destination: destinationSegment?.arrival?.iataCode || '',
        departureDate: originSegment?.departure?.at?.split('T')[0] || '',
        returnDate: returnItinerary?.segments?.[0]?.departure?.at?.split('T')[0],
        adults: numberOfTravelers,
        tripType: returnItinerary ? 'round-trip' : 'one-way',
      });

      openExpediaBooking(expediaUrl);
      
      toast.success("Opening Expedia", {
        description: "Your flight search details have been pre-filled.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating Expedia URL:', error);
      toast.error("Failed to generate booking link. Please try again.");
    }
  };

  const handleAgentContact = () => {
    navigate('/marketplace');
    onOpenChange(false);
    toast.success("Agent Marketplace", {
      description: "Browse our certified travel agents who can handle your booking.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl sm:w-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-secondary">Complete Your Flight Booking</DialogTitle>
          <DialogDescription>Choose how you'd like to proceed with your reservation</DialogDescription>
        </DialogHeader>

        <BookingPolicyBanner bookingType="flight" />

        <div className="space-y-6">
          {/* Flight Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Flight Details</h3>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <strong>Route:</strong> {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode}
              </p>
              <p>
                <strong>Travelers:</strong> {numberOfTravelers}
              </p>
              {flight.itineraries?.[1] && (
                <p className="text-muted-foreground">Round-trip flight</p>
              )}
              <p className="text-lg font-bold text-primary mt-2">
                Estimated: {flight.price.currency} {markedUpPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Option 1: Book on Expedia */}
          <Alert className="border-primary/20">
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="space-y-3 mt-2">
              <div>
                <p className="font-semibold text-foreground mb-1">Option 1: Book on Expedia</p>
                <p className="text-sm text-muted-foreground">
                  We'll take you to Expedia with your flight search details pre-filled. Complete your booking securely on their platform.
                </p>
              </div>
              <Button 
                onClick={handleExpediaRedirect} 
                className="w-full"
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Continue to Expedia
              </Button>
            </AlertDescription>
          </Alert>

          {/* Option 2: Connect with Agent */}
          <Alert className="border-accent/20">
            <Users className="h-4 w-4" />
            <AlertDescription className="space-y-3 mt-2">
              <div>
                <p className="font-semibold text-foreground mb-1">Option 2: Connect with a Travel Agent</p>
                <p className="text-sm text-muted-foreground">
                  Let one of our certified Goldsainte travel agents handle your flight booking and provide personalized service throughout your journey.
                </p>
              </div>
              <Button 
                onClick={handleAgentContact} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Browse Travel Agents
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Goldsainte connects you with the best booking options. We don't process payments directly.
        </div>
      </DialogContent>
    </Dialog>
  );
};
