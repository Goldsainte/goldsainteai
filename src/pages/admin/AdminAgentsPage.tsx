import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

interface AgentRow {
  id: string;
  name: string;
  email: string | null;
  kycStatus: string | null;
  verificationStatus: string | null;
  licenseNumber: string | null;
  licenseAuthority: string | null;
  licenseState: string | null;
  avgRating: number | null;
  ratingCount: number | null;
  totalBookings: number;
}

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  none: "Not submitted",
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .eq("role", "agent")
          .order("created_at", { ascending: false });

        if (profileError) throw profileError;

        const ids = data?.map((row) => row.id).filter(Boolean) as string[];
        const bookingCounts = new Map<string, number>();
        if (ids.length) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id, agent_id")
            .in("agent_id", ids);

          (bookings || []).forEach((row) => {
            if (row.agent_id) {
              bookingCounts.set(
                row.agent_id,
                (bookingCounts.get(row.agent_id) || 0) + 1
              );
            }
          });
        }

        if (cancelled) return;

        setAgents(
          (data || []).map((row) => ({
            id: row.id,
            name: row.full_name || row.username || "Goldsainte agent",
            email: null,
            kycStatus: "none",
            verificationStatus: "pending",
            licenseNumber: null,
            licenseAuthority: null,
            licenseState: null,
            avgRating: 0,
            ratingCount: 0,
            totalBookings: bookingCounts.get(row.id) || 0,
          }))
        );
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load agents", err);
          setError(err.message || "Could not load agents");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = async (agentId: string, status: "verified" | "pending" | "rejected") => {
    setUpdatingId(agentId);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ agent_verification_status: status })
        .eq("id", agentId);

      if (updateError) throw updateError;

      setAgents((prev) => prev.map((agent) => (agent.id === agentId ? { ...agent, verificationStatus: status } : agent)));
    } catch (err: any) {
      console.error("Failed to update agent status", err);
      setError(err.message || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1) - (b.verificationStatus === "pending" ? -1 : 1));
  }, [agents]);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-4 py-1 text-[11px]">
          <ShieldCheck className="h-3 w-3 text-[#0c4d47]" />
          Travel agents
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-[24px] leading-tight">Verification &amp; performance</h1>
          <p className="text-sm max-w-3xl text-[#4a4a4a]">
            Review license details, KYC status, and booking performance. Only verified agents should be able to take bookings.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading agents…</p>
        ) : sortedAgents.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No agents found.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#E5DFC6] bg-white/95">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#4a4a4a] uppercase tracking-[0.12em]">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">KYC status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">Performance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map((agent) => (
                  <tr key={agent.id} className="border-t border-[#F1EBDA]">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-[12px] text-[#4a4a4a]">{agent.email || "No email on file"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={agent.kycStatus || "none"} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={agent.verificationStatus || "pending"} tone="verification" />
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      {agent.licenseNumber ? (
                        <div className="space-y-1">
                          <p className="font-semibold">{agent.licenseNumber}</p>
                          <p>
                            {agent.licenseAuthority || "Authority"} · {agent.licenseState || "State"}
                          </p>
                        </div>
                      ) : (
                        <p>No license on file</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <p>Bookings: <span className="font-semibold">{agent.totalBookings}</span></p>
                      <p>
                        Rating:{" "}
                        {agent.avgRating ? `${agent.avgRating.toFixed(1)} (${agent.ratingCount || 0})` : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(agent.id, "verified")}
                          disabled={updatingId === agent.id}
                          className="inline-flex items-center gap-1 rounded-full border border-[#0c4d47] px-3 py-1 text-[12px] font-semibold text-[#0c4d47] hover:bg-[#0c4d47]/10"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(agent.id, "rejected")}
                          disabled={updatingId === agent.id}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

type StatusBadgeProps = {
  label: string;
  tone?: "verification" | "kyc";
};

function StatusBadge({ label, tone = "kyc" }: StatusBadgeProps) {
  const normalized = label?.toLowerCase?.() || "none";
  const text = STATUS_LABELS[normalized] || normalized;
  const color = tone === "verification" ? "bg-[#E3F2EF] text-[#0c4d47]" : "bg-[#F1EBDA] text-[#4a4a4a]";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${color}`}>
      {text}
    </span>
  );
}
