import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRequireAdmin() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setAllowed(profile?.role === "admin");
        setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { checking, allowed };
}
