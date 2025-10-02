import { useState, useEffect } from "react";
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
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const numberOfTravelers = parseInt(flight.travelerPricings?.length || 1);
  const [passengers, setPassengers] = useState(
    Array.from({ length: numberOfTravelers }, () => ({
      title: "MR",
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "MALE",
      nationality: "",
      passportNumber: "",
      passportExpiry: "",
      passportCountry: "",
      knownTravelerNumber: "",
      frequentFlyerNumber: ""
    }))
  );

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    countryCode: "+1",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US"
  });

  const basePrice = parseFloat(flight.price.total);
  const markedUpPrice = basePrice * 1.15;

  const updatePassenger = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  // Load user profile and preferences when modal opens
  useEffect(() => {
    const loadUserData = async () => {
      if (!open) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Fetch preferences
      const { data: preferences } = await supabase
        .from('user_booking_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profile || preferences) {
        setUserProfile({ profile, preferences });
        setShowAutofillPrompt(true);
      }
    };

    loadUserData();
  }, [open]);

  const handleAutofill = () => {
    if (!userProfile) return;

    const { profile, preferences } = userProfile;
    const updated = [...passengers];
    
    // Autofill first passenger with user data
    updated[0] = {
      ...updated[0],
      title: profile?.first_name ? "MR" : updated[0].title,
      firstName: profile?.first_name || updated[0].firstName,
      middleName: updated[0].middleName,
      lastName: profile?.last_name || updated[0].lastName,
      dateOfBirth: updated[0].dateOfBirth,
      gender: updated[0].gender,
      nationality: preferences?.nationality || updated[0].nationality,
      passportNumber: preferences?.passport_number || updated[0].passportNumber,
      passportExpiry: preferences?.passport_expiry || updated[0].passportExpiry,
      passportCountry: preferences?.passport_issuing_country || updated[0].passportCountry,
      knownTravelerNumber: updated[0].knownTravelerNumber,
      frequentFlyerNumber: updated[0].frequentFlyerNumber
    };

    setPassengers(updated);

    // Autofill contact info
    setContactInfo({
      email: profile?.email || contactInfo.email,
      phone: profile?.phone || contactInfo.phone,
      countryCode: contactInfo.countryCode,
      address: contactInfo.address,
      city: contactInfo.city,
      state: contactInfo.state,
      postalCode: contactInfo.postalCode,
      country: profile?.country || preferences?.nationality || contactInfo.country
    });

    setShowAutofillPrompt(false);
    toast.success("Information autofilled from your profile");
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

      // Check if international flight (simple heuristic: different country codes or long distance)
      const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
      const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
      const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2); // Different country codes

      // Validate passenger info
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        if (!p.title || !p.firstName || !p.lastName || !p.dateOfBirth || !p.gender || !p.nationality) {
          toast.error(`Please complete all required fields for passenger ${i + 1}`);
          setLoading(false);
          return;
        }
        
        // Require passport for international flights
        if (isInternational) {
          if (!p.passportNumber || !p.passportExpiry || !p.passportCountry) {
            toast.error(`Passport information is required for international flights (Passenger ${i + 1})`);
            setLoading(false);
            return;
          }
        }
      }

      if (!contactInfo.email || !contactInfo.phone || !contactInfo.address || !contactInfo.city || !contactInfo.postalCode || !contactInfo.country) {
        toast.error("Please complete all required contact and address fields");
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

        {/* Autofill Prompt */}
        {showAutofillPrompt && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold mb-1">Use your saved information?</h4>
                <p className="text-sm text-muted-foreground">
                  We found your profile information. Would you like to autofill the first passenger details?
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAutofillPrompt(false)}
                >
                  No thanks
                </Button>
                <Button
                  size="sm"
                  onClick={handleAutofill}
                >
                  Yes, autofill
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`title-${index}`}>Title *</Label>
                      <Select
                        value={passenger.title}
                        onValueChange={(value) => updatePassenger(index, 'title', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MR">Mr</SelectItem>
                          <SelectItem value="MRS">Mrs</SelectItem>
                          <SelectItem value="MS">Ms</SelectItem>
                          <SelectItem value="DR">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                      <Input
                        id={`firstName-${index}`}
                        value={passenger.firstName}
                        onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                        placeholder="As on passport"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`middleName-${index}`}>Middle Name</Label>
                      <Input
                        id={`middleName-${index}`}
                        value={passenger.middleName}
                        onChange={(e) => updatePassenger(index, 'middleName', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                      <Input
                        id={`lastName-${index}`}
                        value={passenger.lastName}
                        onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                        placeholder="As on passport"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <Label htmlFor={`nationality-${index}`}>Nationality *</Label>
                      <Input
                        id={`nationality-${index}`}
                        value={passenger.nationality}
                        onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                        placeholder="US"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-semibold mb-3">
                      Passport Information 
                      {(() => {
                        const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                        const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
                        const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2);
                        return isInternational ? " (Required for International Flights)" : " (Optional for Domestic Flights)";
                      })()}
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`passport-${index}`}>
                          Passport Number
                          {(() => {
                            const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                            const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
                            const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2);
                            return isInternational ? " *" : "";
                          })()}
                        </Label>
                        <Input
                          id={`passport-${index}`}
                          value={passenger.passportNumber}
                          onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                          placeholder={(() => {
                            const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                            const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
                            const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2);
                            return isInternational ? "Required" : "Optional";
                          })()}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`passportExpiry-${index}`}>
                          Expiry Date
                          {(() => {
                            const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                            const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
                            const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2);
                            return isInternational ? " *" : "";
                          })()}
                        </Label>
                        <Input
                          id={`passportExpiry-${index}`}
                          type="date"
                          value={passenger.passportExpiry}
                          onChange={(e) => updatePassenger(index, 'passportExpiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`passportCountry-${index}`}>
                          Issuing Country
                          {(() => {
                            const origin = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                            const destination = flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode;
                            const isInternational = origin?.slice(0, 2) !== destination?.slice(0, 2);
                            return isInternational ? " *" : "";
                          })()}
                        </Label>
                        <Input
                          id={`passportCountry-${index}`}
                          value={passenger.passportCountry}
                          onChange={(e) => updatePassenger(index, 'passportCountry', e.target.value)}
                          placeholder="US"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-semibold mb-3">Optional Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`ktn-${index}`}>Known Traveler Number / TSA PreCheck</Label>
                        <Input
                          id={`ktn-${index}`}
                          value={passenger.knownTravelerNumber}
                          onChange={(e) => updatePassenger(index, 'knownTravelerNumber', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`ffn-${index}`}>Frequent Flyer Number</Label>
                        <Input
                          id={`ffn-${index}`}
                          value={passenger.frequentFlyerNumber}
                          onChange={(e) => updatePassenger(index, 'frequentFlyerNumber', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
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
              <h4 className="font-semibold">Contact Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={contactInfo.countryCode}
                      onValueChange={(value) => setContactInfo({ ...contactInfo, countryCode: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+1">+1 (US)</SelectItem>
                        <SelectItem value="+44">+44 (UK)</SelectItem>
                        <SelectItem value="+971">+971 (AE)</SelectItem>
                        <SelectItem value="+81">+81 (JP)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="1234567890"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Billing Address</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={contactInfo.address}
                      onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={contactInfo.city}
                        onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={contactInfo.state}
                        onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal / Zip Code *</Label>
                      <Input
                        id="postalCode"
                        value={contactInfo.postalCode}
                        onChange={(e) => setContactInfo({ ...contactInfo, postalCode: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={contactInfo.country}
                        onChange={(e) => setContactInfo({ ...contactInfo, country: e.target.value })}
                        placeholder="US"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
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
