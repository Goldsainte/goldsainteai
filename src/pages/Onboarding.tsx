import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TravelerStyleVibeStep, TravelerPreferences } from "@/components/onboarding/TravelerStyleVibeStep";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logomark from "@/assets/logomark-gold.png";

export default function Onboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (preferences: TravelerPreferences) => {
    setIsSaving(true);
    
    try {
      if (!user?.id) throw new Error("No user");

      // Map preferences to user_travel_preferences structure
      const prefsData = {
        user_id: user.id,
        travel_style: preferences.explorationStyle,
        budget_preference: preferences.budgetRange,
        travel_companions: preferences.travelCompanions,
        dietary_restrictions: preferences.dietaryRestrictions,
        booking_preferences: {
          energy_level: preferences.energyLevel,
          vibe_triggers: preferences.vibeTriggers,
          trip_duration: preferences.tripDuration,
          passport_visa_notes: preferences.passportVisaNotes,
          avoid_regions: preferences.avoidRegions,
          activities: preferences.activities,
          special_interests: preferences.specialInterests,
          dealbreakers: preferences.dealbreakers,
          must_haves: preferences.accommodationMustHaves,
          planning_style: preferences.planningStyle,
          is_creator_like_traveler: preferences.createsContent,
          inspiration_creators: preferences.inspirationCreators,
        },
      };

      const { error: prefsError } = await supabase
        .from('user_travel_preferences')
        .upsert(prefsData, { onConflict: 'user_id' });

      if (prefsError) throw prefsError;

      // Mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          is_profile_complete: true 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Welcome! Your travel preferences have been saved.');
      navigate('/traveler');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225]/95 to-[#0a2225]/80 py-12 px-4 text-[#E5DFC6]">
      <div className="container mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2 text-[#E5DFC6] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logomark} alt="Logo" className="h-12 w-12" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#E5DFC6]/70">Goldsainte traveler</p>
              <h1 className="font-secondary text-3xl md:text-4xl leading-tight">Tell us how you like to travel</h1>
            </div>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 text-sm text-[#E5DFC6]/80">
            <p className="font-semibold text-[#E5DFC6]">Madison</p>
            <p className="mt-1">Think of this as a conversation. Tap the pills that feel right — energy level, what makes a place go viral to you, city vs. nature. We’ll turn it into your traveler DNA.</p>
          </div>
        </div>

        <Card className="border-[#E5DFC6]/60 bg-white text-[#0a2225]">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Your travel DNA</CardTitle>
            <CardDescription className="text-[#4a4a4a]">
              Mobile-first, single-column, with pill buttons so you can answer quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TravelerStyleVibeStep onComplete={handleSubmit} />

            <div className="text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-[#7A7151] hover:text-[#0a2225] transition-colors"
                disabled={isSaving}
              >
                Skip for now (you can set preferences later)
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}