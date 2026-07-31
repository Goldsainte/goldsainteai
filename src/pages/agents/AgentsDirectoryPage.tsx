import { useEffect, useState } from "react";
import PartnerDirectory from "@/components/partner/PartnerDirectory";
import SpecialistsFoundingPage from "@/pages/agents/SpecialistsFoundingPage";
import { supabase } from "@/integrations/supabase/client";

/* Velvet-rope threshold (31 Jul, founder decision): while fewer than this
 * many specialists are live, /agents shows the editorial founding-cohort
 * page instead of a near-empty directory grid — an empty roster suppresses
 * the very applications that would fill it. The counting query sees exactly
 * what a visitor's directory would (RLS: active agents), so the grid returns
 * automatically the day the threshold is crossed. Raise or lower this one
 * number to move the rope. */
const FOUNDING_COHORT_THRESHOLD = 5;

export default function AgentsDirectoryPage() {
  const [agentCount, setAgentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("travel_agents")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        if (!cancelled) setAgentCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bare cream while counting (fast head-only query) — never flash the
  // wrong page.
  if (agentCount === null) return <div className="flex-1 bg-[#FDF9F0]" />;

  return agentCount >= FOUNDING_COHORT_THRESHOLD ? (
    <PartnerDirectory kind="agent" />
  ) : (
    <SpecialistsFoundingPage />
  );
}
