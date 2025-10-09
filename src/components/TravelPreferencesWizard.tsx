import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles, Plane, Globe, Train, Hotel, UtensilsCrossed, Wallet, Target, ClipboardList } from "lucide-react";

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

  const steps = [
    {
      title: "Let's start simple",
      subtitle: "How do you like to travel?",
      icon: Plane,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">What types of trips do you enjoy?</Label>
            <p className="text-sm text-muted-foreground mb-4">Pick as many as you like</p>
            <div className="grid grid-cols-2 gap-3">
              {['Leisure', 'Business', 'Adventure', 'Cultural', 'Nature-focused', 'Relaxation / Wellness'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trip-${type}`}
                    checked={preferences.general?.tripTypes?.includes(type) || false}
                    onCheckedChange={() => toggleArrayValue('general', 'tripTypes', type)}
                  />
                  <Label htmlFor={`trip-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Who's your usual travel crew?</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Solo', 'Partner', 'Friends', 'Family', 'Group Tours'].map(companion => (
                <div key={companion} className="flex items-center space-x-2">
                  <Checkbox
                    id={`companion-${companion}`}
                    checked={preferences.general?.travelCompanions?.includes(companion) || false}
                    onCheckedChange={() => toggleArrayValue('general', 'travelCompanions', companion)}
                  />
                  <Label htmlFor={`companion-${companion}`} className="cursor-pointer">{companion}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">What's your sweet spot for trip length?</Label>
            <RadioGroup
              value={preferences.general?.idealTripLength}
              onValueChange={(value) => updatePreference('general', 'idealTripLength', value)}
            >
              {['Weekend (1–3 days)', 'Short (4–7 days)', 'Medium (8–14 days)', 'Long (2+ weeks)'].map(length => (
                <div key={length} className="flex items-center space-x-2">
                  <RadioGroupItem value={length} id={`length-${length}`} />
                  <Label htmlFor={`length-${length}`} className="cursor-pointer">{length}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "Where in the world?",
      subtitle: "Tell us about your dream destinations",
      icon: Globe,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Do you prefer staying close to home or exploring abroad?</Label>
            <div className="space-y-2">
              {['Domestic travel', 'International travel', 'No preference'].map(pref => (
                <div key={pref} className="flex items-center space-x-2">
                  <Checkbox
                    id={`travel-${pref}`}
                    checked={preferences.destination?.travelScope?.includes(pref) || false}
                    onCheckedChange={() => toggleArrayValue('destination', 'travelScope', pref)}
                  />
                  <Label htmlFor={`travel-${pref}`} className="cursor-pointer">{pref}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Any favorite countries or regions? (Optional)</Label>
            <Textarea
              placeholder="e.g., Japan, Mediterranean, Southeast Asia..."
              value={preferences.destination?.preferredRegions || ''}
              onChange={(e) => updatePreference('destination', 'preferredRegions', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-base mb-3 block">Places you'd rather skip? (Optional)</Label>
            <Textarea
              placeholder="No judgment here..."
              value={preferences.destination?.avoidRegions || ''}
              onChange={(e) => updatePreference('destination', 'avoidRegions', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-base mb-3 block">Do you enjoy returning to favorite spots?</Label>
            <RadioGroup
              value={preferences.destination?.returningPreference}
              onValueChange={(value) => updatePreference('destination', 'returningPreference', value)}
            >
              {['Yes', 'No', 'Occasionally'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`return-${option}`} />
                  <Label htmlFor={`return-${option}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "Getting there",
      subtitle: "Your transportation preferences",
      icon: Train,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">How do you like to travel?</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Flights', 'Trains', 'Car (road trips)', 'Cruises'].map(method => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`method-${method}`}
                    checked={preferences.transportation?.methods?.includes(method) || false}
                    onCheckedChange={() => toggleArrayValue('transportation', 'methods', method)}
                  />
                  <Label htmlFor={`method-${method}`} className="cursor-pointer">{method}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Preferred flight class</Label>
            <RadioGroup
              value={preferences.transportation?.flightClass}
              onValueChange={(value) => updatePreference('transportation', 'flightClass', value)}
            >
              {['Economy', 'Premium Economy', 'Business', 'First Class'].map(flightClass => (
                <div key={flightClass} className="flex items-center space-x-2">
                  <RadioGroupItem value={flightClass} id={`class-${flightClass}`} />
                  <Label htmlFor={`class-${flightClass}`} className="cursor-pointer">{flightClass}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">Layovers or direct flights?</Label>
            <RadioGroup
              value={preferences.transportation?.layoverPreference}
              onValueChange={(value) => updatePreference('transportation', 'layoverPreference', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="cursor-pointer">Direct flights only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="layovers" id="layovers" />
                <Label htmlFor="layovers" className="cursor-pointer">Open to layovers for better deals</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">Any loyalty programs? (Optional)</Label>
            <Input
              placeholder="e.g., Delta SkyMiles, Marriott Bonvoy..."
              value={preferences.transportation?.loyaltyPrograms || ''}
              onChange={(e) => updatePreference('transportation', 'loyaltyPrograms', e.target.value)}
            />
          </div>
        </div>
      )
    },
    {
      title: "Where you'll stay",
      subtitle: "Accommodation preferences",
      icon: Hotel,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">What type of places do you prefer?</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Hotels', 'Airbnb / Vacation Rentals', 'Hostels', 'Resorts', 'Boutique Hotels'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`accom-${type}`}
                    checked={preferences.accommodation?.types?.includes(type) || false}
                    onCheckedChange={() => toggleArrayValue('accommodation', 'types', type)}
                  />
                  <Label htmlFor={`accom-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Preferred style</Label>
            <RadioGroup
              value={preferences.accommodation?.class}
              onValueChange={(value) => updatePreference('accommodation', 'class', value)}
            >
              {['Budget', 'Mid-range', 'Luxury'].map(accomClass => (
                <div key={accomClass} className="flex items-center space-x-2">
                  <RadioGroupItem value={accomClass} id={`accom-class-${accomClass}`} />
                  <Label htmlFor={`accom-class-${accomClass}`} className="cursor-pointer">{accomClass}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">Must-have amenities</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Fast Wi-Fi', 'Kitchenette', 'Workspace', 'Pool', 'Gym', 'Pet-friendly', 'Free breakfast'].map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={preferences.accommodation?.amenities?.includes(amenity) || false}
                    onCheckedChange={() => toggleArrayValue('accommodation', 'amenities', amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer">{amenity}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Food & experiences",
      subtitle: "Tell us about your taste",
      icon: UtensilsCrossed,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Any dietary restrictions? (Optional)</Label>
            <Input
              placeholder="e.g., Vegetarian, Gluten-free, Halal..."
              value={preferences.food?.restrictions || ''}
              onChange={(e) => updatePreference('food', 'restrictions', e.target.value)}
            />
          </div>

          <div>
            <Label className="text-base mb-3 block">What kind of food experiences do you love?</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Local street food', 'Upscale dining', 'Vegetarian/Vegan', 'Halal/Kosher', 'Seafood-focused'].map(pref => (
                <div key={pref} className="flex items-center space-x-2">
                  <Checkbox
                    id={`food-${pref}`}
                    checked={preferences.food?.preferences?.includes(pref) || false}
                    onCheckedChange={() => toggleArrayValue('food', 'preferences', pref)}
                  />
                  <Label htmlFor={`food-${pref}`} className="cursor-pointer">{pref}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Up for food tours or cooking classes?</Label>
            <RadioGroup
              value={preferences.food?.foodExperiences}
              onValueChange={(value) => updatePreference('food', 'foodExperiences', value)}
            >
              {['Yes', 'No', 'Sometimes'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`food-exp-${option}`} />
                  <Label htmlFor={`food-exp-${option}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "Timing & budget",
      subtitle: "When and how much",
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Favorite times to travel? (Optional)</Label>
            <Input
              placeholder="e.g., Spring, avoid July-August..."
              value={preferences.timing?.preferredSeasons || ''}
              onChange={(e) => updatePreference('timing', 'preferredSeasons', e.target.value)}
            />
          </div>

          <div>
            <Label className="text-base mb-3 block">When do you like to travel?</Label>
            <RadioGroup
              value={preferences.timing?.peakPreference}
              onValueChange={(value) => updatePreference('timing', 'peakPreference', value)}
            >
              {['During off-peak times', 'During peak holiday seasons', 'Whenever a good deal comes up'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`peak-${option}`} />
                  <Label htmlFor={`peak-${option}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">How flexible are your dates?</Label>
            <RadioGroup
              value={preferences.timing?.flexibility}
              onValueChange={(value) => updatePreference('timing', 'flexibility', value)}
            >
              {['Very flexible', 'Somewhat flexible', 'Fixed dates only'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`flex-${option}`} />
                  <Label htmlFor={`flex-${option}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">Typical trip budget (excluding flights)</Label>
            <RadioGroup
              value={preferences.budget?.range}
              onValueChange={(value) => updatePreference('budget', 'range', value)}
            >
              {['Under $500', '$500–$1,000', '$1,000–$3,000', '$3,000–$5,000', '$5,000+'].map(range => (
                <div key={range} className="flex items-center space-x-2">
                  <RadioGroupItem value={range} id={`budget-${range}`} />
                  <Label htmlFor={`budget-${range}`} className="cursor-pointer">{range}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">What matters most to you?</Label>
            <p className="text-sm text-muted-foreground mb-3">Pick your top priorities</p>
            <div className="space-y-2">
              {['Comfort in accommodation', 'Flights and upgrades', 'Unique experiences', 'Food and dining', 'Convenience'].map(priority => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={preferences.budget?.priorities?.includes(priority) || false}
                    onCheckedChange={() => toggleArrayValue('budget', 'priorities', priority)}
                  />
                  <Label htmlFor={`priority-${priority}`} className="cursor-pointer">{priority}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What you love to do",
      subtitle: "Activities and pace",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">What activities get you excited?</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Hiking / Nature', 'Beaches / Relaxation', 'City tours / Museums', 'Cultural festivals', 
                'Shopping', 'Water sports / Diving', 'Adventure sports', 'Spa / Wellness', 'Nightlife / Bars'].map(activity => (
                <div key={activity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`activity-${activity}`}
                    checked={preferences.activities?.interests?.includes(activity) || false}
                    onCheckedChange={() => toggleArrayValue('activities', 'interests', activity)}
                  />
                  <Label htmlFor={`activity-${activity}`} className="cursor-pointer">{activity}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">What's your travel pace?</Label>
            <RadioGroup
              value={preferences.activities?.pace}
              onValueChange={(value) => updatePreference('activities', 'pace', value)}
            >
              {['Fast (see as much as possible)', 'Balanced', 'Slow (fewer places, more depth)'].map(pace => (
                <div key={pace} className="flex items-center space-x-2">
                  <RadioGroupItem value={pace} id={`pace-${pace}`} />
                  <Label htmlFor={`pace-${pace}`} className="cursor-pointer">{pace}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "Almost there!",
      subtitle: "Documentation & logistics",
      icon: ClipboardList,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Which passport(s) do you hold? (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">Helps with visa planning</p>
            <Input
              placeholder="e.g., US, UK..."
              value={preferences.documentation?.passports || ''}
              onChange={(e) => updatePreference('documentation', 'passports', e.target.value)}
            />
          </div>

          <div>
            <Label className="text-base mb-3 block">Are you open to destinations requiring:</Label>
            <div className="space-y-2">
              {['Visas', 'Vaccinations', 'Special permits'].map(requirement => (
                <div key={requirement} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req-${requirement}`}
                    checked={preferences.documentation?.openTo?.includes(requirement) || false}
                    onCheckedChange={() => toggleArrayValue('documentation', 'openTo', requirement)}
                  />
                  <Label htmlFor={`req-${requirement}`} className="cursor-pointer">{requirement}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">What should I help manage?</Label>
            <div className="space-y-2">
              {['Visa checks', 'COVID or entry requirements', 'Currency conversions', 'Travel insurance'].map(service => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`manage-${service}`}
                    checked={preferences.documentation?.aiManage?.includes(service) || false}
                    onCheckedChange={() => toggleArrayValue('documentation', 'aiManage', service)}
                  />
                  <Label htmlFor={`manage-${service}`} className="cursor-pointer">{service}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Personalize your experience",
      subtitle: "How should I help you best?",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">How should I learn your preferences?</Label>
            <RadioGroup
              value={preferences.personalization?.learningMode}
              onValueChange={(value) => updatePreference('personalization', 'learningMode', value)}
            >
              {['Ask for feedback after each trip', 'Learn passively from choices', 'Let me update manually'].map(mode => (
                <div key={mode} className="flex items-center space-x-2">
                  <RadioGroupItem value={mode} id={`learn-${mode}`} />
                  <Label htmlFor={`learn-${mode}`} className="cursor-pointer">{mode}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base mb-3 block">What kind of suggestions would you like?</Label>
            <div className="space-y-2">
              {['Deals based on your preferences', 'Destinations similar to past favorites', 
                'Completely new ideas based on trends', 'Mystery or surprise travel ideas'].map(suggestion => (
                <div key={suggestion} className="flex items-center space-x-2">
                  <Checkbox
                    id={`suggest-${suggestion}`}
                    checked={preferences.personalization?.suggestionTypes?.includes(suggestion) || false}
                    onCheckedChange={() => toggleArrayValue('personalization', 'suggestionTypes', suggestion)}
                  />
                  <Label htmlFor={`suggest-${suggestion}`} className="cursor-pointer">{suggestion}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            {(() => {
              const IconComponent = steps[currentStep].icon;
              return <IconComponent className="h-12 w-12 text-primary" strokeWidth={1.5} />;
            })()}
          </div>
          <h2 className="text-2xl font-chiffon mb-2">{steps[currentStep].title}</h2>
          <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
        </div>

        {steps[currentStep].content}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="h-10 px-5 py-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
          className="h-10 px-5 py-2 text-sm"
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              All Set!
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {currentStep < steps.length - 1 && (
        <p className="text-center text-sm text-muted-foreground">
          Feel free to skip questions - you can always update these later
        </p>
      )}
    </div>
  );
};

export default TravelPreferencesWizard;
