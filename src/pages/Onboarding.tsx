import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComprehensivePreferencesForm } from "@/components/ComprehensivePreferencesForm";
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

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    
    try {
      const prefsData = {
        user_id: user?.id,
        ...formData,
      };

      const { error } = await supabase
        .from('user_booking_preferences')
        .insert(prefsData);

      if (error) throw error;

      toast.success('Welcome! Your preferences have been saved.');
      navigate('/');
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set Your Travel Preferences</CardTitle>
            <CardDescription>
              These preferences will be used to customize your search results and help our AI provide better recommendations.
              You can always update them later in your account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComprehensivePreferencesForm 
              onSubmit={handleSubmit}
              isLoading={isSaving}
            />
            
            <div className="mt-6 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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