import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user) {
        if (!cancelled) setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Failed to load profile for admin guard", error);
          setProfileType(null);
        } else {
          setProfileType(data?.account_type ?? null);
        }
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || profileLoading) {
    return null;
  }

  if (!user || profileType !== "admin") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
