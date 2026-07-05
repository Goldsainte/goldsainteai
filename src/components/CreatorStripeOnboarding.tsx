import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripeStatus {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  payout_schedule: string;
  requirements?: any;
}

export const CreatorStripeOnboarding = () => {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    
    // Check URL params for onboarding completion.
    // stripe-connect-link returns to ?stripe=success / ?stripe=refresh;
    // older links may still use ?onboarding=complete / ?refresh=true.
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === 'complete' || params.get('stripe') === 'success') {
      toast({
        title: "Setup Complete!",
        description: "Your payout account has been configured successfully.",
      });
      checkStatus();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('refresh') === 'true' || params.get('stripe') === 'refresh') {
      checkStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Listen for global "start-stripe-onboarding" trigger from checklist CTAs
  useEffect(() => {
    const handler = () => {
      // Scroll the card into view, then kick off onboarding
      const el = document.getElementById('payout-setup');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startOnboarding();
    };
    window.addEventListener('start-stripe-onboarding', handler);
    return () => window.removeEventListener('start-stripe-onboarding', handler);
  }, []);

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-creator-stripe-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error: any) {
      console.error('Error checking status:', error);
      toast({
        title: "Error",
        description: "Failed to check payout status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    setOnboarding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not Authenticated",
          description: "Please sign in to set up payouts",
          variant: "destructive",
        });
        setOnboarding(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-connect-link', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { origin: window.location.origin },
      });

      if (error) {
        console.error('[STRIPE-ONBOARDING] Error:', error);
        setOnboarding(false);
        throw error;
      }
      
      if (!data?.url) {
        setOnboarding(false);
        throw new Error('No onboarding URL received from server');
      }

      // 🧭 Force navigation outside the router context
      
      // Use the simplest, most reliable method first
      if (typeof window !== "undefined") {
        // Try to break out of any iframe/SPA context
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.assign(data.url);
          } else {
            window.location.assign(data.url);
          }
        } catch (e) {
          console.error('[STRIPE-ONBOARDING] Redirect failed:', e);
          // Final fallback
          window.location.href = data.url;
        }
      }
      
      // Don't set loading back to false - page should be redirecting
      
    } catch (error: any) {
      console.error('[STRIPE-ONBOARDING] Full error:', error);
      
      let errorTitle = "Error";
      let errorMessage = error.message || "Failed to start onboarding";
      
      // Handle specific Stripe Connect errors
      if (error.message?.includes('Connect')) {
        errorTitle = "Stripe Connect Not Enabled";
        errorMessage = "Please contact support to enable creator payouts. Stripe Connect must be activated for this feature.";
      } else if (error.message?.includes('managing losses') || error.message?.includes('platform-profile')) {
        errorTitle = "Platform Setup Required";
        errorMessage = "Administrator needs to complete Stripe platform profile setup. Please contact support.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="payout-setup" style={{ scrollMarginTop: '6rem' }}>
      <CardHeader>
        <CardTitle>
          Payout Setup
        </CardTitle>
        <CardDescription>
          Configure your bank account to receive earnings from virtual gifts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your bank account to start receiving payments from your fans
            </AlertDescription>
          </Alert>
        )}

        {status?.connected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge variant={status.onboarding_complete ? "default" : "secondary"}>
                {status.onboarding_complete ? "Active" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Payouts Enabled</span>
              {status.payouts_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Payout Schedule
              </span>
              <Badge variant="outline">Daily</Badge>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={status?.connected && status.onboarding_complete ? checkStatus : startOnboarding}
            disabled={onboarding || loading}
            className="w-full h-12"
          >
            {onboarding ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Opening Stripe...
              </span>
            ) : 
             status?.connected && status.onboarding_complete ? "Refresh Status" : 
             status?.connected ? "Continue Setup" : 
             "Set Up Payouts"}
          </Button>
          
          {status?.connected && !status.onboarding_complete && (
            <p className="text-xs text-center text-muted-foreground">
              After completing setup in Stripe, return here and click "Refresh Status"
            </p>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong> When fans send you virtual gifts, Goldsainte keeps 30% and you receive 70% directly to your bank account daily.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
