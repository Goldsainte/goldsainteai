import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plane, Globe, Train, Hotel, UtensilsCrossed, Wallet, Target, ClipboardList, Sparkles } from "lucide-react";
import { DestinationAutocompleteNominatim } from "@/components/preferences/DestinationAutocompleteNominatim";
import { LuxuryStepIndicator } from "@/components/onboarding/LuxuryStepIndicator";
import { LuxurySelectionCard } from "@/components/onboarding/LuxurySelectionCard";
import { LuxuryFormSection } from "@/components/onboarding/LuxuryFormSection";
import { cn } from "@/lib/utils";

interface TravelPreferencesWizardProps {
  preferences: any;
  onPreferencesChange: (preferences: any) => void;
}

const TravelPreferencesWizard = ({ preferences, onPreferencesChange }: TravelPreferencesWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const updatePreference = (category: string, field: string, value: any) => {
    onPreferencesChange({
      ...preferences,
      [category]: {
        ...(preferences[category] || {}),
        [field]: value
      }
    });
  };

  const toggleArrayValue = (category: string, field: string, value: string) => {
    const current = preferences[category]?.[field] || [];
    const newValue = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    updatePreference(category, field, newValue);
  };

  const setSingleValue = (category: string, field: string, value: string) => {
    updatePreference(category, field, value);
  };

  const steps = [
    {
      title: "Let's start simple",
      subtitle: "How do you like to travel?",
      icon: Plane,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="What types of trips do you enjoy?" helperText="Pick as many as you like">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Leisure', 'Business', 'Adventure', 'Cultural', 'Nature-focused', 'Relaxation / Wellness'].map(type => (
                <LuxurySelectionCard
                  key={type}
                  label={type}
                  selected={preferences.general?.tripTypes?.includes(type) || false}
                  onSelect={() => toggleArrayValue('general', 'tripTypes', type)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Who's your usual travel crew?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Solo', 'Partner', 'Friends', 'Family', 'Group Tours'].map(companion => (
                <LuxurySelectionCard
                  key={companion}
                  label={companion}
                  selected={preferences.general?.travelCompanions?.includes(companion) || false}
                  onSelect={() => toggleArrayValue('general', 'travelCompanions', companion)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="What's your sweet spot for trip length?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Weekend (1–3 days)', 'Short (4–7 days)', 'Medium (8–14 days)', 'Long (2+ weeks)'].map(length => (
                <LuxurySelectionCard
                  key={length}
                  label={length}
                  selected={preferences.general?.idealTripLength === length}
                  onSelect={() => setSingleValue('general', 'idealTripLength', length)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Where in the world?",
      subtitle: "Tell us about your dream destinations",
      icon: Globe,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="Do you prefer staying close to home or exploring abroad?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Domestic travel', 'International travel', 'No preference'].map(pref => (
                <LuxurySelectionCard
                  key={pref}
                  label={pref}
                  selected={preferences.destination?.travelScope?.includes(pref) || false}
                  onSelect={() => toggleArrayValue('destination', 'travelScope', pref)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Where do you dream of traveling?" helperText="We'll prioritize collections and storyboards featuring these places.">
            <DestinationAutocompleteNominatim
              value={preferences.destination?.preferredDestinations || []}
              onChange={(destinations) => updatePreference('destination', 'preferredDestinations', destinations)}
              maxSelections={12}
            />
          </LuxuryFormSection>

          <LuxuryFormSection title="Places you'd rather skip?" subtitle="Optional — no judgment here">
            <Textarea
              placeholder="e.g., Overly touristy spots, cold climates..."
              value={preferences.destination?.avoidRegions || ''}
              onChange={(e) => updatePreference('destination', 'avoidRegions', e.target.value)}
              className="min-h-[80px] rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>

          <LuxuryFormSection title="Do you enjoy returning to favorite spots?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Yes', 'No', 'Occasionally'].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.destination?.returningPreference === option}
                  onSelect={() => setSingleValue('destination', 'returningPreference', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Getting there",
      subtitle: "Your transportation preferences",
      icon: Train,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="How do you like to travel?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Flights', 'Trains', 'Car (road trips)', 'Cruises'].map(method => (
                <LuxurySelectionCard
                  key={method}
                  label={method}
                  selected={preferences.transportation?.methods?.includes(method) || false}
                  onSelect={() => toggleArrayValue('transportation', 'methods', method)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Preferred flight class">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Economy', 'Premium Economy', 'Business', 'First Class'].map(flightClass => (
                <LuxurySelectionCard
                  key={flightClass}
                  label={flightClass}
                  selected={preferences.transportation?.flightClass === flightClass}
                  onSelect={() => setSingleValue('transportation', 'flightClass', flightClass)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Layovers or direct flights?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LuxurySelectionCard
                label="Direct flights only"
                selected={preferences.transportation?.layoverPreference === 'direct'}
                onSelect={() => setSingleValue('transportation', 'layoverPreference', 'direct')}
                variant="single"
              />
              <LuxurySelectionCard
                label="Open to layovers for better deals"
                selected={preferences.transportation?.layoverPreference === 'layovers'}
                onSelect={() => setSingleValue('transportation', 'layoverPreference', 'layovers')}
                variant="single"
              />
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Any loyalty programs?" subtitle="Optional">
            <Input
              placeholder="e.g., Delta SkyMiles, Marriott Bonvoy..."
              value={preferences.transportation?.loyaltyPrograms || ''}
              onChange={(e) => updatePreference('transportation', 'loyaltyPrograms', e.target.value)}
              className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Where you'll stay",
      subtitle: "Accommodation preferences",
      icon: Hotel,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="What type of places do you prefer?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Hotels', 'Airbnb / Vacation Rentals', 'Hostels', 'Resorts', 'Boutique Hotels'].map(type => (
                <LuxurySelectionCard
                  key={type}
                  label={type}
                  selected={preferences.accommodation?.types?.includes(type) || false}
                  onSelect={() => toggleArrayValue('accommodation', 'types', type)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Preferred style">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Budget', 'Mid-range', 'Luxury'].map(accomClass => (
                <LuxurySelectionCard
                  key={accomClass}
                  label={accomClass}
                  selected={preferences.accommodation?.class === accomClass}
                  onSelect={() => setSingleValue('accommodation', 'class', accomClass)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Must-have amenities">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Fast Wi-Fi', 'Kitchenette', 'Workspace', 'Pool', 'Gym', 'Pet-friendly', 'Free breakfast'].map(amenity => (
                <LuxurySelectionCard
                  key={amenity}
                  label={amenity}
                  selected={preferences.accommodation?.amenities?.includes(amenity) || false}
                  onSelect={() => toggleArrayValue('accommodation', 'amenities', amenity)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Food & experiences",
      subtitle: "Tell us about your taste",
      icon: UtensilsCrossed,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="Any dietary restrictions?" subtitle="Optional">
            <Input
              placeholder="e.g., Vegetarian, Gluten-free, Halal..."
              value={preferences.food?.restrictions || ''}
              onChange={(e) => updatePreference('food', 'restrictions', e.target.value)}
              className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>

          <LuxuryFormSection title="What kind of food experiences do you love?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Local street food', 'Upscale dining', 'Vegetarian/Vegan', 'Halal/Kosher', 'Seafood-focused'].map(pref => (
                <LuxurySelectionCard
                  key={pref}
                  label={pref}
                  selected={preferences.food?.preferences?.includes(pref) || false}
                  onSelect={() => toggleArrayValue('food', 'preferences', pref)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Up for food tours or cooking classes?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Yes', 'No', 'Sometimes'].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.food?.foodExperiences === option}
                  onSelect={() => setSingleValue('food', 'foodExperiences', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Timing & budget",
      subtitle: "When and how much",
      icon: Wallet,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="Favorite times to travel?" subtitle="Optional">
            <Input
              placeholder="e.g., Spring, avoid July-August..."
              value={preferences.timing?.preferredSeasons || ''}
              onChange={(e) => updatePreference('timing', 'preferredSeasons', e.target.value)}
              className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>

          <LuxuryFormSection title="When do you like to travel?">
            <div className="grid grid-cols-1 gap-3">
              {['During off-peak times', 'During peak holiday seasons', 'Whenever a good deal comes up'].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.timing?.peakPreference === option}
                  onSelect={() => setSingleValue('timing', 'peakPreference', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="How flexible are your dates?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Very flexible', 'Somewhat flexible', 'Fixed dates only'].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.timing?.flexibility === option}
                  onSelect={() => setSingleValue('timing', 'flexibility', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Typical trip budget" subtitle="Excluding flights">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Under $500', '$500–$1,000', '$1,000–$3,000', '$3,000–$5,000', '$5,000+'].map(range => (
                <LuxurySelectionCard
                  key={range}
                  label={range}
                  selected={preferences.budget?.range === range}
                  onSelect={() => setSingleValue('budget', 'range', range)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Activities & interests",
      subtitle: "What lights you up when you travel?",
      icon: Target,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="What do you love doing on trips?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Museums & Art', 'Hiking & Outdoors', 'Beach & Water', 'Nightlife & Bars', 'Shopping', 'Historical sites', 'Wildlife & Safaris', 'Wellness & Spas'].map(activity => (
                <LuxurySelectionCard
                  key={activity}
                  label={activity}
                  selected={preferences.activities?.interests?.includes(activity) || false}
                  onSelect={() => toggleArrayValue('activities', 'interests', activity)}
                  variant="multi"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Any accessibility needs?" subtitle="Optional — helps us curate better">
            <Input
              placeholder="e.g., Wheelchair access, mobility aids..."
              value={preferences.accessibility?.needs || ''}
              onChange={(e) => updatePreference('accessibility', 'needs', e.target.value)}
              className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Your travel vibe",
      subtitle: "Are you a planner or a free spirit?",
      icon: Sparkles,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="How do you prefer to plan?">
            <div className="grid grid-cols-1 gap-3">
              {['Every detail mapped out', 'Rough itinerary, room to wander', 'Totally spontaneous'].map(style => (
                <LuxurySelectionCard
                  key={style}
                  label={style}
                  selected={preferences.vibe?.planningStyle === style}
                  onSelect={() => setSingleValue('vibe', 'planningStyle', style)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="How do you like to pace your trips?">
            <div className="grid grid-cols-1 gap-3">
              {['Packed schedule', 'Balanced with downtime', 'Slow & relaxed'].map(pace => (
                <LuxurySelectionCard
                  key={pace}
                  label={pace}
                  selected={preferences.vibe?.pace === pace}
                  onSelect={() => setSingleValue('vibe', 'pace', pace)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Prefer touristy highlights or hidden gems?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Touristy', 'Hidden gems', 'Mix of both'].map(preference => (
                <LuxurySelectionCard
                  key={preference}
                  label={preference}
                  selected={preferences.vibe?.touristPreference === preference}
                  onSelect={() => setSingleValue('vibe', 'touristPreference', preference)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>
        </div>
      )
    },
    {
      title: "Almost done!",
      subtitle: "A few final touches",
      icon: ClipboardList,
      content: (
        <div className="space-y-8">
          <LuxuryFormSection title="Would you like help with itinerary planning?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["Yes, I'd love curated itineraries", "No, just inspiration is fine"].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.planning?.wantsItineraries === option}
                  onSelect={() => setSingleValue('planning', 'wantsItineraries', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Would you use a travel concierge?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Yes, for complex trips', 'Maybe, for special occasions', 'No, I prefer DIY'].map(option => (
                <LuxurySelectionCard
                  key={option}
                  label={option}
                  selected={preferences.planning?.conciergeInterest === option}
                  onSelect={() => setSingleValue('planning', 'conciergeInterest', option)}
                  variant="single"
                />
              ))}
            </div>
          </LuxuryFormSection>

          <LuxuryFormSection title="Any additional notes?" subtitle="Optional">
            <Textarea
              placeholder="Anything else that shapes how you travel..."
              value={preferences.planning?.additionalNotes || ''}
              onChange={(e) => updatePreference('planning', 'additionalNotes', e.target.value)}
              className="min-h-[100px] rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
            />
          </LuxuryFormSection>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Luxury Step Indicator */}
      <LuxuryStepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step <= currentStep) setCurrentStep(step);
        }}
      />

      {/* Step Card */}
      <div className="rounded-[24px] border border-[#E5DFC6] bg-[#FDFBF7] p-6 sm:p-8">
        {/* Step Header — left aligned to match form content below */}
        <div className="text-left mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F5EFE1] mb-4">
            <currentStepData.icon className="w-6 h-6 text-[#7A7151]" />
          </div>
          <h2 className="font-secondary text-2xl sm:text-3xl text-[#0a2225] mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-sm text-[#6E6650]">{currentStepData.subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {currentStepData.content}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className={cn(
            "rounded-full px-6 text-[#6E6650] hover:text-[#0a2225] hover:bg-[#F5EFE1]",
            currentStep === 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep
                  ? "bg-[#C7B892] w-6"
                  : index < currentStep
                  ? "bg-[#C7B892]"
                  : "bg-[#E5DFC6]"
              )}
            />
          ))}
        </div>

        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className={cn(
            "rounded-full px-6 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white",
            currentStep === steps.length - 1 && "opacity-0 pointer-events-none"
          )}
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default TravelPreferencesWizard;
