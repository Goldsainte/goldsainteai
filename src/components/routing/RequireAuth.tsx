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

  return children;
}
