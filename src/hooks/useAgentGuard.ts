import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AgentGuardStatus = "none" | "pending" | "verified" | "rejected" | null;

type AgentGuardState = {
  loading: boolean;
  isAgent: boolean;
  isVerified: boolean;
  status: AgentGuardStatus;
};

export function useAgentGuard(): AgentGuardState {
  const [state, setState] = useState<AgentGuardState>({
    loading: true,
    isAgent: false,
    isVerified: false,
    status: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState({
          loading: false,
          isAgent: false,
          isVerified: false,
          status: "none",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type, agent_verification_status")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const accountType = profile?.account_type;
      const status = (profile?.agent_verification_status || "none") as AgentGuardStatus;
      const isAgent = accountType === "agent" || accountType === "admin";

      setState({
        loading: false,
        isAgent,
        isVerified: isAgent && status === "verified",
        status,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
