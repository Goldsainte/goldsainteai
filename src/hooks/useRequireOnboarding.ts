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
        .select("account_type, onboarding_completed, has_completed_creator_onboarding")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      // Check onboarding completion based on role
      const accountType = profile?.account_type;
      
      // For creators, check both flags (backward compatibility)
      if (accountType === 'creator') {
        if (profile?.onboarding_completed || profile?.has_completed_creator_onboarding) {
          // Creator has completed onboarding - allow access
          if (!cancelled) {
            setAllowed(true);
            setChecking(false);
          }
          return;
        }
        // Incomplete creator - redirect to creator onboarding
        navigate("/onboarding/creator", { replace: true });
        return;
      }
      
      // For agents, redirect to application
      if (accountType === 'agent') {
        if (!profile?.onboarding_completed) {
          navigate("/apply/agent", { replace: true });
          return;
        }
      }
      
      // For travelers and others, check standard flag
      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding/traveler/preferences", { replace: true });
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
