import { Navigate, useLocation } from "react-router-dom";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Users whose profile setup is confirmed complete this session — checked once,
// then every subsequent RequireAuth mount is free.
const completedProfileCache = new Set<string>();

// Paths a signed-in-but-incomplete user must still be able to reach.
function isOnboardingPath(pathname: string): boolean {
  return pathname.startsWith("/onboarding") || pathname.startsWith("/auth");
}

type RequireAuthProps = PropsWithChildren<{
  children: JSX.Element;
}>;

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  // null = not yet checked, true = complete, false = must finish onboarding
  const [profileComplete, setProfileComplete] = useState<boolean | null>(() =>
    user && completedProfileCache.has(user.id) ? true : null
  );

  useEffect(() => {
    let cancelled = false;
    async function checkProfile() {
      if (!user) return;
      if (completedProfileCache.has(user.id)) {
        setProfileComplete(true);
        return;
      }
      if (isOnboardingPath(location.pathname)) return; // no check needed here
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_profile_complete, onboarding_completed, first_name")
          .eq("id", user.id)
          .maybeSingle();
        // Same predicate as CompleteProfile.tsx — keep these in sync.
        const isFinished =
          profile?.is_profile_complete === true ||
          profile?.onboarding_completed === true ||
          Boolean(profile?.first_name && String(profile.first_name).trim());
        if (!cancelled) {
          if (isFinished) completedProfileCache.add(user.id);
          setProfileComplete(isFinished);
        }
      } catch (err) {
        // On a failed check, let the user through rather than trapping them —
        // the redirector at /auth/complete-profile is the enforcement of last
        // resort and this guard re-runs on the next navigation anyway.
        console.error("RequireAuth profile check failed:", err);
        if (!cancelled) setProfileComplete(true);
      }
    }
    checkProfile();
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF9F0' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C7A962] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    const currentPath = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${currentPath}`} replace />;
  }

  // Signed in, but profile setup unfinished: send them back to finish it.
  // Onboarding/auth paths are exempt so the flow itself stays reachable.
  if (!isOnboardingPath(location.pathname)) {
    if (profileComplete === null) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF9F0' }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C7A962] border-t-transparent" />
        </div>
      );
    }
    if (profileComplete === false) {
      return <Navigate to="/auth/complete-profile" replace />;
    }
  }

  return children;
}
