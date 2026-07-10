import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripeConnectStatus {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  payout_schedule?: string;
  requirements?: any;
}

export const StripeConnectOnboarding = () => {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    // Stripe redirects back whenever the user EXITS onboarding — completed or
    // not — so the URL param alone never proves success. Verify first.
    const params = new URLSearchParams(window.location.search);
    const returnedFromStripe = params.get('onboarding') === 'complete';
    if (returnedFromStripe || params.get('refresh') === 'true') {
      window.history.replaceState({}, '', '/agent-dashboard');
    }

    (async () => {
      const fresh = await checkStatus();
      if (!returnedFromStripe) return;
      if (fresh?.onboarding_complete) {
        toast.success('Stripe Connect onboarding completed!');
      } else {
        toast.info('Stripe setup isn\'t finished yet — click "Continue Setup" to pick up where you left off.');
      }
    })();
  }, []);

  const checkStatus = async (): Promise<StripeConnectStatus | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-stripe-connect-status');
      
      if (error) throw error;
      setStatus(data);
      return data as StripeConnectStatus;
    } catch (error: any) {
      console.error('Error checking Stripe Connect status:', error);
      toast.error('Failed to check payment account status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setOnboarding(true);
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding');
      
      if (error) throw error;
      
      // Open Stripe onboarding in new tab
      window.open(data.url, '_blank');
      toast.info('Complete onboarding in the new tab, then return here.');
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      toast.error('Failed to start onboarding process');
    } finally {
      setOnboarding(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Account Setup</CardTitle>
        <CardDescription>
          Connect your bank account to receive payments from customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to set up your payment account before you can receive payments for completed jobs.
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
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {status.charges_enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>Charges {status.charges_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {status.payouts_enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>Payouts {status.payouts_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>

              {status.payouts_enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Daily Automatic Payouts</span>
                  <Badge variant="outline" className="text-xs">
                    {status.payout_schedule || 'daily'}
                  </Badge>
                </div>
              )}
            </div>

            {!status.onboarding_complete && (
              <Alert>
                <AlertDescription className="text-xs">
                  Complete your account setup to start receiving payments. 
                  You may need to provide additional information.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!status?.connected ? (
            <Button 
              onClick={startOnboarding} 
              disabled={onboarding}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {onboarding ? 'Opening...' : 'Set Up Payment Account'}
            </Button>
          ) : !status.onboarding_complete ? (
            <>
              <Button 
                onClick={startOnboarding} 
                disabled={onboarding}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue Setup
              </Button>
              <Button 
                variant="outline"
                onClick={checkStatus}
                disabled={loading}
              >
                Refresh Status
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={checkStatus}
              disabled={loading}
              className="w-full"
            >
              Refresh Status
            </Button>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong> When a job is completed and approved, you receive 85% of your quoted price directly to your bank account within 1-2 business days (daily automatic payouts). Goldsainte keeps 15% as a success fee. Customers pay your quoted price + 3% service fee.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
