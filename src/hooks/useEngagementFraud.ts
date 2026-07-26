import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EngagementCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  retry_after?: number;
  remaining?: number;
}

export const useEngagementFraud = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  // IP LOOKUP REMOVED (Jul 26). This called api.ipify.org from the browser on
  // every engagement action. Three problems, all live:
  //   1. Ad/tracker blockers block it, so it threw "TypeError: Load failed"
  //      and surfaced as an error in monitoring for a real user session.
  //   2. It sent our users' IP addresses to an unrelated third party.
  //   3. A browser-reported IP is trivially spoofable, so it was weak evidence
  //      for a FRAUD control in the first place.
  // can_perform_engagement takes p_ip_address with DEFAULT NULL and guards
  // every use with `IF p_ip_address IS NOT NULL`, so omitting it simply skips
  // the per-IP limb; the per-user limbs (account age, rate ceilings) still
  // apply. Proper fix is server-side: read the caller IP from request headers
  // in an edge function and pass it through. Tracked for post-launch.
  const getUserIP = async (): Promise<string | null> => null;

  const checkEngagement = async (
    actionType: 'like' | 'comment' | 'share' | 'follow'
  ): Promise<boolean> => {
    if (!user) return false;

    setIsChecking(true);
    try {
      const ipAddress = await getUserIP();

      const { data, error } = await supabase.rpc('can_perform_engagement', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_ip_address: ipAddress,
      });

      if (error) {
        console.error('Engagement check error:', error);
        return true; // Allow on error to avoid blocking legitimate users
      }

      const result = data as unknown as EngagementCheckResult;

      if (!result.allowed) {
        const toastMessage = result.message || 'Action not allowed';
        let toastDescription = '';

        switch (result.reason) {
          case 'new_account':
            toastDescription = 'Please wait a bit before engaging with content';
            break;
          case 'rate_limit': {
            const minutes = Math.ceil((result.retry_after || 3600) / 60);
            toastDescription = `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}`;
            break;
          }
          case 'restricted':
            toastDescription = 'Your account has temporary restrictions. Contact support if you believe this is an error.';
            break;
          case 'ip_abuse':
            toastDescription = 'Suspicious activity detected. Please try again later.';
            break;
        }

        toast({
          title: toastMessage,
          description: toastDescription,
          variant: 'destructive',
        });

        return false;
      }

      // Record the engagement action
      const userAgent = navigator.userAgent;
      await supabase.rpc('record_engagement_action', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });

      return true;
    } catch (error) {
      console.error('Engagement check failed:', error);
      return true; // Allow on error
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkEngagement,
    isChecking,
  };
};
