import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface JobFormData {
  // Basic Overview
  title: string;
  jobCategory: string;
  description: string;
  
  // Client Info
  clientName?: string;
  contactMethod: string;
  timeZone?: string;
  preferredContactHours?: string;
  
  // Travel Details - Transportation
  departureCity?: string;
  destinationCity?: string;
  departureDate?: string;
  returnDate?: string;
  numberOfTravelers?: number;
  ageGroups?: string;
  classPreference?: string;
  airlinePreferences?: string;
  baggageRequirements?: string;
  visaRequired?: boolean;
  
  // Accommodation
  hotelDestination?: string;
  checkInDate?: string;
  checkOutDate?: string;
  hotelStars?: string;
  hotelBrand?: string;
  roomRequirements?: string;
  budgetPerNight?: number;
  specialNeeds?: string;
  
  // Full Itinerary
  destinations?: string;
  tripDuration?: string;
  tripType?: string[];
  preferredActivities?: string[];
  budgetTotal?: number;
  includedServices?: string[];
  
  // Payment
  budgetMin: number;
  budgetMax: number;
  currency: string;
  paymentMethod?: string;
  commissionTerms?: string;
  
  // Timeline
  quoteDeadline?: string;
  jobStartDate?: string;
  tripDate?: string;
  urgencyLevel?: string;
  
  // Agent Requirements
  languagesRequired?: string;
  experienceRequired?: string;
  accreditationRequired?: string;
  
  // Deliverables
  expectedDeliverables?: string[];
}

interface ComprehensiveJobFormProps {
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel: () => void;
}

export const ComprehensiveJobForm = ({ onSubmit, onCancel }: ComprehensiveJobFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    jobCategory: "",
    description: "",
    contactMethod: "platform",
    budgetMin: 0,
    budgetMax: 0,
    currency: "USD",
  });

  const totalSteps = 6;

  const updateField = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayField = (field: keyof JobFormData, value: string, checked: boolean) => {
    const currentArray = (formData[field] as string[]) || [];
    if (checked) {
      updateField(field, [...currentArray, value]);
    } else {
      updateField(field, currentArray.filter(item => item !== value));
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex-1 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i + 1 <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="ml-4 text-sm text-muted-foreground whitespace-nowrap">
          Step {step} of {totalSteps}
        </span>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="pr-4 space-y-6">
        {/* Step 1: Basic Overview */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Job Overview</h3>
            
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Book Round-Trip Flights from NYC to Tokyo"
                required
              />
            </div>

            <div>
              <Label htmlFor="jobCategory">Job Category *</Label>
              <select
                id="jobCategory"
                value={formData.jobCategory}
                onChange={(e) => updateField("jobCategory", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Select category</option>
                <option value="flight">Flight Booking</option>
                <option value="hotel">Hotel Booking</option>
                <option value="car">Car Rental</option>
                <option value="package">Full Package/Itinerary Planning</option>
                <option value="custom">Custom/Other (Visa, Insurance, etc.)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="description">Brief Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your travel requirements..."
                rows={4}
                required
              />
            </div>

            <Separator />

            <h4 className="font-semibold">Client Information</h4>
            
            <div>
              <Label htmlFor="clientName">Client Name (Optional)</Label>
              <Input
                id="clientName"
                value={formData.clientName || ""}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="Leave blank to remain anonymous"
              />
            </div>

            <div>
              <Label htmlFor="contactMethod">Preferred Contact Method *</Label>
              <select
                id="contactMethod"
                value={formData.contactMethod}
                onChange={(e) => updateField("contactMethod", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="platform">Platform Messaging</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Input
                  id="timeZone"
                  value={formData.timeZone || ""}
                  onChange={(e) => updateField("timeZone", e.target.value)}
                  placeholder="EST, PST, GMT, etc."
                />
              </div>
              <div>
                <Label htmlFor="preferredContactHours">Preferred Contact Hours</Label>
                <Input
                  id="preferredContactHours"
                  value={formData.preferredContactHours || ""}
                  onChange={(e) => updateField("preferredContactHours", e.target.value)}
                  placeholder="9 AM - 5 PM"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Transportation Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transportation Details</h3>
            <p className="text-sm text-muted-foreground">
              Fill this section if your job involves flight or transportation booking
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departureCity">Departure City/Airport</Label>
                <Input
                  id="departureCity"
                  value={formData.departureCity || ""}
                  onChange={(e) => updateField("departureCity", e.target.value)}
                  placeholder="JFK, New York"
                />
              </div>
              <div>
                <Label htmlFor="destinationCity">Destination</Label>
                <Input
                  id="destinationCity"
                  value={formData.destinationCity || ""}
                  onChange={(e) => updateField("destinationCity", e.target.value)}
                  placeholder="NRT, Tokyo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate || ""}
                  onChange={(e) => updateField("departureDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="returnDate">Return Date</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={formData.returnDate || ""}
                  onChange={(e) => updateField("returnDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfTravelers">Number of Travelers</Label>
                <Input
                  id="numberOfTravelers"
                  type="number"
                  value={formData.numberOfTravelers || ""}
                  onChange={(e) => updateField("numberOfTravelers", parseInt(e.target.value))}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="ageGroups">Age Groups</Label>
                <Input
                  id="ageGroups"
                  value={formData.ageGroups || ""}
                  onChange={(e) => updateField("ageGroups", e.target.value)}
                  placeholder="2 adults, 1 child"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="classPreference">Class Preference</Label>
              <select
                id="classPreference"
                value={formData.classPreference || ""}
                onChange={(e) => updateField("classPreference", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select class</option>
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>

            <div>
              <Label htmlFor="airlinePreferences">Airline Preferences/Exclusions</Label>
              <Textarea
                id="airlinePreferences"
                value={formData.airlinePreferences || ""}
                onChange={(e) => updateField("airlinePreferences", e.target.value)}
                placeholder="Prefer: Delta, United. Exclude: Spirit"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="baggageRequirements">Baggage Requirements</Label>
              <Input
                id="baggageRequirements"
                value={formData.baggageRequirements || ""}
                onChange={(e) => updateField("baggageRequirements", e.target.value)}
                placeholder="2 checked bags, 1 carry-on"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visaRequired"
                checked={formData.visaRequired || false}
                onCheckedChange={(checked) => updateField("visaRequired", checked)}
              />
              <Label htmlFor="visaRequired">Visa assistance required</Label>
            </div>
          </div>
        )}

        {/* Step 3: Accommodation Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Accommodation Details</h3>
            <p className="text-sm text-muted-foreground">
              Fill this section if your job involves hotel or accommodation booking
            </p>

            <div>
              <Label htmlFor="hotelDestination">Hotel Destination</Label>
              <Input
                id="hotelDestination"
                value={formData.hotelDestination || ""}
                onChange={(e) => updateField("hotelDestination", e.target.value)}
                placeholder="Paris, France"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInDate">Check-in Date</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={formData.checkInDate || ""}
                  onChange={(e) => updateField("checkInDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="checkOutDate">Check-out Date</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={formData.checkOutDate || ""}
                  onChange={(e) => updateField("checkOutDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hotelStars">Hotel Star Rating</Label>
                <select
                  id="hotelStars"
                  value={formData.hotelStars || ""}
                  onChange={(e) => updateField("hotelStars", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Any</option>
                  <option value="3">3 Star</option>
                  <option value="4">4 Star</option>
                  <option value="5">5 Star</option>
                  <option value="luxury">Luxury/Boutique</option>
                </select>
              </div>
              <div>
                <Label htmlFor="hotelBrand">Hotel Brand Preference</Label>
                <Input
                  id="hotelBrand"
                  value={formData.hotelBrand || ""}
                  onChange={(e) => updateField("hotelBrand", e.target.value)}
                  placeholder="Marriott, Hilton, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="roomRequirements">Room Requirements</Label>
              <Textarea
                id="roomRequirements"
                value={formData.roomRequirements || ""}
                onChange={(e) => updateField("roomRequirements", e.target.value)}
                placeholder="2 rooms, king beds, connecting rooms"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="budgetPerNight">Budget per Night ($)</Label>
              <Input
                id="budgetPerNight"
                type="number"
                value={formData.budgetPerNight || ""}
                onChange={(e) => updateField("budgetPerNight", parseFloat(e.target.value))}
                placeholder="200"
              />
            </div>

            <div>
              <Label htmlFor="specialNeeds">Special Needs/Amenities</Label>
              <Textarea
                id="specialNeeds"
                value={formData.specialNeeds || ""}
                onChange={(e) => updateField("specialNeeds", e.target.value)}
                placeholder="Wheelchair accessible, pet-friendly, pool, gym"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Step 4: Full Itinerary Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Full Travel Itinerary</h3>
            <p className="text-sm text-muted-foreground">
              Fill this section for complete trip planning services
            </p>

            <div>
              <Label htmlFor="destinations">Destinations to Include</Label>
              <Textarea
                id="destinations"
                value={formData.destinations || ""}
                onChange={(e) => updateField("destinations", e.target.value)}
                placeholder="Rome, Florence, Venice, Milan"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="tripDuration">Trip Duration</Label>
              <Input
                id="tripDuration"
                value={formData.tripDuration || ""}
                onChange={(e) => updateField("tripDuration", e.target.value)}
                placeholder="10 days, 2 weeks"
              />
            </div>

            <div>
              <Label>Type of Experience</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["luxury", "adventure", "cultural", "romantic", "family-friendly", "budget"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tripType-${type}`}
                      checked={(formData.tripType || []).includes(type)}
                      onCheckedChange={(checked) => handleArrayField("tripType", type, checked as boolean)}
                    />
                    <Label htmlFor={`tripType-${type}`} className="capitalize">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Activities</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["tours", "culinary", "nature", "shopping", "nightlife", "museums"].map((activity) => (
                  <div key={activity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`activity-${activity}`}
                      checked={(formData.preferredActivities || []).includes(activity)}
                      onCheckedChange={(checked) => handleArrayField("preferredActivities", activity, checked as boolean)}
                    />
                    <Label htmlFor={`activity-${activity}`} className="capitalize">{activity}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Included Services</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["flights", "hotels", "transfers", "guides", "insurance", "visa"].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service}`}
                      checked={(formData.includedServices || []).includes(service)}
                      onCheckedChange={(checked) => handleArrayField("includedServices", service, checked as boolean)}
                    />
                    <Label htmlFor={`service-${service}`} className="capitalize">{service}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment & Timeline */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Details</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budgetMin">Minimum Budget *</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => updateField("budgetMin", parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="budgetMax">Maximum Budget *</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => updateField("budgetMax", parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
              <Input
                id="paymentMethod"
                value={formData.paymentMethod || ""}
                onChange={(e) => updateField("paymentMethod", e.target.value)}
                placeholder="Credit card, bank transfer, etc."
              />
            </div>

            <div>
              <Label htmlFor="commissionTerms">Commission Terms</Label>
              <Input
                id="commissionTerms"
                value={formData.commissionTerms || ""}
                onChange={(e) => updateField("commissionTerms", e.target.value)}
                placeholder="Fixed fee, percentage, etc."
              />
            </div>

            <Separator />

            <h3 className="text-lg font-semibold">Timeline & Urgency</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quoteDeadline">Quote Deadline</Label>
                <Input
                  id="quoteDeadline"
                  type="date"
                  value={formData.quoteDeadline || ""}
                  onChange={(e) => updateField("quoteDeadline", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jobStartDate">Job Start Date</Label>
                <Input
                  id="jobStartDate"
                  type="date"
                  value={formData.jobStartDate || ""}
                  onChange={(e) => updateField("jobStartDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tripDate">Trip Date</Label>
                <Input
                  id="tripDate"
                  type="date"
                  value={formData.tripDate || ""}
                  onChange={(e) => updateField("tripDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <select
                id="urgencyLevel"
                value={formData.urgencyLevel || ""}
                onChange={(e) => updateField("urgencyLevel", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select urgency</option>
                <option value="flexible">Flexible</option>
                <option value="moderate">Moderate</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 6: Agent Requirements & Deliverables */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Requirements</h3>

            <div>
              <Label htmlFor="languagesRequired">Languages Required</Label>
              <Input
                id="languagesRequired"
                value={formData.languagesRequired || ""}
                onChange={(e) => updateField("languagesRequired", e.target.value)}
                placeholder="English, Spanish, French"
              />
            </div>

            <div>
              <Label htmlFor="experienceRequired">Experience Required</Label>
              <Textarea
                id="experienceRequired"
                value={formData.experienceRequired || ""}
                onChange={(e) => updateField("experienceRequired", e.target.value)}
                placeholder="Experience with luxury travel, European tours, etc."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="accreditationRequired">Accreditation Requirements</Label>
              <Input
                id="accreditationRequired"
                value={formData.accreditationRequired || ""}
                onChange={(e) => updateField("accreditationRequired", e.target.value)}
                placeholder="IATA, CLIA, etc."
              />
            </div>

            <Separator />

            <h3 className="text-lg font-semibold">Expected Deliverables</h3>

            <div className="space-y-3">
              {["Proposed itinerary", "Booking confirmations", "Invoice", "Customer support post-booking", "Emergency contact", "Travel insurance documents"].map((deliverable) => (
                <div key={deliverable} className="flex items-center space-x-2">
                  <Checkbox
                    id={`deliverable-${deliverable}`}
                    checked={(formData.expectedDeliverables || []).includes(deliverable)}
                    onCheckedChange={(checked) => handleArrayField("expectedDeliverables", deliverable, checked as boolean)}
                  />
                  <Label htmlFor={`deliverable-${deliverable}`}>{deliverable}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </ScrollArea>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Cancel" : "Previous"}
        </Button>

        {step < totalSteps ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!formData.title || !formData.jobCategory || !formData.description)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.budgetMin || !formData.budgetMax}
          >
            Post Job
          </Button>
        )}
      </div>
    </div>
  );
};
