// src/components/account/AccountHealthCard.tsx
import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getAccountHealthSummary, AccountHealthSummary } from "@/services/accountHealthService";

type Props = {
  role: "creator" | "agent";
};

export function AccountHealthCard({ role }: Props) {
  const [summary, setSummary] = useState<AccountHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAccountHealthSummary();
        if (!cancelled) setSummary(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load account health.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 text-[11px]">
        <p className="text-[#8D8D8D]">Checking your account health…</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 text-[11px]">
        <p className="text-[#8D8D8D]">
          We couldn't load your account health right now.
        </p>
      </div>
    );
  }

  const { indicator, icon, color, label, description } = interpretHealth(summary, role);

  return (
    <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 text-[11px] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Account health
            </p>
            <p className="text-[12px] font-semibold">{label}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px]"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {indicator}
        </span>
      </div>

      <p className="text-[10px] text-[#4a4a4a]">{description}</p>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#4a4a4a] pt-1 border-t border-[#E5DFC6]">
        <div>
          <p className="text-[#8D8D8D]">Reports about you</p>
          <p className="font-semibold">{summary.reports_against_count}</p>
          {summary.last_report_at && (
            <p className="text-[9px] text-[#8D8D8D]">
              Last: {new Date(summary.last_report_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div>
          <p className="text-[#8D8D8D]">Safety reminders triggered</p>
          <p className="font-semibold">{summary.safety_events_count}</p>
          {summary.last_safety_event_at && (
            <p className="text-[9px] text-[#8D8D8D]">
              Last: {new Date(summary.last_safety_event_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <p className="text-[9px] text-[#8D8D8D]">
        Keep messaging and payments on Goldsainte, and use clear, respectful
        communication. That's how you stay eligible for more briefs and
        higher-value trips.
      </p>
    </div>
  );
}

function interpretHealth(summary: AccountHealthSummary, role: "creator" | "agent") {
  const { reports_against_count, safety_events_count } = summary;

  // Very simple heuristic to start
  if (reports_against_count === 0 && safety_events_count <= 3) {
    return {
      indicator: "Healthy",
      icon: <CheckCircle2 className="h-4 w-4 text-[#0c4d47]" />,
      color: { bg: "#d4e7dd", text: "#0c4d47" },
      label: "You're in good standing",
      description:
        role === "creator"
          ? "You're playing by the rules and keeping conversations where they belong. Brands and agents are more likely to trust creators with a clean record."
          : "You're operating like a true partner. Travelers and creators can see your professionalism in how you keep everything on-platform.",
    };
  }

  if (reports_against_count <= 2 && safety_events_count <= 10) {
    return {
      indicator: "Review suggested",
      icon: <AlertTriangle className="h-4 w-4 text-[#BFAD72]" />,
      color: { bg: "#f5e9c5", text: "#6d5223" },
      label: "Take a moment to review our house rules",
      description:
        "You've had a few safety reminders or reports. Re-reading our guidelines on on-platform communication and payments will help keep your account in great standing.",
    };
  }

  return {
    indicator: "At risk",
    icon: <Shield className="h-4 w-4 text-[#783d3d]" />,
    color: { bg: "#f0d1d1", text: "#5b2c2c" },
    label: "Your account may be limited if behavior continues",
    description:
      "We've seen several reports or attempts to move trips off-platform. To protect travelers, creators and agents, continued issues may affect your visibility or booking privileges.",
  };
}
