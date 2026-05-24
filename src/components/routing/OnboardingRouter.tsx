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
            // If they already submitted an application, route to status —
            // not back to the empty application form.
            const { data: agentApp } = await supabase
              .from('agent_applications')
              .select('id, email, status')
              .eq('user_id', user.id)
              .in('status', ['pending_verification', 'verified', 'approved', 'under_review'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (agentApp) {
              setDestination(`/application/status?email=${encodeURIComponent(agentApp.email)}`);
            } else {
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
