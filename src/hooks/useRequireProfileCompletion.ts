import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useRequireProfileCompletion() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    async function checkProfileCompletion() {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_profile_complete, account_type')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile completion:', error);
          setIsChecking(false);
          return;
        }

        const needsCompletion = !profile?.is_profile_complete || 
                                !profile?.account_type ||
                                !['traveler', 'creator', 'agent'].includes(profile.account_type);

        if (needsCompletion) {
          navigate('/auth/complete-profile', { replace: true });
        } else {
          setIsComplete(true);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkProfileCompletion();
  }, [user, authLoading, navigate]);

  return { isChecking, isComplete };
}
