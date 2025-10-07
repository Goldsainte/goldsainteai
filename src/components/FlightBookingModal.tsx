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
import { SeatMapSelector } from "./SeatMapSelector";
import { BaggageSelector } from "./BaggageSelector";

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
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState<any[]>([]);
  
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
        .maybeSingle();

      // Fetch preferences
      const { data: preferences } = await supabase
        .from('user_booking_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile || preferences) {
        setUserProfile({ profile, preferences, session });
        setShowAutofillPrompt(true);
      }
    };

    loadUserData();
  }, [open]);

  const handleAutofill = () => {
    if (!userProfile) return;

    const { profile, preferences, session } = userProfile;
    const updated = [...passengers];
    
    let filledFields = [];
    
    // Autofill first passenger with user data
    const newPassenger = { ...updated[0] };
    
    if (profile?.first_name) {
      newPassenger.firstName = profile.first_name;
      filledFields.push('first name');
    }
    
    if (profile?.last_name) {
      newPassenger.lastName = profile.last_name;
      filledFields.push('last name');
    }
    
    if (preferences?.date_of_birth) {
      newPassenger.dateOfBirth = preferences.date_of_birth;
      filledFields.push('date of birth');
    }
    
    if (preferences?.gender) {
      newPassenger.gender = preferences.gender;
      filledFields.push('gender');
    }
    
    if (preferences?.nationality) {
      newPassenger.nationality = preferences.nationality;
      filledFields.push('nationality');
    }
    
    if (preferences?.passport_number) {
      newPassenger.passportNumber = preferences.passport_number;
      filledFields.push('passport number');
    }
    
    if (preferences?.passport_expiry) {
      newPassenger.passportExpiry = preferences.passport_expiry;
      filledFields.push('passport expiry');
    }
    
    if (preferences?.passport_issuing_country) {
      newPassenger.passportCountry = preferences.passport_issuing_country;
      filledFields.push('passport country');
    }
    
    updated[0] = newPassenger;
    setPassengers(updated);

    // Autofill contact info
    const newContactInfo = { ...contactInfo };
    
    if (session?.user?.email) {
      newContactInfo.email = session.user.email;
      filledFields.push('email');
    }
    
    if (profile?.phone) {
      newContactInfo.phone = profile.phone;
      filledFields.push('phone');
    }
    
    if (preferences?.home_address) {
      newContactInfo.address = preferences.home_address;
      filledFields.push('address');
    }
    
    if (preferences?.home_city) {
      newContactInfo.city = preferences.home_city;
      filledFields.push('city');
    }
    
    if (preferences?.home_state) {
      newContactInfo.state = preferences.home_state;
      filledFields.push('state');
    }
    
    if (preferences?.home_postal_code) {
      newContactInfo.postalCode = preferences.home_postal_code;
      filledFields.push('postal code');
    }
    
    if (profile?.country || preferences?.nationality) {
      newContactInfo.country = profile?.country || preferences?.nationality;
      filledFields.push('country');
    }
    
    setContactInfo(newContactInfo);
    setShowAutofillPrompt(false);
    
    if (filledFields.length > 0) {
      toast.success(`Autofilled: ${filledFields.join(', ')}`);
    } else {
      toast.info("No profile information available to autofill. Please complete your profile in settings.");
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const returnTo = window.location.pathname + window.location.search;
        // Redirect immediately to login for reliability on all devices
        navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
        toast.error("Please log in to continue", {
          action: {
            label: "Open Login",
            onClick: () => navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
          }
        });
        setLoading(false);
        return;
      }

      // Determine if flight is international by checking airport countries
      const originSegment = flight.itineraries?.[0]?.segments?.[0];
      const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
      
      // Use the country code from the flight data if available
      const originCountry = originSegment?.departure?.address?.countryCode;
      const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
      
      // Only require passport if we can confirm it's international
      const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;

      // Validate passenger info
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        
        // Trim all string values to handle whitespace
        const trimmedTitle = p.title?.trim();
        const trimmedFirstName = p.firstName?.trim();
        const trimmedLastName = p.lastName?.trim();
        const trimmedDOB = p.dateOfBirth?.trim();
        const trimmedGender = p.gender?.trim();
        const trimmedNationality = p.nationality?.trim();
        
        if (!trimmedTitle || !trimmedFirstName || !trimmedLastName || !trimmedDOB || !trimmedGender || !trimmedNationality) {
          toast.error(`Please complete all required fields for passenger ${i + 1}`);
          setLoading(false);
          return;
        }
        
        // Only require passport for confirmed international flights
        if (isInternational) {
          const trimmedPassportNumber = p.passportNumber?.trim();
          const trimmedPassportExpiry = p.passportExpiry?.trim();
          const trimmedPassportCountry = p.passportCountry?.trim();
          
          if (!trimmedPassportNumber || !trimmedPassportExpiry || !trimmedPassportCountry) {
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
      // Calculate total with baggage fees
      const baggageTotal = selectedBaggage.reduce((total, b) => {
        const includedChecked = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0;
        const extraChecked = Math.max(0, b.checked - includedChecked);
        return total + (extraChecked * 35); // $35 per checked bag
      }, 0);

      const seatTotal = selectedSeats.reduce((total, s) => total + (s.price || 0), 0);

      const { data, error } = await supabase.functions.invoke('amadeus-book-flight', {
        body: {
          flightOffer: flight,
          passengers: passengers,
          contactInfo: contactInfo,
          baseCost: basePrice,
          selectedSeats: selectedSeats,
          selectedBaggage: selectedBaggage,
          additionalFees: {
            baggage: baggageTotal,
            seats: seatTotal
          }
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
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Complete Your Flight Booking</DialogTitle>
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
          <div className="flex items-center justify-between space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center flex-shrink-0 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Passengers</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-border flex-shrink-0" />
            <div className={`flex items-center flex-shrink-0 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Seats</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-border flex-shrink-0" />
            <div className={`flex items-center flex-shrink-0 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Baggage</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-border flex-shrink-0" />
            <div className={`flex items-center flex-shrink-0 ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>4</div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Payment</span>
            </div>
          </div>

          {/* Step 1: Passenger Information */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-sm sm:text-base">Passenger {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        const originSegment = flight.itineraries?.[0]?.segments?.[0];
                        const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                        const originCountry = originSegment?.departure?.address?.countryCode;
                        const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                        const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;
                        return isInternational ? " (Required for International Flights)" : " (Optional for Domestic Flights)";
                      })()}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`passport-${index}`}>
                          Passport Number
                          {(() => {
                            const originSegment = flight.itineraries?.[0]?.segments?.[0];
                            const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                            const originCountry = originSegment?.departure?.address?.countryCode;
                            const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                            const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;
                            return isInternational ? " *" : "";
                          })()}
                        </Label>
                        <Input
                          id={`passport-${index}`}
                          value={passenger.passportNumber}
                          onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                          placeholder={(() => {
                            const originSegment = flight.itineraries?.[0]?.segments?.[0];
                            const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                            const originCountry = originSegment?.departure?.address?.countryCode;
                            const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                            const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;
                            return isInternational ? "Required" : "Optional";
                          })()}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`passportExpiry-${index}`}>
                          Expiry Date
                          {(() => {
                            const originSegment = flight.itineraries?.[0]?.segments?.[0];
                            const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                            const originCountry = originSegment?.departure?.address?.countryCode;
                            const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                            const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;
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
                            const originSegment = flight.itineraries?.[0]?.segments?.[0];
                            const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                            const originCountry = originSegment?.departure?.address?.countryCode;
                            const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                            const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Button 
                onClick={() => {
                  // Validate passenger info before proceeding (consistent with handleBooking)
                  const originSegment = flight.itineraries?.[0]?.segments?.[0];
                  const destinationSegment = flight.itineraries?.[0]?.segments?.slice(-1)[0];
                  const originCountry = originSegment?.departure?.address?.countryCode;
                  const destinationCountry = destinationSegment?.arrival?.address?.countryCode;
                  const isInternational = originCountry && destinationCountry && originCountry !== destinationCountry;

                  for (let i = 0; i < passengers.length; i++) {
                    const p = passengers[i];

                    const title = p.title?.trim();
                    const firstName = p.firstName?.trim();
                    const lastName = p.lastName?.trim();
                    const dateOfBirth = p.dateOfBirth?.trim();
                    const gender = p.gender?.trim();
                    const nationality = p.nationality?.trim();

                    if (!title) { toast.error(`Passenger ${i + 1}: Title is required`); return; }
                    if (!firstName) { toast.error(`Passenger ${i + 1}: First name is required`); return; }
                    if (!lastName) { toast.error(`Passenger ${i + 1}: Last name is required`); return; }
                    if (!dateOfBirth) { toast.error(`Passenger ${i + 1}: Date of birth is required`); return; }
                    if (!gender) { toast.error(`Passenger ${i + 1}: Gender is required`); return; }
                    if (!nationality) { toast.error(`Passenger ${i + 1}: Nationality is required`); return; }

                    if (isInternational) {
                      const passportNumber = p.passportNumber?.trim();
                      const passportExpiry = p.passportExpiry?.trim();
                      const passportCountry = p.passportCountry?.trim();
                      if (!passportNumber || !passportExpiry || !passportCountry) {
                        toast.error(`Passport details are required for international flights (Passenger ${i + 1})`);
                        return;
                      }
                    }
                  }
                  setStep(2);
                }} 
                className="w-full"
              >
                Continue to Seat Selection
              </Button>
            </div>
          )}

          {/* Step 2: Seat Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <SeatMapSelector
                flight={flight}
                passengers={numberOfTravelers}
                onSeatsSelected={(seats) => {
                  setSelectedSeats(seats);
                  setStep(3);
                }}
                selectedSeats={selectedSeats}
              />
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                Back to Passenger Details
              </Button>
            </div>
          )}

          {/* Step 3: Baggage Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <BaggageSelector
                flight={flight}
                passengers={numberOfTravelers}
                onBaggageSelected={(baggage) => {
                  setSelectedBaggage(baggage);
                  setStep(4);
                }}
                selectedBaggage={selectedBaggage}
              />
              <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                Back to Seat Selection
              </Button>
            </div>
          )}

          {/* Step 4: Contact & Payment Information */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Contact Information</h4>
              <p className="text-sm text-muted-foreground">All fields marked with * are required</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back to Baggage
                </Button>
                <Button 
                  onClick={() => {
                    // Validate contact info before booking
                    if (!contactInfo.email || !contactInfo.phone || !contactInfo.address || !contactInfo.city || !contactInfo.postalCode || !contactInfo.country) {
                      toast.error("Please complete all required contact and address fields");
                      return;
                    }
                    handleBooking();
                  }} 
                  disabled={loading} 
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    (() => {
                      const baggageFees = selectedBaggage.reduce((total, b) => {
                        const includedChecked = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0;
                        const extraChecked = Math.max(0, b.checked - includedChecked);
                        return total + (extraChecked * 35);
                      }, 0);
                      const seatFees = selectedSeats.reduce((total, s) => total + (s.price || 0), 0);
                      const total = markedUpPrice + baggageFees + seatFees;
                      return `Book for ${flight.price.currency} ${total.toFixed(2)}`;
                    })()
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
