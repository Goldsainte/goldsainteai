import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "traveler" | "creator" | "agent";

// Pages where welcome modal should NOT appear
const EXCLUDED_PATH_PREFIXES = [
  "/transparency-agreement",
  "/privacy-policy",
  "/terms-of-service",
  "/creator-agreement",
  "/trust-safety",
  "/cancellation-refund-policy",
  "/auth",
  "/onboarding",
  "/apply",
  "/application",
  "/legal",
];

export function useWelcomeModal() {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    // Check if current path should exclude the modal
    const shouldExclude = EXCLUDED_PATH_PREFIXES.some(prefix =>
      location.pathname.startsWith(prefix)
    );

    if (shouldExclude) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("account_type, welcome_shown, display_name, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (!profile) {
        setLoading(false);
        return;
      }

      if (!cancelled) {
        const name = profile.display_name || profile.full_name || null;
        setDisplayName(name);
        setAccountType(profile.account_type as AccountType | null);

        if (!profile.welcome_shown) {
          setOpen(true);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const dismiss = async () => {
    setOpen(false);
    // Fire and forget update
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ welcome_shown: true })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to set welcome_shown", error);
    }
  };

  return { open, dismiss, accountType, displayName, loading };
}
