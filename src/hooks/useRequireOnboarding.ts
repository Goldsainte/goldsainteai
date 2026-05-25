import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireOnboarding() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (authLoading) {
        return;
      }

      setChecking(true);

      if (!user) {
        const target = location.pathname;
        sessionStorage.setItem('returnTo', target);
        navigate(`/auth?returnTo=${encodeURIComponent(target)}`, {
          replace: true,
        });
        return;
      }

      let profile: {
        account_type?: string | null;
        onboarding_completed?: boolean | null;
        has_completed_creator_onboarding?: boolean | null;
      } | null = null;
      let error: any = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const result = await supabase
          .from("profiles")
          .select("account_type, onboarding_completed, has_completed_creator_onboarding")
          .eq("id", user.id)
          .maybeSingle();

        profile = result.data;
        error = result.error;

        if (profile?.account_type || (error && error.code !== 'PGRST116')) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }

      if (error) {
        console.error(error);
      }

      if (!profile?.account_type) {
        navigate('/auth/complete-profile', { replace: true });
        return;
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
      
      // Travelers are always allowed through (no legacy AI intake gate)
      if (accountType === 'traveler') {
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      // For others, check standard flag
      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
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
  }, [authLoading, user, navigate, location.pathname]);

  return { checking, allowed };
}
