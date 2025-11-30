import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TravelPreferencesWizard from "@/components/TravelPreferencesWizard";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";

export default function TravelerPreferencesOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [existingPrefs, setExistingPrefs] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth?returnTo=/onboarding/traveler/preferences");
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
        // Map existing data into wizard format
        setPreferences({
          general: {
            tripTypes: data.travel_style || [],
            travelCompanions: Array.isArray(data.travel_companions) 
              ? data.travel_companions 
              : data.travel_companions ? [data.travel_companions] : [],
          },
          destination: {
            preferredRegions: data.preferred_destinations?.join(", ") || "",
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
        preferred_destinations: preferences.destination?.preferredRegions
          ? preferences.destination.preferredRegions.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
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
      <div className="container max-w-4xl py-10 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-0.5 bg-[#C7A962] mx-auto mb-6" />
          <p className="uppercase tracking-[0.25em] text-[10px] text-muted-foreground mb-4">
            Goldsainte Onboarding
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl text-[#0a2225] mb-4">
            Let's learn your travel signature
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Answer a few quick questions so we can curate storyboards, collections,
            and itineraries that feel like they were designed just for you.
          </p>
        </div>

        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardContent className="p-6 md:p-8">
            <TravelPreferencesWizard
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-border/40 mt-8">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Skip for now
              </Button>
              
              <Button
                size="lg"
                className="rounded-full px-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white gap-2"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
