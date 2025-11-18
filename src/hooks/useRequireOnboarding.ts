import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useRequireOnboarding() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setChecking(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const target = location.pathname;
        sessionStorage.setItem('returnTo', target);
        navigate(`/auth?returnTo=${encodeURIComponent(target)}`, {
          replace: true,
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("account_type, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding/profile", { replace: true });
        return;
      }

      if (!cancelled) {
        setAllowed(true);
        setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate, location]);

  return { checking, allowed };
}
