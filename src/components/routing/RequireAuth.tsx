import { Navigate, useLocation } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";

type RequireAuthProps = PropsWithChildren<{
  children: JSX.Element;
}>;

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    const redirectTarget = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  return children;
}
