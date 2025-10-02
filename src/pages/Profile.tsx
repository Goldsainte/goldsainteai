import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Settings, Heart, Briefcase, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAgent, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your profile and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold">Payment & Preferences</h3>
                  <Button 
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('customer-portal');
                        if (error) throw error;
                        if (data?.url) {
                          window.open(data.url, '_blank');
                        }
                      } catch (error: any) {
                        toast.error('Failed to open payment portal');
                      }
                    }}
                    variant="outline" 
                    className="w-full justify-start gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Payment Methods
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/booking-preferences')}
                  >
                    <Settings className="h-4 w-4" />
                    Booking Preferences & AI Assistant
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <Button onClick={() => navigate('/favorites')} variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    View Favorites
                  </Button>
                  <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full justify-start gap-2">
                    <Briefcase className="h-4 w-4" />
                    Post Complex Booking Job
                  </Button>
                  {!isAgent && !roleLoading && (
                    <Button onClick={() => navigate('/agent-onboarding')} variant="outline" className="w-full justify-start gap-2">
                      <Briefcase className="h-4 w-4" />
                      Become a Travel Agent
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
