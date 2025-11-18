// src/pages/admin/AdminHomePage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export default function AdminHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingAgents, setPendingAgents] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);
  const [pendingProposals, setPendingProposals] = useState(0);
  const [tripRequests, setTripRequests] = useState(0);

  useEffect(() => {
    async function loadAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/admin');
        return navigate("/auth?returnTo=/admin");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.account_type !== "admin") {
        setError("You do not have admin access.");
        return;
      }

      await loadCounts();
      setLoading(false);
    }

    async function loadCounts() {
      const [agents, proposals, trips, requests] = await Promise.all([
        supabase
          .from("agent_applications")
          .select("id", { count: "exact" })
          .eq("verification_status", "pending"),

        supabase
          .from("trip_proposals")
          .select("id", { count: "exact" })
          .eq("status", "pending"),

        supabase
          .from("trips")
          .select("id", { count: "exact" }),

        supabase
          .from("marketplace_jobs")
          .select("id", { count: "exact" })
          .eq("status", "open"),
      ]);

      setPendingAgents(agents.count || 0);
      setPendingDisputes(0); // Placeholder - no disputes table yet
      setPendingProposals(proposals.count || 0);
      setTripRequests(requests.count || 0);
    }

    loadAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] p-8 text-[#0a2225]">
        <p className="text-[12px]">Loading admin dashboard…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] p-8 text-red-600">
        <p className="text-[12px]">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="max-w-5xl mx-auto">
        <h1 className="font-display text-[28px] mb-6">
          Goldsainte Admin Dashboard
        </h1>
        <p className="text-[12px] text-[#4a4a4a] mb-10 max-w-xl">
          A quick overview of platform health — agent verification, trip activity,
          proposals, and disputes.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Agent Verification */}
          <AdminCard
            title="Pending Agent Verifications"
            count={pendingAgents}
            icon={<ShieldCheck className="h-6 w-6" />}
            color="bg-[#0c4d47]"
            href="/admin/agents"
          />

          {/* Pending Trip Disputes */}
          <AdminCard
            title="Pending Trip Disputes"
            count={pendingDisputes}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="bg-[#b42318]"
            href="/admin/disputes"
          />

          {/* Pending Proposals */}
          <AdminCard
            title="Pending Trip Proposals"
            count={pendingProposals}
            icon={<Briefcase className="h-6 w-6" />}
            color="bg-[#BFAD72]"
            href="/admin/proposals"
          />

          {/* Total Trip Requests */}
          <AdminCard
            title="Total Trip Requests"
            count={tripRequests}
            icon={<Users className="h-6 w-6" />}
            color="bg-[#8D8D8D]"
            href="/admin/trip-requests"
          />
        </div>
      </section>
    </main>
  );
}

function AdminCard({ title, count, icon, color, href }: any) {
  return (
    <Link
      to={href}
      className="block rounded-3xl border border-[#E5DFC6] bg-white/90 p-6 hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-[12px] font-medium">{title}</div>
        <div className={`rounded-full p-3 text-white ${color}`}>{icon}</div>
      </div>

      <div className="font-display text-[32px] leading-none mb-4">{count}</div>

      <div className="flex items-center gap-1 text-[11px] text-[#0c4d47]">
        Review now <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
