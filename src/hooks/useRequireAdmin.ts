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

      // SECURITY: Check user_roles table, NOT profiles.role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!cancelled) {
        setAllowed(roles?.some(r => r.role === "admin") || false);
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
