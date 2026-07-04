import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShieldCheck, AlertTriangle, CalendarCheck2, Coins, Image as ImageIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";

type OverviewMetrics = {
  pendingAgents: number;
  openDisputes: number;
  upcomingTrips: number;
  revenueCents: number;
};

const CARD_CONFIG = [
  {
    title: "Pending agent verifications",
    description: "Profiles that still need license or KYC review.",
    icon: ShieldCheck,
    href: "/admin/agents",
    key: "pendingAgents" as const,
  },
  {
    title: "Active disputes",
    description: "Bookings that require intervention before funds can move.",
    icon: AlertTriangle,
    href: "/admin/disputes",
    key: "openDisputes" as const,
  },
  {
    title: "Upcoming confirmed trips",
    description: "Trips with a confirmed booking date still ahead of us.",
    icon: CalendarCheck2,
    href: "/admin/bookings",
    key: "upcomingTrips" as const,
  },
  {
    title: "Platform revenue (30d)",
    description: "Goldsainte share of bookings created in the last 30 days.",
    icon: Coins,
    href: "/admin/bookings",
    key: "revenueCents" as const,
  },
  {
    title: "Marketplace trip photos",
    description: "Edit cover photos for all marketplace trips.",
    icon: ImageIcon,
    href: "/admin/trips",
    key: "pendingAgents" as const,
  },
  {
    title: "All users",
    description: "Manage roles, change account types, and export the user list.",
    icon: Users,
    href: "/admin/users",
    key: "pendingAgents" as const,
  },
];

export default function AdminHomePage() {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    pendingAgents: 0,
    openDisputes: 0,
    upcomingTrips: 0,
    revenueCents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      setError(null);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [agentCount, disputeCount, upcomingData, revenueRows] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("account_type", "agent")
            .or("kyc_status.neq.verified,agent_verification_status.eq.pending"),
          supabase
            .from("disputes")
            .select("id", { count: "exact", head: true })
            .in("status", ["OPEN", "UNDER_REVIEW"]),
          supabase
            .from("bookings")
            .select(
              `
              id,
              status,
              trips!inner (
                start_date
              )
            `
            )
            .eq("status", "confirmed")
            .gte("trips.start_date", new Date().toISOString().split("T")[0]),
          supabase
            .from("bookings")
            .select("platform_fee, created_at")
            .gte("created_at", thirtyDaysAgo.toISOString()),
        ]);

        if (cancelled) return;

        const revenueCents = (revenueRows.data || []).reduce(
          (sum, row) => sum + (row.platform_fee ?? 0),
          0
        );

        setMetrics({
          pendingAgents: agentCount.count || 0,
          openDisputes: disputeCount.count || 0,
          upcomingTrips: upcomingData.data?.length || 0,
          revenueCents,
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load admin overview", err);
          setError(err.message || "Could not load metrics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-4 py-1 text-[11px]">
          <ShieldCheck className="h-3 w-3 text-[#0c4d47]" />
          Goldsainte overview
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-[26px] leading-tight">Platform health at a glance</h1>
          <p className="text-sm max-w-2xl text-[#4a4a4a]">
            A quick view of what needs your attention: new agents to verify, disputes to review, and how the platform is performing.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading metrics…</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {CARD_CONFIG.map((card) => (
              <OverviewCard
                key={card.title}
                title={card.title}
                description={card.description}
                value={card.key === "revenueCents"
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                      (metrics.revenueCents || 0) / 100
                    )
                  : metrics[card.key].toString()}
                href={card.href}
                Icon={card.icon}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        <Link
          to="/admin/guides"
          className="flex items-center justify-between rounded-2xl border border-[#E5DFC6] bg-white/90 px-6 py-4 shadow-sm transition hover:shadow-lg mb-4"
        >
          <div>
            <p className="text-sm font-semibold">Guide Review</p>
            <p className="text-[12px] text-[#4a4a4a] mt-1">Approve creator & agent itinerary guides submitted for review.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#0c4d47]" />
        </Link>
        <Link
          to="/admin/seed-concierge-desks"
          className="flex items-center justify-between rounded-2xl border border-[#E5DFC6] bg-white/90 px-6 py-4 shadow-sm transition hover:shadow-lg"
        >
          <div>
            <p className="text-sm font-semibold">Create Goldsainte Concierge desks</p>
            <p className="text-[12px] text-[#4a4a4a] mt-1">One-time setup: 10 regional creator profiles, honestly labeled.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#0c4d47]" />
        </Link>
      </section>
    </main>
  );
}

type OverviewCardProps = {
  title: string;
  description: string;
  value: string;
  href: string;
  Icon: typeof ShieldCheck;
};

function OverviewCard({ title, description, value, href, Icon }: OverviewCardProps) {
  return (
    <Link
      to={href}
      className="flex flex-col justify-between rounded-3xl border border-[#E5DFC6] bg-white/90 p-6 shadow-sm transition hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[12px] text-[#4a4a4a] mt-1">{description}</p>
        </div>
        <span className="rounded-full bg-[#0c4d47]/10 p-2 text-[#0c4d47]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-display text-[28px]">{value}</span>
        <span className="inline-flex items-center gap-1 text-[12px] text-[#0c4d47] font-semibold">
          Review
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
