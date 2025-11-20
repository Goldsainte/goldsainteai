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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex flex-col items-center mb-8">
          <img src={logomark} alt="Logo" className="h-16 w-16 mb-4" />
          <h1 className="text-4xl font-secondary text-primary mb-2">Welcome to Goldsainte AI</h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl">
            Let's personalize your travel experience. Fill out your preferences so we can provide you with the best recommendations.
          </p>
        </div>

        <Card className="border-[#E5DFC6] bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-display text-[#0a2225]">Tell us about your travel style</CardTitle>
            <CardDescription className="text-[#4a4a4a]">
              Help us personalize your experience and match you with the perfect trips, creators, and agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TravelerStyleVibeStep 
              onComplete={handleSubmit}
            />
            
            <div className="mt-6 text-center">
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