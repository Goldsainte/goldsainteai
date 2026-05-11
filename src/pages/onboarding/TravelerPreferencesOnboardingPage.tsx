import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import TravelPreferencesWizard from "@/components/TravelPreferencesWizard";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Users } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export default function TravelerPreferencesOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [existingPrefs, setExistingPrefs] = useState<any>(null);
  const [isDiscoverable, setIsDiscoverable] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth?redirect=%2Fonboarding%2Ftraveler%2Fpreferences");
      return;
    }

    // Preload existing prefs if they exist
    const loadPrefs = async () => {
      const { data, error } = await supabase
        .from("user_travel_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading travel prefs", error);
        return;
      }

      if (data) {
        setExistingPrefs(data);
        setIsDiscoverable(data.is_discoverable || false);
        // Map existing data into wizard format
        setPreferences({
          general: {
            tripTypes: data.travel_style || [],
            travelCompanions: Array.isArray(data.travel_companions) 
              ? data.travel_companions 
              : data.travel_companions ? [data.travel_companions] : [],
          },
          destination: {
            preferredDestinations: data.preferred_destinations || [],
          },
          accommodation: {
            types: data.preferred_accommodation_types || [],
          },
          food: {
            restrictions: data.dietary_restrictions?.join(", ") || "",
          },
          budget: {
            range: data.budget_preference || "",
          },
        });
      }
    };

    loadPrefs();
  }, [authLoading, user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Transform wizard state into user_travel_preferences row
      const payload = {
        user_id: user.id,
        travel_style: preferences.general?.tripTypes || [],
        budget_preference: preferences.budget?.range || null,
        preferred_destinations: preferences.destination?.preferredDestinations || [],
        preferred_accommodation_types: preferences.accommodation?.types || [],
        preferred_airlines: preferences.transportation?.loyaltyPrograms
          ? preferences.transportation.loyaltyPrograms.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        dietary_restrictions: preferences.food?.restrictions
          ? preferences.food.restrictions.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        accessibility_needs: preferences.accessibility?.needs || [],
        travel_companions: preferences.general?.travelCompanions?.join(", ") || null,
        trip_frequency: preferences.general?.idealTripLength || null,
        booking_preferences: {
          timing: preferences.timing || {},
          transportation: preferences.transportation || {},
          vibe: preferences.vibe || {},
          planning: preferences.planning || {},
        },
        is_discoverable: isDiscoverable,
        last_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_travel_preferences")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.error("Error saving travel prefs", error);
        toast.error("Could not save your travel preferences.");
        setIsSaving(false);
        return;
      }

      // Mark onboarding complete now that preferences exist
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          is_profile_complete: true,
          welcome_shown: true,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile onboarding flag", profileError);
      }

      toast.success("Beautiful. Your Goldsainte profile is now tailored to you.");
      setIsSaving(false);
      
      // Redirect to collections page
      setTimeout(() => {
        navigate("/collections");
      }, 800);
    } catch (err) {
      console.error("Error in handleSave:", err);
      toast.error("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    
    // Mark onboarding complete even if skipping preferences
    await supabase
      .from("profiles")
      .update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        is_profile_complete: true,
        welcome_shown: true,
      })
      .eq("id", user.id);

    navigate("/marketplace");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse">
            <Sparkles className="h-8 w-8 mx-auto text-[#C7A962]" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7B892]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C7B892]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative container max-w-4xl py-6 sm:py-12 px-4">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton label="Back" to="/onboarding" />
        </div>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-0.5 bg-[#C7B892] mx-auto mb-6" />
          <p className="uppercase tracking-[0.25em] text-[10px] sm:text-[11px] text-[#7A7151] mb-4 font-medium">
            Goldsainte Onboarding
          </p>
          <h1 className="font-secondary text-[26px] md:text-[40px] leading-[1.15] text-[#0a2225] mb-4">
            Let's learn your travel signature
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#6E6650] leading-relaxed">
            Answer a few quick questions so we can curate storyboards, collections,
            and itineraries that feel like they were designed just for you.
          </p>
        </div>

        {/* Main Card with stacked card effect */}
        <div className="relative">
          {/* Decorative stacked cards behind */}
          <div className="absolute inset-x-2 top-3 bottom-0 rounded-[28px] bg-[#E5DFC6]/30 -z-10" />
          <div className="absolute inset-x-1 top-1.5 bottom-0 rounded-[28px] bg-[#E5DFC6]/50 -z-10" />
          
          <div className="rounded-[28px] border border-[#E5DFC6] bg-white/95 backdrop-blur-sm shadow-[0_24px_60px_rgba(10,34,37,0.12)]">
            <div className="p-5 sm:p-8 md:p-10">
              <TravelPreferencesWizard
                preferences={preferences}
                onPreferencesChange={setPreferences}
              />

              {/* Discovery Opt-in */}
              <div className="border-t border-[#E5DFC6]/60 pt-6 mt-8">
                <div className="flex items-start gap-4 p-4 sm:p-5 rounded-[20px] bg-[#F5EFE1]">
                  <Checkbox 
                    checked={isDiscoverable}
                    onCheckedChange={(checked) => (setIsDiscoverable)(checked === true)}
                    className="mt-0.5 data-[state=checked]:bg-[#C7B892]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#C7B892]/20 flex items-center justify-center">
                        <Users className="w-3 h-3 text-[#7A7151]" />
                      </div>
                      <p className="font-medium text-sm text-[#0a2225]">Let travel experts find me</p>
                    </div>
                    <p className="text-xs text-[#6E6650] leading-relaxed">
                      Verified agents and creators can see your travel preferences and proactively 
                      curate trips tailored to you. Your contact info stays private.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-[#E5DFC6]/40 mt-8">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[#6E6650] hover:text-[#0a2225] hover:bg-[#F5EFE1] text-sm rounded-full px-6"
                >
                  Skip for now
                </Button>
                
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white gap-2 shadow-lg shadow-[#0a2225]/20"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Finish & see my collections
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
