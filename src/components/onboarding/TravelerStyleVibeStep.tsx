import { useState } from "react";

interface TravelerStyleVibeStepProps {
  onComplete: (data: TravelerPreferences) => void;
  initialData?: Partial<TravelerPreferences>;
}

export interface TravelerPreferences {
  // Travel Style & Vibe
  energyLevel?: string;
  vibeTriggers: string[];
  explorationStyle: string[];
  
  // Practical Constraints
  tripDuration?: string;
  budgetRange?: string;
  passportVisaNotes?: string;
  avoidRegions: string[];
  travelCompanions?: string;
  
  // Personal Interests
  activities: string[];
  specialInterests: string[];
  dietaryRestrictions: string[];
  
  // Deal Breakers & Must-Haves
  dealbreakers: string[];
  accommodationMustHaves: string[];
  planningStyle?: string;
  
  // Content & Sharing
  createsContent?: boolean;
  inspirationCreators: string[];
}

export function TravelerStyleVibeStep({ onComplete, initialData }: TravelerStyleVibeStepProps) {
  const [preferences, setPreferences] = useState<TravelerPreferences>({
    energyLevel: initialData?.energyLevel,
    vibeTriggers: initialData?.vibeTriggers || [],
    explorationStyle: initialData?.explorationStyle || [],
    tripDuration: initialData?.tripDuration,
    budgetRange: initialData?.budgetRange,
    passportVisaNotes: initialData?.passportVisaNotes || "",
    avoidRegions: initialData?.avoidRegions || [],
    travelCompanions: initialData?.travelCompanions,
    activities: initialData?.activities || [],
    specialInterests: initialData?.specialInterests || [],
    dietaryRestrictions: initialData?.dietaryRestrictions || [],
    dealbreakers: initialData?.dealbreakers || [],
    accommodationMustHaves: initialData?.accommodationMustHaves || [],
    planningStyle: initialData?.planningStyle,
    createsContent: initialData?.createsContent || false,
    inspirationCreators: initialData?.inspirationCreators || [],
  });

  const toggleInArray = (field: keyof TravelerPreferences, value: string) => {
    const currentArray = (preferences[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    setPreferences(prev => ({ ...prev, [field]: newArray }));
  };

  const setSingleValue = (field: keyof TravelerPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Travel Style & Vibe */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BFAD72]">
          Travel style & vibe
        </p>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            What's your ideal trip energy level?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {["Adventure-packed", "Balanced mix", "Relaxed exploration", "Total chill"].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.energyLevel === option
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("energyLevel", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            What makes a place feel "viral" or special to you?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Unique architecture",
              "Natural wonders",
              "Local culture",
              "Foodie scenes",
              "Hidden gems",
              "Instagrammable spots"
            ].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.vibeTriggers.includes(option)
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => toggleInArray("vibeTriggers", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Are you more into urban exploration, nature escapes, or a mix?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Urban", "Nature", "Mixed"].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-center text-sm transition-all ${
                  preferences.explorationStyle.includes(option)
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => toggleInArray("explorationStyle", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Practical Constraints */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BFAD72]">
          Practical constraints
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            What's your typical trip duration?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Weekend getaway", "Week-long", "2+ weeks"].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-center text-sm transition-all ${
                  preferences.tripDuration === option
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("tripDuration", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Budget range per trip?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {["Backpacker", "Mid-range", "Upper-mid", "Luxury"].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-center text-sm transition-all ${
                  preferences.budgetRange === option
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("budgetRange", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Travel companions?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {["Solo", "Partner", "Friends", "Family with kids"].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-center text-sm transition-all ${
                  preferences.travelCompanions === option
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("travelCompanions", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Interests */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BFAD72]">
          Personal interests
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            What activities get you hyped?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Hiking",
              "Nightlife",
              "Museums",
              "Extreme sports",
              "Spa days",
              "Music festivals",
              "Food tours"
            ].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.activities.includes(option)
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => toggleInArray("activities", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Any specific interests?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Street art",
              "Sustainable travel",
              "Wellness retreats",
              "Music scenes",
              "Local markets"
            ].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.specialInterests.includes(option)
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => toggleInArray("specialInterests", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deal Breakers */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BFAD72]">
          Deal breakers & must-haves
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Comfort level with planning vs. spontaneity?
          </p>
          <div className="grid gap-2">
            {[
              "I want everything planned",
              "Give me structure but room to explore",
              "I prefer totally spontaneous"
            ].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.planningStyle === option
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("planningStyle", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Must-haves for accommodation?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Central location",
              "Pool",
              "Unique stays",
              "Kitchen access",
              "Pet-friendly"
            ].map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  preferences.accommodationMustHaves.includes(option)
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => toggleInArray("accommodationMustHaves", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content & Sharing */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BFAD72]">
          Content & sharing
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0a2225]">
            Do you create travel content?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: true, label: "Yes, I create content" },
              { value: false, label: "No, just for myself" }
            ].map(option => (
              <button
                key={option.label}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-center text-sm transition-all ${
                  preferences.createsContent === option.value
                    ? "border-[#BFAD72] bg-[#0c4d47] text-[#E5DFC6]"
                    : "border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#BFAD72]"
                }`}
                onClick={() => setSingleValue("createsContent", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => onComplete(preferences)}
          className="w-full rounded-full bg-[#0a2225] px-6 py-4 text-sm font-semibold uppercase tracking-wide text-[#E5DFC6] transition-all hover:bg-[#0c4d47]"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
