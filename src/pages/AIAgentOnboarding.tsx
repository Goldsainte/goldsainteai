import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceSelector } from "@/components/VoiceSelector";
import TravelPreferencesWizard from "@/components/TravelPreferencesWizard";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import logomark from "@/assets/logomark-gold.webp";

export default function AIAgentOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Agent configuration state
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [agentName, setAgentName] = useState("Concierge");
  const [travelPreferences, setTravelPreferences] = useState<any>({});

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    
    try {
      // Save AI agent profile
      const { error: agentError } = await supabase
        .from('ai_agent_profiles')
        .insert({
          user_id: user?.id,
          agent_name: agentName,
          voice: selectedVoice,
          travel_preferences: travelPreferences,
        });

      if (agentError) throw agentError;

      toast.success(`${agentName} is ready to help you plan amazing trips!`);
      navigate('/');
    } catch (error: any) {
      console.error('Error saving AI agent:', error);
      toast.error('Failed to create your AI agent. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="font-secondary">
                Welcome! Let's Create Your Personal AI Travel Agent
              </CardTitle>
              <CardDescription>
                In just 3 quick steps, you'll have a personalized AI assistant that understands your travel style perfectly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceSelect={setSelectedVoice}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div>
            <TravelPreferencesWizard
              preferences={travelPreferences}
              onPreferencesChange={setTravelPreferences}
            />
          </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Your AI Agent is Ready!
              </CardTitle>
              <CardDescription>
                Here's what we've set up for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agent Name</p>
                  <p className="text-lg font-semibold">{agentName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Voice</p>
                  <p className="text-lg font-semibold capitalize">{selectedVoice}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Travel Preferences</p>
                  <p className="text-sm mt-1">
                    {Object.keys(travelPreferences).length > 0 
                      ? `You've configured ${Object.keys(travelPreferences).length} preference categories`
                      : "You can add preferences anytime in your profile"}
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>What happens next?</strong> Your AI agent will:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-muted-foreground">
                  <li>Understand your unique travel style</li>
                  <li>Suggest perfect destinations and experiences</li>
                  <li>Remember your preferences in every conversation</li>
                  <li>Plan trips tailored exactly to you</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-6 sm:py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img src={logomark} alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4" loading="lazy"/>
          <h1 className="text-2xl sm:text-4xl font-secondary text-primary mb-2 text-center">Build Your AI Travel Agent</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {renderStep()}

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSaving}
            className="h-12 sm:h-10 px-6 sm:px-5 py-3 sm:py-2 text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={isSaving} className="h-12 sm:h-10 px-6 sm:px-5 py-3 sm:py-2 text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2">
              Next
              <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving} className="h-12 sm:h-10 px-6 sm:px-5 py-3 sm:py-2 text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2">
              {isSaving ? "Creating..." : "Complete Setup"}
              <Check className="h-5 w-5 sm:h-4 sm:w-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
            disabled={isSaving}
          >
            Skip for now (you can set this up later)
          </button>
        </div>
      </div>
    </div>
  );
}