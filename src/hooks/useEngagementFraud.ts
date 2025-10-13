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

  const getUserIP = async (): Promise<string | null> => {
    try {
      // Try to get IP from a public API
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || null;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return null;
    }
  };

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
        let toastMessage = result.message || 'Action not allowed';
        let toastDescription = '';

        switch (result.reason) {
          case 'new_account':
            toastDescription = 'Please wait a bit before engaging with content';
            break;
          case 'rate_limit':
            const minutes = Math.ceil((result.retry_after || 3600) / 60);
            toastDescription = `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}`;
            break;
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
