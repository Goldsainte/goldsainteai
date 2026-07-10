import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RegistryBar } from "@/components/admin/RegistryBar";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminRole() {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setChecking(false);
        }
        return;
      }

      // SECURITY: Check user_roles table, NOT profiles.account_type
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!cancelled) {
        setIsAdmin(roles?.some(r => r.role === "admin") || false);
        setChecking(false);
      }
    }

    checkAdminRole();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || checking) {
    return null;
  }

  if (!user || !isAdmin) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // Every admin page inherits the Registry chrome — one mount, twenty rooms.
  return (
    <>
      <RegistryBar />
      {children}
    </>
  );
}
