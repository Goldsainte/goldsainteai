import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!data?.onboarding_completed) {
        navigate('/onboarding');
      } else {
        setChecking(false);
      }
    }

    checkOnboarding();
  }, [navigate]);

  if (checking) return null;
  return <>{children}</>;
}
