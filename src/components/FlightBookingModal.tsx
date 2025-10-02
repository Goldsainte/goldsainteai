import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FlightBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: any;
  dictionaries?: any;
}

export const FlightBookingModal = ({ open, onOpenChange, flight, dictionaries }: FlightBookingModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const numberOfTravelers = parseInt(flight.travelerPricings?.length || 1);
  const [passengers, setPassengers] = useState(
    Array.from({ length: numberOfTravelers }, () => ({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "MALE",
      passportNumber: "",
      passportExpiry: "",
      passportCountry: "",
      nationality: ""
    }))
  );

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: ""
  });

  const basePrice = parseFloat(flight.price.total);
  const markedUpPrice = basePrice * 1.15;

  const updatePassenger = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to book a flight", {
          action: {
            label: "Log In",
            onClick: () => navigate('/auth')
          }
        });
        setLoading(false);
        return;
      }

      // Validate passenger info
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        if (!p.firstName || !p.lastName || !p.dateOfBirth || !p.gender) {
          toast.error(`Please complete all required fields for passenger ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      if (!contactInfo.email || !contactInfo.phone) {
        toast.error("Please provide contact information");
        setLoading(false);
        return;
      }

      // Call booking function
      const { data, error } = await supabase.functions.invoke('amadeus-book-flight', {
        body: {
          flightOffer: flight,
          passengers: passengers,
          contactInfo: contactInfo,
          baseCost: basePrice
        }
      });

      if (error) throw error;

      toast.success("Flight booked successfully!");
      onOpenChange(false);
      
      // Navigate to confirmation page
      navigate('/booking-confirmation', { 
        state: { 
          booking: data.booking,
          type: 'flight'
        } 
      });

    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || "Failed to book flight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Flight Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Flight Details</h3>
            <p className="text-sm">
              {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode}
            </p>
            <p className="text-sm text-muted-foreground">{numberOfTravelers} traveler(s)</p>
            <p className="text-lg font-bold mt-2">
              Total: {flight.price.currency} {markedUpPrice.toFixed(2)}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
              <span className="ml-2">Passengers</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
              <span className="ml-2">Contact</span>
            </div>
          </div>

          {/* Step 1: Passenger Information */}
          {step === 1 && (
            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-semibold">Passenger {index + 1}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                      <Input
                        id={`firstName-${index}`}
                        value={passenger.firstName}
                        onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                      <Input
                        id={`lastName-${index}`}
                        value={passenger.lastName}
                        onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`dob-${index}`}>Date of Birth *</Label>
                      <Input
                        id={`dob-${index}`}
                        type="date"
                        value={passenger.dateOfBirth}
                        onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`gender-${index}`}>Gender *</Label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) => updatePassenger(index, 'gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`passport-${index}`}>Passport Number</Label>
                      <Input
                        id={`passport-${index}`}
                        value={passenger.passportNumber}
                        onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`passportCountry-${index}`}>Passport Country</Label>
                      <Input
                        id={`passportCountry-${index}`}
                        value={passenger.passportCountry}
                        onChange={(e) => updatePassenger(index, 'passportCountry', e.target.value)}
                        placeholder="US"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={() => setStep(2)} className="w-full">
                Continue to Contact Information
              </Button>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleBooking} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    `Book for ${flight.price.currency} ${markedUpPrice.toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
