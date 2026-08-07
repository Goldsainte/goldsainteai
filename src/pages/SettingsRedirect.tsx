// /settings — a universal alias that forwards to the caller's real settings
// surface. Exists so that Stripe return URLs, receipt-email CTAs, and any
// future "settings" deep link have one stable target regardless of role.
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export default function SettingsRedirect() {
  const { isCreator, isAgent, loading } = useUserRole();
  const { search } = useLocation();

  if (loading) return null; // brief blank beats a flash of the wrong page

  if (isAgent) return <Navigate to={`/agent-settings${search}`} replace />;
  if (isCreator) return <Navigate to={`/creator-settings${search}`} replace />;

  // Traveler settings live on the dashboard's Settings tab; merge our query
  // params with the tab selector.
  const params = new URLSearchParams(search);
  params.set("tab", "settings");
  return <Navigate to={`/traveler?${params.toString()}`} replace />;
}
