import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Smart onboarding router that redirects users to the correct onboarding flow
 * based on their account type
 */
export function OnboardingRouter() {
  const { user, isLoading: authLoading } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function determineDestination() {
      if (authLoading) return;
      
      if (!user) {
        setDestination('/auth');
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('account_type, onboarding_completed, is_profile_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile for onboarding:', error);
          // Default to traveler preferences if we can't determine
          setDestination('/onboarding/traveler/preferences');
          setIsLoading(false);
          return;
        }

        // No account type yet - send to role picker
        if (!profile?.account_type) {
          setDestination('/auth/complete-profile');
          setIsLoading(false);
          return;
        }

        // Route based on account type
        switch (profile.account_type) {
          case 'traveler':
            // Travelers go straight to Traveler Hub
            setDestination('/traveler');
            break;
          case 'creator':
            // Creators go to creator onboarding
            setDestination('/onboarding/creator');
            break;
          case 'agent': {
            // Email not yet confirmed → back to signup with resend UI,
            // never to a dead-end "verify your email" page.
            if (!user.email_confirmed_at) {
              setDestination('/auth?mode=signup&role=agent');
              break;
            }
            const { data: agentApp } = await supabase
              .from('agent_applications')
              .select('id, email, status, stripe_verification_session_id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!agentApp) {
              setDestination('/apply/agent');
            } else if (agentApp.status === 'verified' || agentApp.status === 'approved') {
              setDestination('/partner');
            } else if (agentApp.stripe_verification_session_id) {
              // Stripe Identity is in progress
              setDestination(`/application/status?email=${encodeURIComponent(agentApp.email)}`);
            } else {
              // Application row exists but no Stripe session yet — resume the form.
              setDestination('/apply/agent');
            }
            break;
          }
          case 'brand': {
            const { data: brandApp } = await supabase
              .from('brand_applications')
              .select('id, primary_contact_email, status')
              .eq('user_id', user.id)
              .in('status', ['pending_verification', 'verified', 'approved', 'under_review'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (brandApp) {
              setDestination(`/application/status?email=${encodeURIComponent(brandApp.primary_contact_email)}`);
            } else {
              setDestination('/apply/brand');
            }
            break;
          }
          default:
            // Fallback to traveler preferences
            setDestination('/onboarding/traveler/preferences');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error in onboarding router:', err);
        setDestination('/onboarding/traveler/preferences');
        setIsLoading(false);
      }
    }

    determineDestination();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (destination) {
    return <Navigate to={destination} replace />;
  }

  return null;
}
